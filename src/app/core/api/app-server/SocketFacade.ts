import SocketClient from "socket.io-client";
import SocketDriver from "nekostore/lib/driver/socket";
import Nekostore from "nekostore/lib/Nekostore";
import { RoomInfo } from "@/@types/room";
import NecostoreCollectionController from "@/app/core/api/app-server/NecostoreCollectionController";
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

  // コンストラクタの隠蔽
  private constructor() {
    this.__socket = SocketClient.connect(connectInfo.quoridornServer);
    const driver = new SocketDriver({ socket: this.__socket });
    this.nekostore = new Nekostore(driver);
    this.__socket.on("connect", async (err: any) => {
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
  }

  public destroy() {
    this.__socket.disconnect();
  }

  private generateCollectionController<T>(
    collectionName: string
  ): NecostoreCollectionController<T> {
    return new NecostoreCollectionController<T>(this.nekostore, collectionName);
  }

  public generateRoomInfoController(): NecostoreCollectionController<RoomInfo> {
    return this.generateCollectionController<RoomInfo>("quoridorn-room-list");
  }

  public async socketCommunication<T>(event: string, args?: any): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      window.console.log("socketCommunication:", event);
      const resultEvent = `result-${event}`;
      const func = (err: string | null, result: T) => {
        this.__socket.off(resultEvent, func);
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      };
      this.__socket.on(resultEvent, func);
      this.__socket.emit(event, args);
    });
  }
}
