import SocketFacade from "../core/api/app-server/SocketFacade";
import { Permission, StoreObj, StoreUseData } from "@/@types/store";
import {
  SceneAndLayer,
  SceneLayer,
  Scene,
  UserData,
  ActorGroup,
  SceneAndObject,
  RoomData,
  SocketUserData,
  CutInDeclareInfo,
  ImageInfo,
  PartialRoomData,
  ChatInfo,
  ChatTabInfo,
  GroupChatTabInfo
} from "@/@types/room";
import { ApplicationError } from "@/app/core/error/ApplicationError";
import {
  ActorStore,
  SceneObject,
  PropertyFaceStore,
  PropertySelectionStore,
  PropertyStore,
  TagNoteStore,
  ActorStatusStore
} from "@/@types/gameObject";
import {
  ClientRoomInfo,
  RoomInfoExtend,
  WindowSettings
} from "@/@types/socket";
import DocumentSnapshot from "nekostore/lib/DocumentSnapshot";
import { BgmStandByInfo } from "task-info";
import LanguageManager from "@/LanguageManager";
import { getSrc } from "@/app/core/Utility";
import { loadYaml } from "@/app/core/File";

export type ChatPublicInfo = {
  isUseAllTab: boolean;
  actorId: string;
  tabId: string;
  targetId: string;
  system: string;
  bcdiceUrl: string;
};

export type ChatFormatInfo = {
  label: string;
  chatText: string;
};

export default class GameObjectManager {
  // シングルトン
  public static get instance(): GameObjectManager {
    if (!GameObjectManager._instance)
      GameObjectManager._instance = new GameObjectManager();
    return GameObjectManager._instance;
  }

  private static _instance: GameObjectManager;

  /** 権限のデフォルト値 */
  public static readonly DEFAULT_PERMISSION: Permission = {
    view: {
      type: "none",
      list: []
    },
    edit: {
      type: "none",
      list: []
    },
    chmod: {
      type: "none",
      list: []
    }
  };

  // コンストラクタの隠蔽
  private constructor() {}

  public async setClientRoomInfo(info: ClientRoomInfo) {
    this.__clientRoomInfo = info;
    await this.initialize();
  }

  /**
   * GameObjectManagerのイニシャライズ
   */
  private async initialize() {
    const sf = SocketFacade.instance;
    await sf.actorCC().getList(true, this.actorList);
    await sf.chatListCC().getList(true, this.chatList);
    await sf.chatTabListCC().getList(true, this.chatTabList);
    await sf.groupChatTabListCC().getList(true, this.groupChatTabList);
    await sf.sceneListCC().getList(true, this.sceneList);
    await sf.imageDataCC().getList(true, this.imageList);
    await sf.imageTagCC().getList(true, this.imageTagList);
    await sf.userCC().getList(true, this.userList);
    await sf.cutInDataCC().getList(true, this.cutInList);
    await sf.socketUserCC().getList(true, this.socketUserList);
    await sf.propertyFaceCC().getList(true, this.propertyFaceList);
    await sf.propertyCC().getList(true, this.propertyList);
    await sf.sceneLayerCC().getList(true, this.sceneLayerList);
    await sf.sceneAndLayerCC().getList(true, this.sceneAndLayerList);
    await sf.sceneAndObjectCC().getList(true, this.sceneAndObjectList);
    await sf.sceneObjectCC().getList(true, this.sceneObjectList);
    await sf.actorStatusCC().getList(true, this.actorStatusList);
    await sf.propertySelectionCC().getList(true, this.propertySelectionList);
    await sf.tagNoteCC().getList(true, this.tagNoteList);
    await sf.actorGroupCC().getList(true, this.actorGroupList);

    const roomDataCC = sf.roomDataCC();
    const roomData = (await roomDataCC.getList(false))[0];
    this.roomDataId = roomData.id!;

    // Object.assign()
    const writeSettings = (from: RoomInfoExtend, to: RoomInfoExtend) => {
      to.visitable = from.visitable;
      to.isFitGrid = from.isFitGrid;
      to.isViewDice = from.isViewDice;
      to.isViewCutIn = from.isViewCutIn;
      to.isDrawGridId = from.isDrawGridId;
      to.mapRotatable = from.mapRotatable;
      to.isDrawGridLine = from.isDrawGridLine;
      to.isShowStandImage = from.isShowStandImage;
      to.isShowRotateMarker = from.isShowRotateMarker;
      to.windowSettings.chat = from.windowSettings.chat;
      to.windowSettings.resource = from.windowSettings.resource;
      to.windowSettings.initiative = from.windowSettings.initiative;
      to.windowSettings.chatPalette = from.windowSettings.chatPalette;
      to.windowSettings.counterRemocon = from.windowSettings.counterRemocon;
    };
    this.roomData.name = roomData.data!.name;
    this.roomData.sceneId = roomData.data!.sceneId;
    writeSettings(roomData.data!.settings, this.roomData.settings);

    await roomDataCC.setSnapshot(
      "GameObjectManager",
      this.roomDataId,
      (snapshot: DocumentSnapshot<StoreObj<RoomData>>) => {
        if (snapshot.exists() && snapshot.data.status === "modified") {
          const d = snapshot.data.data!;
          // Object.assign()
          this.roomData.sceneId = d.sceneId;
          writeSettings(d.settings, this.roomData.settings);
        }
      }
    );

    // 画像のプリロード
    this.imageList.forEach(image => {
      const src = getSrc(image.data!.data);
      if (!src.startsWith("data")) {
        const imgElm = document.createElement("img");
        imgElm.src = src;
      }
    });

    // チャットフォーマットの読み込み
    this.chatFormatList.push(
      ...(await loadYaml<ChatFormatInfo[]>("./static/conf/chatFormat.yaml"))
    );

    // チャット設定の初期化
    this.chatPublicInfo.actorId = this.mySelfActorId;
    this.chatPublicInfo.tabId = this.chatTabList.filter(
      ct => ct.data!.isSystem
    )[0].id!;
    this.chatPublicInfo.targetId = this.groupChatTabList.filter(
      gct => gct.data!.isSystem
    )[0].id!;
    this.chatPublicInfo.system = this.clientRoomInfo.system;
    this.chatPublicInfo.bcdiceUrl = this.clientRoomInfo.bcdiceServer;
  }

  /**
   * 部屋情報を更新する
   * @param data
   */
  public async updateRoomData(data: PartialRoomData): Promise<void> {
    if (!this.roomDataId)
      throw new ApplicationError("Illegal timing error(roomDataId is null).");
    const cc = SocketFacade.instance.roomDataCC();

    try {
      await cc.touchModify(this.roomDataId);
    } catch (err) {
      // nothing.
      window.console.error(err);
      return;
    }

    // Object.assign()
    if (data.name !== undefined) this.roomData.name = data.name;
    if (data.sceneId !== undefined) this.roomData.sceneId = data.sceneId;
    const settings = data.settings;
    if (settings) {
      const copyParam = <T extends keyof RoomInfoExtend>(param: T) => {
        if (settings[param] !== undefined)
          this.roomData.settings[param] = settings[param];
      };
      copyParam("visitable");
      copyParam("isFitGrid");
      copyParam("isViewDice");
      copyParam("isViewCutIn");
      copyParam("isDrawGridId");
      copyParam("mapRotatable");
      copyParam("isDrawGridLine");
      copyParam("isShowStandImage");
      copyParam("isShowRotateMarker");

      const windowSettings = settings.windowSettings;
      if (windowSettings) {
        const copyWindow = <T extends keyof WindowSettings>(param: T) => {
          if (windowSettings[param] !== undefined)
            this.roomData.settings.windowSettings[param] =
              windowSettings[param];
        };
        copyWindow("chat");
        copyWindow("resource");
        copyWindow("initiative");
        copyWindow("chatPalette");
        copyWindow("counterRemocon");
      }
    }
    await cc.update(this.roomDataId, this.roomData);
  }

  private __clientRoomInfo: ClientRoomInfo | null = null;

  public readonly chatPublicInfo: ChatPublicInfo = {
    isUseAllTab: false,
    actorId: "",
    tabId: "",
    targetId: "",
    system: "",
    bcdiceUrl: ""
  };

  public get selfActors(): StoreUseData<ActorStore>[] {
    return this.actorList.filter(a => a.owner === this.mySelfUserId);
  }

  // シーンの編集中にシーンの切り替えが行われたとき、その追従を行うための変数
  public isSceneEditing: boolean = false;
  public sceneEditingUpdateSceneId: string | null = null;

  // 部屋の設定情報
  private roomDataId: string | null = null;
  public readonly roomData: RoomData = {
    name: "",
    sceneId: "",
    settings: {
      visitable: true,
      isFitGrid: true,
      isViewDice: true,
      isViewCutIn: true,
      isDrawGridId: true,
      mapRotatable: true,
      isDrawGridLine: true,
      isShowStandImage: true,
      isShowRotateMarker: true,
      windowSettings: {
        chat: "free",
        resource: "free",
        initiative: "free",
        chatPalette: "free",
        counterRemocon: "free"
      }
    }
  };

  public readonly chatFormatList: ChatFormatInfo[] = [];

  // 再生中のBGMの一覧
  public readonly playingBgmList: {
    targetId: string | null;
    tag: string;
    windowKey: string;
  }[] = [];

  public readonly chatList: StoreUseData<ChatInfo>[] = [];
  public readonly chatTabList: StoreUseData<ChatTabInfo>[] = [];
  public readonly groupChatTabList: StoreUseData<GroupChatTabInfo>[] = [];
  public readonly sceneList: StoreUseData<Scene>[] = [];
  public readonly cutInList: StoreUseData<CutInDeclareInfo>[] = [];
  public readonly bgmStandByList: StoreUseData<BgmStandByInfo>[] = [];
  public readonly imageList: StoreUseData<ImageInfo>[] = [];
  public readonly imageTagList: StoreUseData<string>[] = [];
  public readonly userList: StoreUseData<UserData>[] = [];
  public readonly socketUserList: StoreUseData<SocketUserData>[] = [];
  public readonly actorList: StoreUseData<ActorStore>[] = [];
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

  public getExclusionOwnerId(socketId: string | null): string | null {
    const socketUserInfo = this.socketUserList.filter(
      su => su.data!.socketId === socketId
    )[0];
    if (!socketUserInfo) return null;
    return socketUserInfo.data!.userId;
  }

  public getExclusionOwnerName(socketId: string): string {
    const userId = this.getExclusionOwnerId(socketId);
    if (!userId) return "";
    const userInfo = this.userList.filter(u => u.id === userId)[0];
    return !userInfo
      ? LanguageManager.instance.getText("label.unknown")
      : userInfo.data!.name;
  }

  public static async addActor(actorInfo: ActorStore) {
    const actorCC = SocketFacade.instance.actorCC();
    const actorStatusCC = SocketFacade.instance.actorStatusCC();

    const statusInfo: ActorStatusStore = {
      name: "◆",
      isSystem: true,
      standImageInfoId: null,
      chatPaletteInfoId: null
    };
    const statusId = (await actorStatusCC.addDirect([statusInfo]))[0];

    actorInfo.statusId = statusId;

    const owner: string = (
      await actorCC.addDirect([actorInfo], {
        permission: {
          view: {
            type: "none",
            list: []
          },
          edit: {
            type: "allow",
            list: [
              {
                type: "owner"
              }
            ]
          },
          chmod: {
            type: "allow",
            list: [
              {
                type: "owner"
              }
            ]
          }
        }
      })
    )[0];
    await actorStatusCC.touchModify(statusId);
    actorInfo.statusId = statusId;
    await actorStatusCC.update(statusId, statusInfo, { owner });
  }

  public async addScene(
    scene: Scene
  ): Promise<{ sceneId: string; mapAndLayerIdList: string[] }> {
    /* --------------------------------------------------
     * シーンの登録
     */
    const sceneListCC = SocketFacade.instance.sceneListCC();
    const sceneId = (await sceneListCC.addDirect([scene]))[0];

    /* --------------------------------------------------
     * シーンとレイヤーの紐づきの登録
     */
    const sceneLayerCC = SocketFacade.instance.sceneLayerCC();
    const sceneAndLayerList: SceneAndLayer[] = (
      await sceneLayerCC.getList(false)
    ).map(sl => ({
      sceneId,
      layerId: sl.id!,
      isUse: true
    }));

    const sceneAndLayerCC = SocketFacade.instance.sceneAndLayerCC();
    const mapAndLayerIdList: string[] = await sceneAndLayerCC.addDirect(
      sceneAndLayerList
    );

    /* --------------------_ ------------------------------
     * シーンとオブジェクトの紐づきの登録
     */
    const sceneObjectCC = SocketFacade.instance.sceneObjectCC();
    const sceneAndObjectList: SceneAndObject[] = (
      await sceneObjectCC.getList(false)
    ).map(so => ({
      sceneId,
      objectId: so.id!,
      isOriginalAddress: false,
      originalAddress: null,
      entering: "normal"
    }));

    const sceneAndObjectCC = SocketFacade.instance.sceneAndObjectCC();
    await sceneAndObjectCC.addDirect(sceneAndObjectList);

    return {
      sceneId,
      mapAndLayerIdList
    };
  }

  public async addSceneLayer(sceneLayer: SceneLayer): Promise<void> {
    const sceneLayerCC = SocketFacade.instance.sceneLayerCC();
    const layerId = (await sceneLayerCC.addDirect([sceneLayer]))[0];

    const sceneListCC = SocketFacade.instance.sceneListCC();
    const sceneAndLayerList: SceneAndLayer[] = (
      await sceneListCC.getList(false)
    ).map((s: StoreUseData<Scene>) => ({
      sceneId: s.id!,
      layerId,
      isUse: true
    }));

    const sceneAndLayerCC = SocketFacade.instance.sceneAndLayerCC();
    await sceneAndLayerCC.addDirect(sceneAndLayerList);
  }

  public async addSceneObject(sceneObject: SceneObject) {
    const sceneObjectCC = SocketFacade.instance.sceneObjectCC();
    const objectId = (await sceneObjectCC.addDirect([sceneObject]))[0];

    const sceneAndObjectList: SceneAndObject[] = this.sceneList.map(s => ({
      sceneId: s.id!,
      objectId,
      isOriginalAddress: false,
      originalAddress: null,
      entering: "normal"
    }));

    const sceneAndObjectCC = SocketFacade.instance.sceneAndObjectCC();
    await sceneAndObjectCC.addDirect(sceneAndObjectList);
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
    await touchedList
      .map((id: string) => () => deleteFunc(id))
      .reduce((prev, curr) => prev.then(curr), Promise.resolve());
  }

  public get mySelfUser(): StoreUseData<UserData> | null {
    return this.userList.filter(p => p.id === this.mySelfUserId)[0] || null;
  }

  public get isGm(): boolean {
    return (
      !!this.mySelfUser &&
      !!this.mySelfUser.data &&
      this.mySelfUser.data.type === "GM"
    );
  }

  public get mySelfUserId(): string {
    const userId = SocketFacade.instance.userId;
    if (!userId) {
      throw new ApplicationError(`Illegal timing error.`);
    }
    return userId;
  }

  public get mySelfActorId(): string {
    return this.actorList.filter(
      a => a.data!.type === "user" && a.owner === this.mySelfUserId
    )[0].id!;
  }

  public getList(type: string): StoreUseData<unknown>[] | null {
    switch (type) {
      case "chat":
        return this.chatList;
      case "chatTab":
        return this.chatTabList;
      case "groupChatTab":
        return this.groupChatTabList;
      case "scene":
        return this.sceneList;
      case "image":
        return this.imageList;
      case "image-tag":
        return this.imageTagList;
      case "bgm-stand-by":
        return this.bgmStandByList;
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
      case "actor":
        return this.actorList;
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
