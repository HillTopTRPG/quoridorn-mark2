import SocketFacade, { getStoreObj } from "../core/api/app-server/SocketFacade";
import QuerySnapshot from "nekostore/lib/QuerySnapshot";
import { StoreObj, StoreUseData } from "@/@types/store";
import { MapAndLayer, MapLayer, UserData } from "@/@types/room";
import { ApplicationError } from "@/app/core/error/ApplicationError";
import NekostoreCollectionController from "@/app/core/api/app-server/NekostoreCollectionController";
import {
  CharacterStore,
  ChitStore,
  DiceSymbolStore,
  ExtraStore,
  FloorTileStore,
  MapMaskStore,
  MapObject,
  PropertyFaceStore,
  PropertySelectionStore,
  PropertyStore,
  TagNoteStore
} from "@/@types/gameObject";
import { ClientRoomInfo } from "@/@types/socket";
import { Image } from "@/@types/image";
import { ImageTagInfo } from "@/app/basic/image/store_public_image";

export default class GameObjectManager {
  // シングルトン
  public static get instance(): GameObjectManager {
    if (!GameObjectManager._instance)
      GameObjectManager._instance = new GameObjectManager();
    return GameObjectManager._instance;
  }

  private static _instance: GameObjectManager;

  // コンストラクタの隠蔽
  private constructor() {}

  private async initialize() {
    const setBasicSnapShot = async <T>(
      c: NekostoreCollectionController<T>,
      list: StoreUseData<T>[]
    ) => {
      await c.setCollectionSnapshot(
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
    await setBasicSnapShot(SocketFacade.instance.imageDataCC(), this.imageList);
    await setBasicSnapShot(
      SocketFacade.instance.imageTagCC(),
      this.imageTagList
    );
    await setBasicSnapShot(SocketFacade.instance.userCC(), this.playerList);
    await setBasicSnapShot(SocketFacade.instance.mapMaskCC(), this.mapMaskList);
    await setBasicSnapShot(SocketFacade.instance.chitCC(), this.chitList);
    await setBasicSnapShot(
      SocketFacade.instance.floorTileCC(),
      this.floorTileList
    );
    await setBasicSnapShot(
      SocketFacade.instance.diceSymbolCC(),
      this.diceSymbolList
    );
    await setBasicSnapShot(SocketFacade.instance.extraCC(), this.extraList);
    await setBasicSnapShot(
      SocketFacade.instance.characterCC(),
      this.characterList
    );
    await setBasicSnapShot(
      SocketFacade.instance.propertyFaceCC(),
      this.propertyFaceList
    );
    await setBasicSnapShot(
      SocketFacade.instance.propertyCC(),
      this.propertyList
    );
    await setBasicSnapShot(
      SocketFacade.instance.mapLayerCC(),
      this.mapLayerList
    );
    await setBasicSnapShot(
      SocketFacade.instance.mapAndLayerCC(),
      this.mapAndLayerList
    );
    await setBasicSnapShot(
      SocketFacade.instance.propertySelectionCC(),
      this.propertySelectionList
    );
    await setBasicSnapShot(SocketFacade.instance.tagNoteCC(), this.tagNoteList);
  }

  private __clientRoomInfo: ClientRoomInfo | null = null;
  public readonly imageList: StoreUseData<Image>[] = [];
  public readonly imageTagList: StoreUseData<string>[] = [];
  public readonly playerList: StoreUseData<UserData>[] = [];
  public readonly mapMaskList: StoreUseData<MapMaskStore>[] = [];
  public readonly chitList: StoreUseData<ChitStore>[] = [];
  public readonly floorTileList: StoreUseData<FloorTileStore>[] = [];
  public readonly diceSymbolList: StoreUseData<DiceSymbolStore>[] = [];
  public readonly extraList: StoreUseData<ExtraStore>[] = [];
  public readonly characterList: StoreUseData<CharacterStore>[] = [];
  public readonly propertyFaceList: StoreUseData<PropertyFaceStore>[] = [];
  public readonly mapLayerList: StoreUseData<MapLayer>[] = [];
  public readonly mapAndLayerList: StoreUseData<MapAndLayer>[] = [];
  public readonly propertyList: StoreUseData<PropertyStore>[] = [];
  public readonly propertySelectionList: StoreUseData<
    PropertySelectionStore
  >[] = [];
  public readonly tagNoteList: StoreUseData<TagNoteStore>[] = [];

  public get clientRoomInfo(): ClientRoomInfo {
    if (!this.__clientRoomInfo) {
      throw new ApplicationError(
        `Unsupported operation. clientRoomInfo is null.`
      );
    }
    return this.__clientRoomInfo;
  }

  public async setClientRoomInfo(info: ClientRoomInfo) {
    this.__clientRoomInfo = info;
    await this.initialize();
  }

  public get mySelf(): StoreUseData<UserData> | null {
    return this.playerList.filter(p => p.id === this.mySelfId)[0] || null;
  }

  public static filterPlaceList(
    list: StoreUseData<MapObject>[],
    place: "field" | "graveyard" | "backstage"
  ) {
    return list.filter(item => item.data && item.data.place === place);
  }

  public get mySelfId(): string {
    const userId = SocketFacade.instance.userId;
    if (!userId) {
      throw new ApplicationError(`Illegal timing error.`);
    }
    return userId;
  }
}
