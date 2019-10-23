import SocketClient from "socket.io-client";
import SocketDriver from "nekostore/lib/driver/socket";
import Nekostore from "nekostore/lib/Nekostore";
import NecostoreCollectionController, {
  CollectionType
} from "@/app/core/api/app-server/NecostoreCollectionController";
import { StoreMetaData, StoreObj } from "@/@types/store";
import DocumentSnapshot from "nekostore/lib/DocumentSnapshot";
import { ConnectInfo } from "@/@types/connect";
import TaskManager from "@/app/core/task/TaskManager";

const connectInfo: ConnectInfo = require("../../../../../public/static/conf/connect.yaml");

export function getStoreObj<T>(
  doc: DocumentSnapshot<StoreObj<T>>
): (StoreObj<T> & StoreMetaData) | null {
  if (doc.exists()) {
    const data: StoreObj<T> = doc.data;
    return {
      ...data,
      id: doc.ref.id,
      createTime: doc.createTime ? doc.createTime.toDate() : null,
      updateTime: doc.updateTime ? doc.updateTime.toDate() : null
    };
  } else {
    return null;
  }
}

export default class SocketFacade {
  // シングルトン
  public static get instance(): SocketFacade {
    if (!SocketFacade._instance) SocketFacade._instance = new SocketFacade();
    return SocketFacade._instance;
  }

  private static _instance: SocketFacade;

  private readonly __socket: SocketIOClient.Socket;
  private readonly nekostore: Nekostore;
  private readonly collectionControllerMap: {
    [name: string]: NecostoreCollectionController<unknown>;
  } = {};
  private __roomCollectionSuffix: string | null = null;

  // コンストラクタの隠蔽
  private constructor() {
    this.__socket = SocketClient.connect(connectInfo.quoridornServer);
    const driver = new SocketDriver({
      socket: this.__socket,
      timeout: connectInfo.socketTimeout
    });
    this.nekostore = new Nekostore(driver);
    this.__socket.on("connect", async () => {
      await TaskManager.instance.ignition<never, never>({
        type: "socket-connect",
        owner: "Quoridorn",
        value: null
      });
    });
    this.__socket.on("connect_error", async (err: any) => {
      await TaskManager.instance.ignition<any, never>({
        type: "socket-connect-error",
        owner: "Quoridorn",
        value: err
      });
    });
    this.__socket.on("reconnecting", async (err: any) => {
      await TaskManager.instance.ignition<any, never>({
        type: "socket-reconnecting",
        owner: "Quoridorn",
        value: err
      });
    });
    this.__socket.on("connect_timeout", async (timeout: any) => {
      window.console.log("connect_timeout", timeout);
    });
  }

  public async destroy() {
    await Object.keys(this.collectionControllerMap)
      .map((collectionName: string) => () =>
        this.collectionControllerMap[collectionName].destroy()
      )
      .reduce((prev, curr) => prev.then(curr), Promise.resolve());
    this.__socket.disconnect();
  }

  public set roomCollectionSuffix(val: string) {
    this.__roomCollectionSuffix = val;
    window.console.log(val);
  }

  private roomCollectionController<T>(
    collectionNamePrefix: string,
    types: CollectionType[]
  ): NecostoreCollectionController<T> {
    const collectionName = collectionNamePrefix + this.__roomCollectionSuffix;
    let controller = this.collectionControllerMap[collectionName];
    if (controller) {
      return this.collectionControllerMap[
        collectionName
      ] as NecostoreCollectionController<T>;
    }
    return (this.collectionControllerMap[
      collectionName
    ] = new NecostoreCollectionController<T>(
      this.__socket,
      this.nekostore,
      collectionName,
      types
    ));
  }

  public async socketCommunication<T>(event: string, args?: any): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      window.console.log("socketCommunication:", event);
      this.__socket.once(`result-${event}`, (err: any, result: T) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
      this.__socket.emit(event, args);
    });
  }

  public socketOn<T>(
    event: string,
    callback: (err: any, result: T) => void
  ): void {
    this.__socket.on(event, (err: any, result: T) => {
      if (err) window.console.error(err);
      callback(err, result);
    });
  }
}
