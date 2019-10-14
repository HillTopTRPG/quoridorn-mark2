import SocketClient from "socket.io-client";
import SocketDriver from "nekostore/lib/driver/socket";
import Nekostore from "nekostore/lib/Nekostore";
import NecostoreCollectionController from "@/app/core/socket/NecostoreCollectionController";
import { RoomInfo } from "@/@types/room";

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
    this.__socket = SocketClient.connect("http://localhost:2222");
    const driver = new SocketDriver({ socket: this.__socket });
    this.nekostore = new Nekostore(driver);
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
