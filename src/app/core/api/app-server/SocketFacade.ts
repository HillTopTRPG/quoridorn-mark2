import * as Socket from "socket.io-client";
import SocketDriver from "nekostore/lib/driver/socket";
import Nekostore from "nekostore/lib/Nekostore";
import DocumentSnapshot from "nekostore/lib/DocumentSnapshot";
import yaml from "js-yaml";
import {
  PermissionNode,
  PermissionRule,
  StoreObj,
  StoreUseData
} from "../../../../@types/store";
import { compareVersion, getFileRow, TargetVersion } from "../Github";
import {
  ActorStatusStore,
  ActorStore,
  CardDeckBig,
  CardDeckSmall,
  CardMeta,
  CardObject,
  ChatPaletteStore,
  InitiativeColumnStore,
  PropertyFaceStore,
  PropertySelectionStore,
  PropertyStore,
  ResourceMasterStore,
  ResourceStore,
  SceneObject,
  TagNoteStore
} from "../../../../@types/gameObject";
import {
  ActorGroup,
  ChatInfo,
  ChatTabInfo,
  CutInDeclareInfo,
  GroupChatTabInfo,
  MediaInfo,
  RoomData,
  Scene,
  SceneAndLayer,
  SceneAndObject,
  SceneLayer,
  SocketUserData,
  UserData
} from "../../../../@types/room";
import GameObjectManager from "../../../basic/GameObjectManager";
import { ApplicationError } from "../../error/ApplicationError";
import {
  DefaultServerInfo,
  GetVersionResponse,
  SendDataRequest,
  ServerTestResult
} from "../../../../@types/socket";
import NekostoreCollectionController from "./NekostoreCollectionController";
import { loadYaml } from "../../utility/FileUtility";
import TaskManager from "../../task/TaskManager";
import { ModeInfo } from "mode";

export type ConnectInfo = {
  quoridornServer: string | string[];
  bcdiceServer: string;
  skywayApiKey: string;
  skywayConnectType: string;
  socketTimeout: number;
};

export type Interoperability = {
  server: string;
  client: string;
};

export function getStoreObj<T>(
  doc: DocumentSnapshot<StoreObj<T>>
): StoreUseData<T> | null {
  if (doc.exists()) {
    const data: StoreObj<T> = doc.data;
    if (!data) return null;
    return {
      ...data,
      id: doc.ref.id
    };
  } else {
    return null;
  }
}

/**
 * パーミッションチェックを行う。
 * @param data
 * @param type
 * @return 許可されているならtrue
 */
export function permissionCheck(
  data: StoreObj<unknown>,
  type: "view" | "edit" | "chmod"
): boolean {
  if (!data!.permission) return true;

  // GMはどんな設定でも許可
  if (GameObjectManager.instance.isGm) return true;

  let permissionRule: PermissionRule;
  if (type === "view") permissionRule = data!.permission!.view;
  else if (type === "edit") permissionRule = data!.permission!.edit;
  else permissionRule = data!.permission!.chmod;

  let result = permissionRule.type !== "allow";
  if (permissionRule.list.length) {
    const check = (pn: PermissionNode) => {
      if (pn.type === "group") {
        const roleGroup = GameObjectManager.instance.actorGroupList.filter(
          r => r.id === pn.id
        )[0];
        if (!roleGroup) return false;
        return (
          roleGroup.data!.list.findIndex(actorRef => {
            if (actorRef.type === "user")
              return SocketFacade.instance.userId === actorRef.id;

            return !!GameObjectManager.instance.actorList.filter(
              a =>
                a.id === actorRef.id ||
                a.owner === GameObjectManager.instance.mySelfUserId
            )[0];
          }) > -1
        );
      }
      if (pn.type === "actor") {
        if (pn.id === GameObjectManager.instance.mySelfActorId) return true;
      }
      if (pn.type === "owner") {
        if (data.owner === SocketFacade.instance.userId) return true;
      }
      return false;
    };
    if (permissionRule.list.findIndex(check) > -1) result = !result;
  }
  return result;
}

export default class SocketFacade {
  // シングルトン
  public static get instance(): SocketFacade {
    if (!SocketFacade._instance) SocketFacade._instance = new SocketFacade();
    return SocketFacade._instance;
  }

  private static _instance: SocketFacade;

  private socket: SocketIOClient.Socket | null = null;
  private nekostore: Nekostore | null = null;
  private __appServerUrl: string | null = null;
  private readonly __appServerUrlList: DefaultServerInfo[] = [];
  private readonly collectionControllerMap: {
    [name: string]: NekostoreCollectionController<unknown>;
  } = {};
  private __roomCollectionPrefix: string | null = null;
  private __userId: string | null = null;
  private __connectInfo: ConnectInfo | null = null;
  private __interoperability: Interoperability[] | null = null;
  private targetServer: TargetVersion = {
    from: null,
    to: null
  };

  public get appServerUrl(): string {
    return this.__appServerUrl!;
  }

  public get connectInfo(): ConnectInfo {
    return this.__connectInfo!;
  }

  public get appServerUrlList(): DefaultServerInfo[] {
    return this.__appServerUrlList;
  }

  // コンストラクタの隠蔽
  private constructor() {}

  public async init() {
    // 読み込み必須のためthrowは伝搬させる
    this.__connectInfo = await loadYaml<ConnectInfo>(
      "/static/conf/connect.yaml"
    );

    // 相互運用性チェック
    try {
      this.__interoperability = (yaml as any).safeLoad(
        await getFileRow("quoridorn-server", "src/interoperability.yaml")
      );
    } catch (err) {
      //
    }
    if (this.__interoperability) {
      const iList = this.__interoperability;
      const clientVersion = process.env.VUE_APP_VERSION as string;
      if (compareVersion(iList[0].client, clientVersion) <= 0) {
        // クライアントが最新系
        this.targetServer.from = iList[0].server;
      } else {
        // クライアントは最新系ではない
        iList.forEach((i, index) => {
          if (!index) return;
          if (
            compareVersion(iList[index - 1].client, clientVersion) > 0 &&
            compareVersion(i.client, clientVersion) <= 0
          ) {
            this.targetServer.from = i.server;
            this.targetServer.to = iList[index - 1].server;
          }
        });
      }
    }

    await this.setDefaultServerUrlList();
    const serverInfo = this.appServerUrlList[0];
    if (!serverInfo) {
      swal({
        title: "通信エラー",
        text: "有効なアプリケーションサーバに接続できませんでした。",
        icon: "error"
      });

      await TaskManager.instance.ignition<ModeInfo, never>({
        type: "mode-change",
        owner: "Quoridorn",
        value: {
          type: "view-progress",
          value: { message: "", all: 0, current: 0 }
        }
      });
      return;
    }
    await this.setAppServerUrl(serverInfo.url);
  }

  public async setAppServerUrl(appServerUrl: string) {
    this.__appServerUrl = appServerUrl;
    if (this.socket) await this.destroy();
    this.socket = Socket.connect(appServerUrl);
    this.nekostore = new Nekostore(
      new SocketDriver({
        socket: this.socket,
        timeout: this.__connectInfo!.socketTimeout
      })
    );
    this.socket.on("connect", async () => {
      await TaskManager.instance.ignition<never, never>({
        type: "socket-connect",
        owner: "Quoridorn",
        value: null
      });
    });
    this.socket.on("connect_error", async (err: any) => {
      await TaskManager.instance.ignition<any, never>({
        type: "socket-connect-error",
        owner: "Quoridorn",
        value: err
      });
    });
    this.socket.on("reconnecting", async (err: any) => {
      await TaskManager.instance.ignition<any, never>({
        type: "socket-reconnecting",
        owner: "Quoridorn",
        value: err
      });
    });
    this.socket.on("connect_timeout", async (timeout: any) => {
      window.console.log("connect_timeout", timeout);
    });
  }

  private async setDefaultServerUrlList() {
    if (typeof this.__connectInfo!.quoridornServer === "string") {
      await this.addDefaultUrl(this.__connectInfo!.quoridornServer);
    } else {
      // addDefaultUrlを直列の非同期で全部実行する
      this.__connectInfo!.quoridornServer.map((url: string) => () =>
        this.addDefaultUrl(url)
      ).reduce((prev, curr) => prev.then(curr), Promise.resolve());
    }
  }

  private async addDefaultUrl(url: string): Promise<void> {
    let resp: ServerTestResult;
    try {
      resp = await this.testServer(url);
    } catch (err) {
      window.console.error(`${err}. url:${url}`);
      return;
    }
    this.appServerUrlList.push({
      ...resp,
      url
    });
  }

  public async destroy() {
    await Object.keys(this.collectionControllerMap)
      .map((collectionName: string) => () =>
        this.collectionControllerMap[collectionName].destroy()
      )
      .reduce((prev, curr) => prev.then(curr), Promise.resolve());
    Object.keys(this.collectionControllerMap).forEach(
      (collectionName: string) => {
        delete this.collectionControllerMap[collectionName];
      }
    );
    this.socket!.disconnect();
  }

  public set roomCollectionPrefix(val: string | null) {
    this.__roomCollectionPrefix = val;
  }

  public set userId(val: string | null) {
    this.__userId = val;
  }

  public get userId(): string | null {
    return this.__userId;
  }

  public async socketCommunication<T, U>(event: string, args?: T): Promise<U> {
    if (this.socket) {
      return this.doSocketCommunication<T, U>(event, args);
    } else {
      return new Promise<U>(resolve => {
        const intervalId = window.setInterval(async () => {
          if (this.socket) {
            clearInterval(intervalId);
            resolve(await this.doSocketCommunication<T, U>(event, args));
          }
        }, 100);
      });
    }
  }

  public async sendData<T>(args: Partial<SendDataRequest<T>>) {
    if (!args.data) args.data = null;
    if (!args.targetList)
      args.targetList = GameObjectManager.instance.userList.map(u => u.id!);
    if (!args.dataType) args.dataType = "general-data";
    if (!args.owner) args.owner = GameObjectManager.instance.mySelfUserId;
    await this.socketCommunication<SendDataRequest<T>, void>(
      "send-data",
      args as SendDataRequest<T>
    );
  }

  private async doSocketCommunication<T, U>(
    event: string,
    args?: T
  ): Promise<U> {
    return new Promise<U>((resolve, reject) => {
      this.socket!.once(`result-${event}`, (err: any, result: U) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
      this.socket!.emit(event, args);
    });
  }

  public async testServer(url: string): Promise<ServerTestResult> {
    return new Promise<ServerTestResult>((resolve, reject) => {
      const socket = Socket.connect(url);
      socket.on("connect", async () => {
        socket.emit("get-version");
      });
      const timeoutId = window.setTimeout(() => {
        socket.off("result-get-version");
        socket.disconnect();
        window.console.warn("timeout");
        reject("not-quoridorn");
      }, this.__connectInfo!.socketTimeout + 100);
      socket.once(
        "result-get-version",
        (err: any, result: GetVersionResponse) => {
          clearTimeout(timeoutId);
          socket.disconnect();
          if (err) {
            reject("internal-server-error");
            return;
          }

          // タイトルチェック（サーバ側で必ず値は設定してくる）
          const title: string = result.title;
          if (!title) {
            window.console.warn("title-check");
            reject("not-quoridorn");
            return;
          }

          const serverVersion: string = result.version;
          if (!serverVersion || !serverVersion.startsWith("Quoridorn ")) {
            window.console.warn("version format");
            reject("not-quoridorn");
            return;
          }
          let usable: boolean = false;
          if (this.__interoperability) {
            if (this.targetServer.from) {
              if (this.targetServer.to) {
                usable =
                  compareVersion(this.targetServer.from, serverVersion) <= 0 &&
                  compareVersion(this.targetServer.to, serverVersion) > 0;
              } else {
                usable =
                  compareVersion(this.targetServer.from, serverVersion) <= 0;
              }
            }
          }

          // 応答を返却
          resolve({
            serverVersion: result.version,
            title: result.title,
            targetClient: result.targetClient,
            targetServer: this.targetServer,
            usable
          });
        }
      );
      socket.on("connect_error", async () => {
        socket.disconnect();
        reject("no-such-server");
      });
    });
  }

  public socketOn<T>(
    event: string,
    callback: (err: any, result: T) => void
  ): void {
    if (!this.socket) return;
    this.socket.on(event, (err: any, result: T) => {
      if (err) window.console.error(err);
      callback(err, result);
    });
  }

  private roomCollectionController<T>(
    collectionNamePrefix: string
  ): NekostoreCollectionController<T> {
    const collectionName = `${this.__roomCollectionPrefix}-DATA-${collectionNamePrefix}`;
    let controller = this.collectionControllerMap[collectionName];
    if (controller) return controller as NekostoreCollectionController<T>;
    return (this.collectionControllerMap[
      collectionName
    ] = new NekostoreCollectionController<T>(
      this.socket,
      this.nekostore!,
      collectionName
    ));
  }

  public chatListCC(): NekostoreCollectionController<ChatInfo> {
    return this.roomCollectionController<ChatInfo>("chat-list");
  }

  public chatTabListCC(): NekostoreCollectionController<ChatTabInfo> {
    return this.roomCollectionController<ChatTabInfo>("chat-tab-list");
  }

  public groupChatTabListCC(): NekostoreCollectionController<GroupChatTabInfo> {
    return this.roomCollectionController<GroupChatTabInfo>(
      "group-chat-tab-list"
    );
  }

  public sceneListCC(): NekostoreCollectionController<Scene> {
    return this.roomCollectionController<Scene>("scene-list");
  }

  public sceneLayerCC(): NekostoreCollectionController<SceneLayer> {
    return this.roomCollectionController<SceneLayer>("scene-layer-list");
  }

  public sceneObjectCC(): NekostoreCollectionController<SceneObject> {
    return this.roomCollectionController<SceneObject>("scene-object-list");
  }

  public actorStatusCC(): NekostoreCollectionController<ActorStatusStore> {
    return this.roomCollectionController<ActorStatusStore>("status-list");
  }

  public sceneAndLayerCC(): NekostoreCollectionController<SceneAndLayer> {
    return this.roomCollectionController<SceneAndLayer>("scene-and-layer-list");
  }

  public sceneAndObjectCC(): NekostoreCollectionController<SceneAndObject> {
    return this.roomCollectionController<SceneAndObject>(
      "scene-and-object-list"
    );
  }

  public tagNoteCC(): NekostoreCollectionController<TagNoteStore> {
    return this.roomCollectionController<TagNoteStore>("tag-note-list");
  }

  public roomDataCC(): NekostoreCollectionController<RoomData> {
    return this.roomCollectionController<RoomData>("room-data");
  }

  public mediaCC(): NekostoreCollectionController<MediaInfo> {
    return this.roomCollectionController<MediaInfo>("media-list");
  }

  public imageTagCC(): NekostoreCollectionController<string> {
    return this.roomCollectionController<string>("image-tag-list");
  }

  public cutInDataCC(): NekostoreCollectionController<CutInDeclareInfo> {
    return this.roomCollectionController<CutInDeclareInfo>("cut-in-list");
  }

  public userCC(): NekostoreCollectionController<UserData> {
    return this.roomCollectionController<UserData>("user-list");
  }

  public socketUserCC(): NekostoreCollectionController<SocketUserData> {
    return this.roomCollectionController<SocketUserData>("socket-user-list");
  }

  public propertyCC(): NekostoreCollectionController<PropertyStore> {
    return this.roomCollectionController<PropertyStore>("property-list");
  }

  public resourceMasterCC(): NekostoreCollectionController<
    ResourceMasterStore
  > {
    return this.roomCollectionController<ResourceMasterStore>(
      "resource-master-list"
    );
  }

  public resourceCC(): NekostoreCollectionController<ResourceStore> {
    return this.roomCollectionController<ResourceStore>("resource-list");
  }

  public initiativeColumnCC(): NekostoreCollectionController<
    InitiativeColumnStore
  > {
    return this.roomCollectionController<InitiativeColumnStore>(
      "initiative-column-list"
    );
  }

  public propertySelectionCC(): NekostoreCollectionController<
    PropertySelectionStore
  > {
    return this.roomCollectionController<PropertySelectionStore>(
      "property-selection-list"
    );
  }

  public propertyFaceCC(): NekostoreCollectionController<PropertyFaceStore> {
    return this.roomCollectionController<PropertyFaceStore>(
      "property-face-list"
    );
  }

  public actorCC(): NekostoreCollectionController<ActorStore> {
    return this.roomCollectionController<ActorStore>("actor-list");
  }

  public actorGroupCC(): NekostoreCollectionController<ActorGroup> {
    return this.roomCollectionController<ActorGroup>("actor-group-list");
  }

  public cardMetaCC(): NekostoreCollectionController<CardMeta> {
    return this.roomCollectionController<CardMeta>("card-meta-list");
  }

  public cardObjectCC(): NekostoreCollectionController<CardObject> {
    return this.roomCollectionController<CardObject>("card-object-list");
  }

  public cardDeckBigCC(): NekostoreCollectionController<CardDeckBig> {
    return this.roomCollectionController<CardDeckBig>("card-deck-big-list");
  }

  public cardDeckSmallCC(): NekostoreCollectionController<CardDeckSmall> {
    return this.roomCollectionController<CardDeckSmall>("card-deck-small-list");
  }

  public chatPaletteListCC(): NekostoreCollectionController<ChatPaletteStore> {
    return this.roomCollectionController<ChatPaletteStore>("chat-palette-list");
  }

  public getCC(type: string): NekostoreCollectionController<any> {
    switch (type) {
      case "chat":
        return this.chatListCC();
      case "chat-tab":
        return this.chatTabListCC();
      case "group-chat-tab":
        return this.groupChatTabListCC();
      case "scene":
        return this.sceneListCC();
      case "room-data":
        return this.roomDataCC();
      case "media":
        return this.mediaCC();
      case "image-tag":
        return this.imageTagCC();
      case "cut-in":
        return this.cutInDataCC();
      case "user":
        return this.userCC();
      case "property":
        return this.propertyCC();
      case "resource-master":
        return this.resourceMasterCC();
      case "resource":
        return this.resourceCC();
      case "initiative-column":
        return this.initiativeColumnCC();
      case "property-selection":
        return this.propertySelectionCC();
      case "property-face":
        return this.propertyFaceCC();
      case "character":
      case "dice-symbol":
      case "floor-tile":
      case "chit":
      case "map-mask":
        return this.sceneObjectCC();
      case "actor":
        return this.actorCC();
      case "map-layer":
        return this.sceneLayerCC();
      case "map-and-layer":
        return this.sceneAndLayerCC();
      case "tag-note":
        return this.tagNoteCC();
      case "actor-group":
        return this.actorGroupCC();
      case "card-meta":
        return this.cardMetaCC();
      case "card-object":
        return this.cardObjectCC();
      case "card-deck-big":
        return this.cardDeckBigCC();
      case "card-deck-small":
        return this.cardDeckSmallCC();
      case "chat-palette":
        return this.chatPaletteListCC();
      default:
        throw new ApplicationError(`Invalid type error. type=${type}`);
    }
  }
}
