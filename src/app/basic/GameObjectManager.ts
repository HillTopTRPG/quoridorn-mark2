import SocketFacade, { getStoreObj } from "../core/api/app-server/SocketFacade";
import QuerySnapshot from "nekostore/lib/QuerySnapshot";
import { StoreObj, StoreUseData } from "@/@types/store";
import { UserData } from "@/@types/room";
import { ApplicationError } from "@/app/core/error/ApplicationError";
import NecostoreCollectionController from "@/app/core/api/app-server/NecostoreCollectionController";
import {
  CharacterStore,
  ChitStore,
  DiceSymbolStore,
  ExtraStore,
  FloorTileStore,
  MapMaskStore,
  PropertyFaceStore,
  PropertySelectionStore,
  PropertyStore,
  TagNoteStore
} from "@/@types/gameObject";
import { ClientRoomInfo } from "@/@types/socket";

export default class GameObjectManager {
  // シングルトン
  public static get instance(): GameObjectManager {
    if (!GameObjectManager._instance)
      GameObjectManager._instance = new GameObjectManager();
    return GameObjectManager._instance;
  }

  private static _instance: GameObjectManager;

  // コンストラクタの隠蔽
  private constructor() {
    const setBasicSnapShot = <T>(
      c: NecostoreCollectionController<T>,
      list: StoreUseData<T>[]
    ) => {
      c.setCollectionSnapshot(
        "PlayerManager",
        (snapshot: QuerySnapshot<StoreObj<T>>) => {
          snapshot.docs.forEach(doc => {
            const index = list.findIndex(p => p.id === doc.ref.id);
            if (doc.type === "removed") {
              list.splice(index, 1);
            } else {
              list.splice(index, index < 0 ? 0 : 1, getStoreObj(doc)!);
            }
          });
        }
      );
    };
    setBasicSnapShot(SocketFacade.instance.userCC(), this.playerList);
    setBasicSnapShot(SocketFacade.instance.mapMaskCC(), this.mapMaskList);
    setBasicSnapShot(SocketFacade.instance.chitCC(), this.chitList);
    setBasicSnapShot(SocketFacade.instance.floorTileCC(), this.floorTileList);
    setBasicSnapShot(SocketFacade.instance.diceSymbolCC(), this.diceSymbolList);
    setBasicSnapShot(SocketFacade.instance.extraCC(), this.extraList);
    setBasicSnapShot(SocketFacade.instance.characterCC(), this.characterList);
    setBasicSnapShot(
      SocketFacade.instance.propertyFaceCC(),
      this.propertyFaceList
    );
    setBasicSnapShot(SocketFacade.instance.propertyCC(), this.propertyList);
    setBasicSnapShot(
      SocketFacade.instance.propertySelectionCC(),
      this.propertySelectionList
    );
    setBasicSnapShot(SocketFacade.instance.tagNoteCC(), this.tagNoteList);
  }

  private myselfId: string | null = null;

  private __clientRoomInfo: ClientRoomInfo | null = null;
  public readonly playerList: StoreUseData<UserData>[] = [];
  public readonly mapMaskList: StoreUseData<MapMaskStore>[] = [];
  public readonly chitList: StoreUseData<ChitStore>[] = [];
  public readonly floorTileList: StoreUseData<FloorTileStore>[] = [];
  public readonly diceSymbolList: StoreUseData<DiceSymbolStore>[] = [];
  public readonly extraList: StoreUseData<ExtraStore>[] = [];
  public readonly characterList: StoreUseData<CharacterStore>[] = [];
  public readonly propertyFaceList: StoreUseData<PropertyFaceStore>[] = [];
  public readonly propertyList: StoreUseData<PropertyStore>[] = [];
  public readonly propertySelectionList: StoreUseData<
    PropertySelectionStore
  >[] = [];
  public readonly tagNoteList: StoreUseData<TagNoteStore>[] = [];

  public setMyself(name: string) {
    const playerInfo = this.playerList.filter(
      p => p.data!.userName === name
    )[0];
    if (!playerInfo) throw new ApplicationError(`No such player. name=${name}`);

    this.myselfId = playerInfo.id;
  }

  public get clientRoomInfo(): ClientRoomInfo {
    if (!this.__clientRoomInfo) {
      throw new ApplicationError(
        `Unsupported operation. clientRoomInfo is null.`
      );
    }
    return this.__clientRoomInfo;
  }

  public set clientRoomInfo(info: ClientRoomInfo) {
    this.__clientRoomInfo = info;
  }

  public get mySelf(): StoreUseData<UserData> | null {
    return this.playerList.filter(p => p.id === this.myselfId)[0] || null;
  }
}
