import SocketFacade, { getStoreObj } from "../core/api/app-server/SocketFacade";
import QuerySnapshot from "nekostore/lib/QuerySnapshot";
import { StoreObj, StoreUseData } from "@/@types/store";
import {
  SceneAndLayer,
  SceneLayer,
  Scene,
  UserData,
  Image,
  ActorGroup,
  SceneAndObject,
  RoomData,
  SocketUserData
} from "@/@types/room";
import { ApplicationError } from "@/app/core/error/ApplicationError";
import NekostoreCollectionController from "@/app/core/api/app-server/NekostoreCollectionController";
import {
  ExtraStore,
  SceneObject,
  PropertyFaceStore,
  PropertySelectionStore,
  PropertyStore,
  TagNoteStore,
  ActorStatusStore
} from "@/@types/gameObject";
import { ClientRoomInfo } from "@/@types/socket";
import DocumentSnapshot from "nekostore/lib/DocumentSnapshot";

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
              // window.console.log(status, doc.ref.id);
              if (
                (status !== "initial-touched" && index === -1) ||
                status === "added" ||
                status === "modified"
              ) {
                const obj = getStoreObj(doc)!;
                // if (obj && obj.data) {
                //   const data: any = obj.data;
                //   window.console.log(typeof data);
                //   if ("name" in data) {
                //     window.console.log(data.name);
                //   }
                // }
                list.splice(index, index < 0 ? 0 : 1, obj);
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
    await setBasicSnapShot(SocketFacade.instance.sceneListCC(), this.sceneList);
    await setBasicSnapShot(SocketFacade.instance.imageDataCC(), this.imageList);
    await setBasicSnapShot(
      SocketFacade.instance.imageTagCC(),
      this.imageTagList
    );
    await setBasicSnapShot(SocketFacade.instance.userCC(), this.userList);
    await setBasicSnapShot(
      SocketFacade.instance.socketUserCC(),
      this.socketUserList
    );
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
      SocketFacade.instance.sceneLayerCC(),
      this.sceneLayerList
    );
    await setBasicSnapShot(
      SocketFacade.instance.sceneAndLayerCC(),
      this.sceneAndLayerList
    );
    await setBasicSnapShot(
      SocketFacade.instance.sceneAndObjectCC(),
      this.sceneAndObjectList
    );
    await setBasicSnapShot(
      SocketFacade.instance.sceneObjectCC(),
      this.sceneObjectList
    );
    await setBasicSnapShot(
      SocketFacade.instance.actorStatusCC(),
      this.actorStatusList
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

    const roomDataCC = SocketFacade.instance.roomDataCC();
    const roomData = (await roomDataCC.getList(false))[0];
    Object.assign(this.roomData, roomData.data);

    await roomDataCC.setSnapshot(
      "GameObjectManager",
      roomData.id!,
      (snapshot: DocumentSnapshot<StoreObj<RoomData>>) => {
        if (snapshot.exists() && snapshot.data.status === "modified") {
          Object.assign(this.roomData, snapshot.data.data);
        }
      }
    );
  }

  private __clientRoomInfo: ClientRoomInfo | null = null;
  public readonly roomData: RoomData = {
    sceneId: "",
    isDrawGridLine: false,
    isDrawGridId: false,
    isFitGrid: false,
    isUseRotateMarker: false
  };
  public readonly sceneList: StoreUseData<Scene>[] = [];
  public readonly imageList: StoreUseData<Image>[] = [];
  public readonly imageTagList: StoreUseData<string>[] = [];
  public readonly userList: StoreUseData<UserData>[] = [];
  public readonly socketUserList: StoreUseData<SocketUserData>[] = [];
  public readonly extraList: StoreUseData<ExtraStore>[] = [];
  public readonly propertyFaceList: StoreUseData<PropertyFaceStore>[] = [];
  public readonly sceneLayerList: StoreUseData<SceneLayer>[] = [];
  public readonly sceneAndLayerList: StoreUseData<SceneAndLayer>[] = [];
  public readonly sceneAndObjectList: StoreUseData<SceneAndObject>[] = [];
  public readonly sceneObjectList: StoreUseData<SceneObject>[] = [];
  public readonly actorStatusList: StoreUseData<ActorStatusStore>[] = [];
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

  public async addScene(
    scene: Scene
  ): Promise<{ sceneId: string; mapAndLayerIdList: string[] }> {
    /* --------------------------------------------------
     * マップデータのプリセットデータ投入
     */
    const sceneListCC = SocketFacade.instance.sceneListCC();
    const sceneId = await sceneListCC.add(await sceneListCC.touch(), scene);

    /* --------------------------------------------------
     * マップとレイヤーの紐づきのプリセットデータ投入
     */
    const sceneAndLayerCC = SocketFacade.instance.sceneAndLayerCC();

    const mapAndLayerIdList: string[] = [];
    const addSceneAndLayer = async (
      sl: StoreUseData<SceneLayer>
    ): Promise<void> => {
      const mapAndLayerId = await sceneAndLayerCC.touch();
      mapAndLayerIdList.push(mapAndLayerId);
      await sceneAndLayerCC.add(mapAndLayerId, {
        sceneId,
        layerId: sl.id!,
        isUse: true
      });
    };

    // 直列の非同期で全部実行する
    const sceneLayerCC = SocketFacade.instance.sceneLayerCC();
    await (await sceneLayerCC.getList(false))
      .map((ml: StoreUseData<SceneLayer>) => () => addSceneAndLayer(ml))
      .reduce((prev, curr) => prev.then(curr), Promise.resolve());

    return {
      sceneId,
      mapAndLayerIdList
    };
  }

  public async addSceneLayer(sceneLayer: SceneLayer) {
    const sceneLayerCC = SocketFacade.instance.sceneLayerCC();
    const layerId = await sceneLayerCC.touch();
    await sceneLayerCC.add(layerId, sceneLayer);

    const sceneAndLayerCC = SocketFacade.instance.sceneAndLayerCC();
    const addSceneAndLayer = async (s: StoreUseData<Scene>): Promise<void> => {
      const mapAndLayerId = await sceneAndLayerCC.touch();
      await sceneAndLayerCC.add(mapAndLayerId, {
        sceneId: s.id!,
        layerId,
        isUse: true
      });
    };

    // 直列の非同期で全部実行する
    const sceneListCC = SocketFacade.instance.sceneListCC();
    await (await sceneListCC.getList(false))
      .map((s: StoreUseData<Scene>) => () => addSceneAndLayer(s))
      .reduce((prev, curr) => prev.then(curr), Promise.resolve());
  }

  public async addSceneObject(sceneObject: SceneObject) {
    const sceneObjectCC = SocketFacade.instance.sceneObjectCC();
    const objectId = await sceneObjectCC.touch();
    await sceneObjectCC.add(objectId, sceneObject);

    const sceneAndObjectCC = SocketFacade.instance.sceneAndObjectCC();
    this.sceneList.forEach(async s => {
      const sceneId = s.id!;
      await sceneAndObjectCC.add(await sceneAndObjectCC.touch(), {
        sceneId,
        objectId,
        // startTimeStatus: "",
        // startTimePlace: "",
        isOriginalAddress: false,
        originalAddress: null,
        entering: "normal"
      });
    });
  }

  public async deleteSceneObject(id: string) {
    const sceneAndObjectIdList: string[] = [];
    const touchedList: string[] = [];
    let error: boolean = false;

    const sceneAndObjectCC = SocketFacade.instance.sceneAndObjectCC();
    this.sceneList.forEach(async s => {
      const sceneId = s.id!;
      this.sceneAndLayerList
        .filter(sao => sao.id === sceneId)
        .forEach(async sao => {
          sceneAndObjectIdList.push(sao.id!);
        });
    });

    const releaseTouchModifyFunc = async (id: string): Promise<void> => {
      await sceneAndObjectCC!.releaseTouch(id);
    };
    const touchModifyFunc = async (id: string): Promise<void> => {
      if (error) return;
      try {
        await sceneAndObjectCC!.touchModify(id);
        touchedList.push(id);
      } catch (err) {
        error = true;

        // 直列の非同期で全部実行する
        await touchedList
          .map((id: string) => () => releaseTouchModifyFunc(id))
          .reduce((prev, curr) => prev.then(curr), Promise.resolve());
      }
    };

    // 直列の非同期で全部実行する
    await sceneAndObjectIdList
      .map((id: string) => () => touchModifyFunc(id))
      .reduce((prev, curr) => prev.then(curr), Promise.resolve());

    const sceneObjectCC = SocketFacade.instance.sceneObjectCC();
    try {
      await sceneObjectCC!.touchModify(id);
    } catch (err) {
      window.console.warn(err);
      error = true;

      // 直列の非同期で全部実行する
      await touchedList
        .map((id: string) => () => releaseTouchModifyFunc(id))
        .reduce((prev, curr) => prev.then(curr), Promise.resolve());
    }

    if (error) {
      alert(
        "Failure to delete object.\nAny data is locked.\nPlease try again latter."
      );
      return;
    }

    await sceneObjectCC!.delete(id);
    const deleteFunc = async (id: string): Promise<void> => {
      await sceneAndObjectCC!.delete(id);
    };
    // 直列の非同期で全部実行する
    touchedList
      .map((id: string) => () => deleteFunc(id))
      .reduce((prev, curr) => prev.then(curr), Promise.resolve());
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
      case "scene":
        return this.sceneList;
      case "image":
        return this.imageList;
      case "image-tag":
        return this.imageTagList;
      case "user":
        return this.userList;
      case "socket-user":
        return this.socketUserList;
      case "map-mask":
      case "chit":
      case "floor-tile":
      case "dice-symbol":
      case "character":
        return this.sceneObjectList;
      case "actor-status":
        return this.actorStatusList;
      case "extra":
        return this.extraList;
      case "property-face":
        return this.propertyFaceList;
      case "scene-layer":
        return this.sceneLayerList;
      case "scene-and-layer":
        return this.sceneAndLayerList;
      case "scene-and-object":
        return this.sceneAndObjectList;
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
