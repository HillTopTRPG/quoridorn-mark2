import * as Socket from "socket.io-client";
import SocketDriver from "nekostore/lib/driver/socket";
import Nekostore from "nekostore/lib/Nekostore";
import yaml from "js-yaml";
import { compareVersion, getFileRow, TargetVersion } from "../Github";
import {
  ActorStatusStore,
  ActorStore,
  CardDeckBigStore,
  CardDeckSmallStore,
  CardMetaStore,
  CardObjectStore,
  KeepBcdiceDiceRollResultStore,
  ChatPaletteStore,
  InitiativeColumnStore,
  PropertySelectionStore,
  ResourceMasterStore,
  ResourceStore,
  SceneObjectStore,
  MemoStore,
  PublicMemoStore,
  LikeStore,
  ActorGroupStore,
  ChatStore,
  ChatTabInfoStore,
  CutInStore,
  GroupChatTabInfoStore,
  MediaStore,
  RoomDataStore,
  SceneStore,
  SceneAndLayerStore,
  SceneAndObjectStore,
  SceneLayerStore,
  SocketUserStore,
  UserStore
} from "@/@types/store-data";
import GameObjectManager from "../../../basic/GameObjectManager";
import { ApplicationError } from "../../error/ApplicationError";
import {
  DefaultServerInfo,
  DiceAndPips,
  DiceType,
  GetVersionResponse,
  SendDataRequest,
  ServerTestResult
} from "@/@types/socket";
import NekostoreCollectionController from "./NekostoreCollectionController";
import { loadYaml } from "../../utility/FileUtility";
import TaskManager from "../../task/TaskManager";
import { ModeInfo } from "mode";
import { findByKey } from "@/app/core/utility/Utility";

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

/**
 * パーミッションチェックを行う。
 * @param data
 * @param type
 * @param ownerLevel
 * @return 許可されているならtrue
 */
export function permissionCheck(
  data: StoreData<any>,
  type: "view" | "edit" | "chmod",
  ownerLevel: number = 0
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
        const roleGroup = findByKey(
          GameObjectManager.instance.actorGroupList,
          pn.key || null
        );
        if (!roleGroup) return false;
        return (
          roleGroup.data!.list.findIndex(actorRef => {
            if (actorRef.type === "user")
              return SocketFacade.instance.userKey === actorRef.userKey;

            return GameObjectManager.instance.actorList.some(
              a =>
                a.key === actorRef.key ||
                a.owner === SocketFacade.instance.userKey
            );
          }) > -1
        );
      }
      if (pn.type === "actor") {
        if (pn.key === GameObjectManager.instance.mySelfActorKey) return true;
      }
      if (pn.type === "owner") {
        let obj = data;
        for (let i = 0; i < ownerLevel; i++) {
          obj = GameObjectManager.instance.getOwner(obj)!;
        }
        if (obj.owner === SocketFacade.instance.userKey) return true;
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
  private __userKey: string | null = null;
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
      "static/conf/connect.yaml"
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
      await swal({
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
      console.log("connect_timeout", timeout);
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
      console.error(`${err}. url:${url}`);
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

  public set userKey(val: string | null) {
    this.__userKey = val;
  }

  public get userKey(): string | null {
    return this.__userKey;
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
      args.targetList = GameObjectManager.instance.userList.map(u => u.key);
    if (!args.dataType) args.dataType = "general-data";
    if (!args.owner) args.owner = SocketFacade.instance.userKey!;
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
        console.warn("timeout");
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
            console.warn("title-check");
            reject("not-quoridorn");
            return;
          }

          const serverVersion: string = result.version;
          if (!serverVersion || !serverVersion.startsWith("Quoridorn ")) {
            console.warn("version format");
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
      if (err) console.error(err);
      callback(err, result);
    });
  }

  private roomCollectionController<T>(
    suffix: string
  ): NekostoreCollectionController<T> {
    const collectionName = `${this.__roomCollectionPrefix}-DATA-${suffix}`;
    let controller = this.collectionControllerMap[collectionName];
    if (controller) return controller as NekostoreCollectionController<T>;

    const cc = new NekostoreCollectionController<T>(
      this.socket,
      this.nekostore!,
      collectionName,
      suffix
    );
    this.collectionControllerMap[collectionName] = cc;

    return cc;
  }

  public chatListCC() {
    return this.roomCollectionController<ChatStore>("chat-list");
  }

  public chatTabListCC() {
    return this.roomCollectionController<ChatTabInfoStore>("chat-tab-list");
  }

  public groupChatTabListCC() {
    return this.roomCollectionController<GroupChatTabInfoStore>(
      "group-chat-tab-list"
    );
  }

  public sceneListCC() {
    return this.roomCollectionController<SceneStore>("scene-list");
  }

  public sceneLayerCC() {
    return this.roomCollectionController<SceneLayerStore>("scene-layer-list");
  }

  public sceneObjectCC() {
    return this.roomCollectionController<SceneObjectStore>("scene-object-list");
  }

  public actorStatusCC() {
    return this.roomCollectionController<ActorStatusStore>("status-list");
  }

  public sceneAndLayerCC() {
    return this.roomCollectionController<SceneAndLayerStore>(
      "scene-and-layer-list"
    );
  }

  public sceneAndObjectCC() {
    return this.roomCollectionController<SceneAndObjectStore>(
      "scene-and-object-list"
    );
  }

  public roomDataCC() {
    return this.roomCollectionController<RoomDataStore>("room-data");
  }

  public mediaCC() {
    return this.roomCollectionController<MediaStore>("media-list");
  }

  public cutInDataCC() {
    return this.roomCollectionController<CutInStore>("cut-in-list");
  }

  public userCC() {
    return this.roomCollectionController<UserStore>("user-list");
  }

  public socketUserCC() {
    return this.roomCollectionController<SocketUserStore>("socket-user-list");
  }

  public resourceMasterCC() {
    return this.roomCollectionController<ResourceMasterStore>(
      "resource-master-list"
    );
  }

  public resourceCC() {
    return this.roomCollectionController<ResourceStore>("resource-list");
  }

  public initiativeColumnCC() {
    return this.roomCollectionController<InitiativeColumnStore>(
      "initiative-column-list"
    );
  }

  public propertySelectionCC() {
    return this.roomCollectionController<PropertySelectionStore>(
      "property-selection-list"
    );
  }

  public actorCC() {
    return this.roomCollectionController<ActorStore>("actor-list");
  }

  public actorGroupCC() {
    return this.roomCollectionController<ActorGroupStore>("actor-group-list");
  }

  public cardMetaCC() {
    return this.roomCollectionController<CardMetaStore>("card-meta-list");
  }

  public cardObjectCC() {
    return this.roomCollectionController<CardObjectStore>("card-object-list");
  }

  public cardDeckBigCC() {
    return this.roomCollectionController<CardDeckBigStore>(
      "card-deck-big-list"
    );
  }

  public cardDeckSmallCC() {
    return this.roomCollectionController<CardDeckSmallStore>(
      "card-deck-small-list"
    );
  }

  public chatPaletteListCC() {
    return this.roomCollectionController<ChatPaletteStore>("chat-palette-list");
  }

  public diceTypeListCC() {
    return this.roomCollectionController<DiceType>("dice-type-list");
  }

  public diceAndPipsListCC() {
    return this.roomCollectionController<DiceAndPips>("dice-and-pips-list");
  }

  public memoCC() {
    return this.roomCollectionController<MemoStore>("memo-list");
  }

  public keepBcdiceDiceRollResultListCC() {
    return this.roomCollectionController<KeepBcdiceDiceRollResultStore>(
      "chat-bcdice-dice-roll-result-list"
    );
  }

  public publicMemoListCC() {
    return this.roomCollectionController<PublicMemoStore>("public-memo-list");
  }

  public likeListCC() {
    return this.roomCollectionController<LikeStore>("like-list");
  }

  public getCC(type: string): NekostoreCollectionController<any> {
    const cc = <NekostoreCollectionController<any>>(
      [
        this.chatListCC(),
        this.chatTabListCC(),
        this.groupChatTabListCC(),
        this.sceneListCC(),
        this.sceneLayerCC(),
        this.sceneObjectCC(),
        this.actorStatusCC(),
        this.sceneAndLayerCC(),
        this.sceneAndObjectCC(),
        this.roomDataCC(),
        this.mediaCC(),
        this.cutInDataCC(),
        this.userCC(),
        this.socketUserCC(),
        this.resourceMasterCC(),
        this.resourceCC(),
        this.initiativeColumnCC(),
        this.propertySelectionCC(),
        this.actorCC(),
        this.actorGroupCC(),
        this.cardMetaCC(),
        this.cardObjectCC(),
        this.cardDeckBigCC(),
        this.cardDeckSmallCC(),
        this.chatPaletteListCC(),
        this.diceTypeListCC(),
        this.diceAndPipsListCC(),
        this.memoCC(),
        this.keepBcdiceDiceRollResultListCC(),
        this.publicMemoListCC(),
        this.likeListCC()
      ].find(cc => cc.collectionNameSuffix === type)
    );
    if (!cc) throw new ApplicationError(`Invalid type error. type=${type}`);
    return cc;
  }
}
