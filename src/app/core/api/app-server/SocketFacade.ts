import * as Socket from "socket.io-client";
import SocketDriver from "nekostore/lib/driver/socket";
import Nekostore from "nekostore/lib/Nekostore";
import NekostoreCollectionController from "@/app/core/api/app-server/NekostoreCollectionController";
import {
  PermissionNode,
  PermissionRule,
  StoreObj,
  StoreUseData
} from "@/@types/store";
import DocumentSnapshot from "nekostore/lib/DocumentSnapshot";
import TaskManager from "@/app/core/task/TaskManager";
import {
  DefaultServerInfo,
  GetVersionResponse,
  ServerTestResult
} from "@/@types/socket";
import { loadYaml } from "@/app/core/File";
import {
  SceneAndLayer,
  SceneLayer,
  Scene,
  RoomData,
  UserData,
  Image,
  ActorGroup,
  CutInDeclareInfo,
  CutInPlayingInfo,
  SceneAndObject,
  SocketUserData
} from "@/@types/room";
import {
  ExtraStore,
  SceneObject,
  PropertyFaceStore,
  PropertySelectionStore,
  PropertyStore,
  TagNoteStore,
  ActorStatusStore
} from "@/@types/gameObject";
import { ApplicationError } from "@/app/core/error/ApplicationError";
import {
  compareVersion,
  getFileRow,
  TargetVersion
} from "@/app/core/api/Github";
import yaml from "js-yaml";
import GameObjectManager from "@/app/basic/GameObjectManager";

const connectYamlPath = "/static/conf/connect.yaml";

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
          roleGroup.data!.list.findIndex(member => {
            const targetId =
              member.type === "user"
                ? SocketFacade.instance.userId
                : SocketFacade.instance.characterId;
            return member.id === targetId;
          }) > -1
        );
      }
      if (pn.type === "user") {
        if (pn.id === SocketFacade.instance.userId) return true;
      }
      if (pn.type === "character") {
        if (pn.id === SocketFacade.instance.characterId) return true;
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
  private __characterId: string | null = null;
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
    this.__connectInfo = await loadYaml(connectYamlPath);

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
      // alert("有効なアプリケーションサーバに接続できませんでした。");
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
      window.console.warn(`${err}. url:${url}`);
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

  public set characterId(val: string | null) {
    this.__characterId = val;
  }

  public get characterId(): string | null {
    return this.__characterId;
  }

  public async socketCommunication<T, U>(event: string, args?: T): Promise<U> {
    if (this.socket) {
      return this.doSocketCommunication<T, U>(event, args);
    } else {
      return new Promise<U>((resolve, reject) => {
        const intervalId = window.setInterval(async () => {
          if (this.socket) {
            clearInterval(intervalId);
            resolve(await this.doSocketCommunication<T, U>(event, args));
          }
        }, 100);
      });
    }
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
      socket.on("connect_error", async (err: any) => {
        socket.disconnect();
        reject("no-such-server");
      });
    });
  }

  public socketOn<T>(
    event: string,
    callback: (err: any, result: T) => void
  ): void {
    this.socket!.on(event, (err: any, result: T) => {
      if (err) window.console.error(err);
      callback(err, result);
    });
  }

  private roomCollectionController<T>(
    collectionNamePrefix: string
  ): NekostoreCollectionController<T> {
    const collectionName = `${this.__roomCollectionPrefix}-DATA-${collectionNamePrefix}`;
    let controller = this.collectionControllerMap[collectionName];
    if (controller) {
      return controller as NekostoreCollectionController<T>;
    }
    return (this.collectionControllerMap[
      collectionName
    ] = new NekostoreCollectionController<T>(
      this.socket,
      this.nekostore!,
      collectionName
    ));
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

  public imageDataCC(): NekostoreCollectionController<Image> {
    return this.roomCollectionController<Image>("image-list");
  }

  public imageTagCC(): NekostoreCollectionController<string> {
    return this.roomCollectionController<string>("image-tag-list");
  }

  public cutInDataCC(): NekostoreCollectionController<CutInDeclareInfo> {
    return this.roomCollectionController<CutInDeclareInfo>("cut-in-list");
  }

  public playListCC(): NekostoreCollectionController<CutInPlayingInfo> {
    return this.roomCollectionController<CutInPlayingInfo>("play-list");
  }

  public privatePlayListCC(): NekostoreCollectionController<CutInPlayingInfo> {
    return this.roomCollectionController<CutInPlayingInfo>(
      `${this.userId}-play-list`
    );
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

  public extraCC(): NekostoreCollectionController<ExtraStore> {
    return this.roomCollectionController<ExtraStore>("extra-list");
  }

  public actorGroupCC(): NekostoreCollectionController<ActorGroup> {
    return this.roomCollectionController<ActorGroup>("actor-group-list");
  }

  public getCC(type: string): NekostoreCollectionController<any> {
    switch (type) {
      case "scene":
        return this.sceneListCC();
      case "room-data":
        return this.roomDataCC();
      case "image-list":
        return this.imageDataCC();
      case "image-tag-list":
        return this.imageTagCC();
      case "cut-in-list":
        return this.cutInDataCC();
      case "play-list":
        return this.playListCC();
      case "private-play-list":
        return this.privatePlayListCC();
      case "user-list":
        return this.userCC();
      case "property-list":
        return this.propertyCC();
      case "property-selection-list":
        return this.propertySelectionCC();
      case "property-face-list":
        return this.propertyFaceCC();
      case "character":
      case "dice-symbol":
      case "floor-tile":
      case "chit":
      case "map-mask":
        return this.sceneObjectCC();
      case "extra":
        return this.extraCC();
      case "map-layer":
        return this.sceneLayerCC();
      case "map-and-layer":
        return this.sceneAndLayerCC();
      case "tag-note-list":
        return this.tagNoteCC();
      case "role-group-list":
        return this.actorGroupCC();
      default:
        throw new ApplicationError(`Invalid type error. type=${type}`);
    }
  }
}
