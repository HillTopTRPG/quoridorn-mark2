import * as Socket from "socket.io-client";
import SocketDriver from "nekostore/lib/driver/socket";
import Nekostore from "nekostore/lib/Nekostore";
import NecostoreCollectionController from "@/app/core/api/app-server/NecostoreCollectionController";
import { StoreMetaData, StoreObj } from "@/@types/store";
import DocumentSnapshot from "nekostore/lib/DocumentSnapshot";
import { ConnectInfo } from "@/@types/connect";
import TaskManager from "@/app/core/task/TaskManager";
import { GetVersionResponse } from "@/@types/socket";
import { loadYaml } from "@/app/core/File";
import { Image } from "@/@types/image";

const connectYamlPath = "/static/conf/connect.yaml";

export function getStoreObj<T>(
  doc: DocumentSnapshot<StoreObj<T>>
): (StoreObj<T> & StoreMetaData) | null {
  if (doc.exists()) {
    const data: StoreObj<T> = doc.data;
    return {
      ...data,
      id: doc.ref.id
    };
  } else {
    return null;
  }
}

export type DefaultServerInfo = {
  title: string;
  version: string;
  url: string;
};

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
    [name: string]: NecostoreCollectionController<unknown>;
  } = {};
  private __roomCollectionPrefix: string | null = null;
  private __connectInfo: ConnectInfo | null = null;

  public get appServerUrl(): string {
    return this.__appServerUrl!;
  }

  public get connectInfo(): ConnectInfo {
    return this.__connectInfo!;
  }

  public get appServerUrlList(): DefaultServerInfo[] {
    return this.__appServerUrlList;
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
      this.__appServerUrlList.push({
        ...(await this.testServer(this.__connectInfo!.quoridornServer)),
        url: this.__connectInfo!.quoridornServer
      });
    } else {
      // addDefaultUrlを直列の非同期で全部実行する
      this.__connectInfo!.quoridornServer.map((url: string) => () =>
        this.addDefaultUrl(url)
      ).reduce((prev, curr) => prev.then(curr), Promise.resolve());
    }
  }

  private async addDefaultUrl(url: string): Promise<void> {
    let resp: GetVersionResponse;
    try {
      resp = await this.testServer(url);
    } catch (err) {
      window.console.warn(`${err}. url:${url}`);
      return;
    }
    window.console.log(url, resp.title);
    this.appServerUrlList.push({
      ...resp,
      url
    });
  }

  // コンストラクタの隠蔽
  private constructor() {
    this.asyncConstructor().then();
  }

  private async asyncConstructor() {
    this.__connectInfo = await loadYaml(connectYamlPath);
    const appServerUrl =
      typeof this.__connectInfo!.quoridornServer === "string"
        ? this.__connectInfo!.quoridornServer
        : this.__connectInfo!.quoridornServer[0];
    await this.setAppServerUrl(appServerUrl);
    await this.setDefaultServerUrlList();
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

  public set roomCollectionPrefix(val: string) {
    this.__roomCollectionPrefix = val;
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

  public async testServer(url: string): Promise<GetVersionResponse> {
    return new Promise<GetVersionResponse>((resolve, reject) => {
      const socket = Socket.connect(url);
      socket.on("connect", async () => {
        socket.emit("get-version");
      });
      const timeoutId = window.setTimeout(() => {
        socket.off("result-get-version");
        socket.disconnect();
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
            reject("not-quoridorn");
            return;
          }

          // TODO バージョン互換性チェック
          const version: string = result.version;
          if (!version || !version.startsWith("Quoridorn ")) {
            reject("not-quoridorn");
            return;
          }
          resolve(result);
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
  ): NecostoreCollectionController<T> {
    const collectionName = `${this.__roomCollectionPrefix}-DATA-${collectionNamePrefix}`;
    let controller = this.collectionControllerMap[collectionName];
    if (controller) {
      return controller as NecostoreCollectionController<T>;
    }
    return (this.collectionControllerMap[
      collectionName
    ] = new NecostoreCollectionController<T>(
      this.socket,
      this.nekostore!,
      collectionName
    ));
  }

  public mapListCollectionController() {
    return this.roomCollectionController<MapSetting>("map-list");
  }

  public roomDataCollectionController() {
    return this.roomCollectionController<RoomData>("room-data");
  }

  public imageDataCollectionController() {
    return this.roomCollectionController<Image>("image-list");
  }

  public imageTagCollectionController() {
    return this.roomCollectionController<string>("image-tag");
  }
}
