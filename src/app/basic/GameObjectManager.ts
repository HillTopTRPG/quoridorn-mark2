import SocketFacade, { getStoreObj } from "../core/api/app-server/SocketFacade";
import QuerySnapshot from "nekostore/lib/QuerySnapshot";
import { StoreObj, StoreUseData } from "@/@types/store";
import {
  ScreenAndLayer,
  ScreenLayer,
  Screen,
  UserData,
  Image,
  ActorGroup,
  ScreenAndObject
} from "@/@types/room";
import { ApplicationError } from "@/app/core/error/ApplicationError";
import NekostoreCollectionController from "@/app/core/api/app-server/NekostoreCollectionController";
import {
  ExtraStore,
  ScreenObject,
  Place,
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
  private constructor() {}

  private async initialize() {
    const setBasicSnapShot = async <T>(
      c: NekostoreCollectionController<T>,
      list: StoreUseData<T>[]
    ) => {
      await c.setCollectionSnapshot(
        "PlayerManager",
        (snapshot: QuerySnapshot<StoreObj<T>>) => {
          let wantSort = false;
          snapshot.docs.forEach(doc => {
            const index = list.findIndex(p => p.id === doc.ref.id);
            if (doc.type === "removed") {
              list.splice(index, 1);
            } else {
              const status = doc.data!.status;
              if (
                (status !== "initial-touched" && index === -1) ||
                status === "added" ||
                status === "modified"
              ) {
                list.splice(index, index < 0 ? 0 : 1, getStoreObj(doc)!);
                wantSort = true;
              }
            }
          });
          if (wantSort)
            list.sort((i1, i2) => {
              if (i1.order < i2.order) return -1;
              if (i1.order > i2.order) return 1;
              return 0;
            });
        }
      );
    };
    await setBasicSnapShot(
      SocketFacade.instance.screenListCC(),
      this.screenList
    );
    await setBasicSnapShot(SocketFacade.instance.imageDataCC(), this.imageList);
    await setBasicSnapShot(
      SocketFacade.instance.imageTagCC(),
      this.imageTagList
    );
    await setBasicSnapShot(SocketFacade.instance.userCC(), this.userList);
    await setBasicSnapShot(SocketFacade.instance.extraCC(), this.extraList);
    await setBasicSnapShot(
      SocketFacade.instance.propertyFaceCC(),
      this.propertyFaceList
    );
    await setBasicSnapShot(
      SocketFacade.instance.propertyCC(),
      this.propertyList
    );
    await setBasicSnapShot(
      SocketFacade.instance.screenLayerCC(),
      this.screenLayerList
    );
    await setBasicSnapShot(
      SocketFacade.instance.screenAndLayerCC(),
      this.screenAndLayerList
    );
    await setBasicSnapShot(
      SocketFacade.instance.screenAndObjectCC(),
      this.screenAndObjectList
    );
    await setBasicSnapShot(
      SocketFacade.instance.screenObjectCC(),
      this.screenObjectList
    );
    await setBasicSnapShot(
      SocketFacade.instance.propertySelectionCC(),
      this.propertySelectionList
    );
    await setBasicSnapShot(SocketFacade.instance.tagNoteCC(), this.tagNoteList);
    await setBasicSnapShot(
      SocketFacade.instance.actorGroupCC(),
      this.actorGroupList
    );
  }

  private __clientRoomInfo: ClientRoomInfo | null = null;
  public readonly screenList: StoreUseData<Screen>[] = [];
  public readonly imageList: StoreUseData<Image>[] = [];
  public readonly imageTagList: StoreUseData<string>[] = [];
  public readonly userList: StoreUseData<UserData>[] = [];
  public readonly extraList: StoreUseData<ExtraStore>[] = [];
  public readonly propertyFaceList: StoreUseData<PropertyFaceStore>[] = [];
  public readonly screenLayerList: StoreUseData<ScreenLayer>[] = [];
  public readonly screenAndLayerList: StoreUseData<ScreenAndLayer>[] = [];
  public readonly screenAndObjectList: StoreUseData<ScreenAndObject>[] = [];
  public readonly screenObjectList: StoreUseData<ScreenObject>[] = [];
  public readonly propertyList: StoreUseData<PropertyStore>[] = [];
  public readonly propertySelectionList: StoreUseData<
    PropertySelectionStore
  >[] = [];
  public readonly tagNoteList: StoreUseData<TagNoteStore>[] = [];
  public readonly actorGroupList: StoreUseData<ActorGroup>[] = [];

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

  public async addScreen(
    screen: Screen
  ): Promise<{ screenId: string; mapAndLayerIdList: string[] }> {
    /* --------------------------------------------------
     * マップデータのプリセットデータ投入
     */
    const screenListCC = SocketFacade.instance.screenListCC();
    const screenId = await screenListCC.add(await screenListCC.touch(), screen);

    /* --------------------------------------------------
     * マップとレイヤーの紐づきのプリセットデータ投入
     */
    const screenAndLayerCC = SocketFacade.instance.screenAndLayerCC();

    const mapAndLayerIdList: string[] = [];
    const addScreenAndLayer = async (
      sl: StoreUseData<ScreenLayer>
    ): Promise<void> => {
      const mapAndLayerId = await screenAndLayerCC.touch();
      mapAndLayerIdList.push(mapAndLayerId);
      await screenAndLayerCC.add(mapAndLayerId, {
        screenId,
        layerId: sl.id!,
        isUse: true
      });
    };

    // 直列の非同期で全部実行する
    const screenLayerCC = SocketFacade.instance.screenLayerCC();
    await (await screenLayerCC.getList(false))
      .map((ml: StoreUseData<ScreenLayer>) => () => addScreenAndLayer(ml))
      .reduce((prev, curr) => prev.then(curr), Promise.resolve());

    return {
      screenId,
      mapAndLayerIdList
    };
  }

  public async addScreenLayer(screenLayer: ScreenLayer) {
    const screenLayerCC = SocketFacade.instance.screenLayerCC();
    const layerId = await screenLayerCC.touch();
    await screenLayerCC.add(layerId, screenLayer);

    const screenAndLayerCC = SocketFacade.instance.screenAndLayerCC();
    const addScreenAndLayer = async (
      s: StoreUseData<Screen>
    ): Promise<void> => {
      const mapAndLayerId = await screenAndLayerCC.touch();
      await screenAndLayerCC.add(mapAndLayerId, {
        screenId: s.id!,
        layerId,
        isUse: true
      });
    };

    // 直列の非同期で全部実行する
    const screenListCC = SocketFacade.instance.screenListCC();
    await (await screenListCC.getList(false))
      .map((s: StoreUseData<Screen>) => () => addScreenAndLayer(s))
      .reduce((prev, curr) => prev.then(curr), Promise.resolve());
  }

  public async addScreenObject(screenObject: ScreenObject) {
    const screenObjectCC = SocketFacade.instance.screenObjectCC();
    const objectId = await screenObjectCC.touch();
    await screenObjectCC.add(objectId, screenObject);

    const screenAndObjectCC = SocketFacade.instance.screenAndObjectCC();
    this.screenList.forEach(async s => {
      const screenId = s.id!;
      await screenAndObjectCC.add(await screenAndObjectCC.touch(), {
        screenId,
        objectId,
        startTimeStatus: null,
        startTimePlace: null,
        startTimePoint: null,
        startTimeMatrix: null,
        isOriginalPoint: false,
        originalPoint: null,
        originalMatrix: null,
        entering: "normal"
      });
    });
  }

  public get mySelf(): StoreUseData<UserData> | null {
    return this.userList.filter(p => p.id === this.mySelfId)[0] || null;
  }

  public get isGm(): boolean {
    return (
      !!this.mySelf && !!this.mySelf.data && this.mySelf.data.userType === "GM"
    );
  }

  public get mySelfId(): string {
    const userId = SocketFacade.instance.userId;
    if (!userId) {
      throw new ApplicationError(`Illegal timing error.`);
    }
    return userId;
  }

  public getList(type: string): StoreUseData<unknown>[] | null {
    switch (type) {
      case "screen":
        return this.screenList;
      case "image":
        return this.imageList;
      case "image-tag":
        return this.imageTagList;
      case "user":
        return this.userList;
      case "map-mask":
      case "chit":
      case "floor-tile":
      case "dice-symbol":
      case "character":
        return this.screenObjectList;
      case "extra":
        return this.extraList;
      case "property-face":
        return this.propertyFaceList;
      case "screen-layer":
        return this.screenLayerList;
      case "screen-and-layer":
        return this.screenAndLayerList;
      case "screen-and-object":
        return this.screenAndObjectList;
      case "property":
        return this.propertyList;
      case "property-selection":
        return this.propertySelectionList;
      case "tag-note":
        return this.tagNoteList;
      case "actor-group":
        return this.actorGroupList;
    }
    return null;
  }
}
