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
  PartialRoomData,
  ChatInfo,
  ChatTabInfo,
  GroupChatTabInfo,
  MediaInfo
} from "@/@types/room";
import { ApplicationError } from "@/app/core/error/ApplicationError";
import {
  ActorStore,
  SceneObject,
  PropertyFaceStore,
  PropertySelectionStore,
  PropertyStore,
  TagNoteStore,
  ActorStatusStore,
  CardMeta,
  CardObject,
  CardDeckBig,
  CardDeckSmall,
  ResourceMasterStore,
  ResourceStore,
  InitiativeColumnStore
} from "@/@types/gameObject";
import {
  ClientRoomInfo,
  RoomInfoExtend,
  WindowSettings
} from "@/@types/socket";
import DocumentSnapshot from "nekostore/lib/DocumentSnapshot";
import { BgmStandByInfo } from "task-info";
import LanguageManager from "@/LanguageManager";
import { findById, getSrc } from "@/app/core/utility/Utility";
import { loadYaml } from "@/app/core/utility/FileUtility";

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
  public static readonly PERMISSION_DEFAULT: Permission = {
    view: { type: "none", list: [] },
    edit: { type: "none", list: [] },
    chmod: { type: "none", list: [] }
  };

  /** 権限のデフォルト値 */
  public static readonly PERMISSION_OWNER_CHANGE: Permission = {
    view: { type: "none", list: [] },
    edit: { type: "allow", list: [{ type: "owner" }] },
    chmod: { type: "allow", list: [{ type: "owner" }] }
  };

  /** 権限のデフォルト値 */
  public static readonly PERMISSION_OWNER_VIEW: Permission = {
    view: { type: "allow", list: [{ type: "owner" }] },
    edit: { type: "allow", list: [{ type: "owner" }] },
    chmod: { type: "allow", list: [{ type: "owner" }] }
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
    // 個数の量が微量のもの
    await Promise.all([
      sf.sceneLayerCC().getList(true, this.sceneLayerList),
      sf.actorCC().getList(true, this.actorList),
      sf.cardDeckBigCC().getList(true, this.cardDeckBigList),
      sf.cardDeckSmallCC().getList(true, this.cardDeckSmallList),
      sf.sceneAndLayerCC().getList(true, this.sceneAndLayerList),
      sf.initiativeColumnCC().getList(true, this.initiativeColumnList),
      sf.actorStatusCC().getList(true, this.actorStatusList)
    ]);
    // 個数の量が小規模のもの
    await Promise.all([
      sf.propertySelectionCC().getList(true, this.propertySelectionList),
      sf.chatTabListCC().getList(true, this.chatTabList),
      sf.groupChatTabListCC().getList(true, this.groupChatTabList),
      sf.sceneListCC().getList(true, this.sceneList),
      sf.userCC().getList(true, this.userList),
      sf.cutInDataCC().getList(true, this.cutInList)
    ]);
    // 個数の量が中規模のもの
    await Promise.all([
      sf.sceneObjectCC().getList(true, this.sceneObjectList),
      sf.socketUserCC().getList(true, this.socketUserList),
      sf.propertyFaceCC().getList(true, this.propertyFaceList),
      sf.propertyCC().getList(true, this.propertyList),
      sf.resourceMasterCC().getList(true, this.resourceMasterList),
      sf.actorGroupCC().getList(true, this.actorGroupList),
      sf.tagNoteCC().getList(true, this.tagNoteList)
    ]);
    // 個数の量が大規模のもの
    await Promise.all([
      sf.chatListCC().getList(true, this.chatList),
      sf.mediaCC().getList(true, this.mediaList),
      sf.sceneAndObjectCC().getList(true, this.sceneAndObjectList),
      sf.cardMetaCC().getList(true, this.cardMetaList),
      sf.resourceCC().getList(true, this.resourceList),
      sf.cardObjectCC().getList(true, this.cardObjectList)
    ]);

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
    this.mediaList.forEach(media => {
      const src = getSrc(media.data!.url);
      if (!src.startsWith("data")) {
        const imgElm = document.createElement("img");
        imgElm.src = src;
      }
    });

    // チャットフォーマットの読み込み
    try {
      // 読み込み必須でないためthrowは伝搬しないで警告だけ表示
      this.chatFormatList.push(
        ...(await loadYaml<ChatFormatInfo[]>("./static/conf/chatFormat.yaml"))
      );
    } catch (err) {
      window.console.warn(err.toString());
    }

    // チャット設定の初期化
    this.chatPublicInfo.actorId = this.mySelfActorId;
    this.chatPublicInfo.tabId = this.chatTabList.find(
      ct => ct.data!.isSystem
    )!.id!;
    this.chatPublicInfo.targetId = this.groupChatTabList.find(
      gct => gct.data!.isSystem
    )!.id!;
    this.chatPublicInfo.system = this.clientRoomInfo.system;
    this.chatPublicInfo.bcdiceUrl = this.clientRoomInfo.bcdiceServer;
  }

  /**
   * ユーザー名を取得する
   * @param userId
   */
  public getUserName(userId: string | null) {
    const user = findById(this.userList, userId);
    if (!user) return LanguageManager.instance.getText("label.system");
    const type = LanguageManager.instance.getText(`label.${user.data!.type}`);
    return `${user.data!.name}(${type})`;
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
      await cc.touchModify([this.roomDataId]);
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
    await cc.update([this.roomDataId], [this.roomData]);
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
  public readonly mediaList: StoreUseData<MediaInfo>[] = [];
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
  public readonly resourceMasterList: StoreUseData<ResourceMasterStore>[] = [];
  public readonly resourceList: StoreUseData<ResourceStore>[] = [];
  public readonly initiativeColumnList: StoreUseData<
    InitiativeColumnStore
  >[] = [];
  public readonly propertySelectionList: StoreUseData<
    PropertySelectionStore
  >[] = [];
  public readonly tagNoteList: StoreUseData<TagNoteStore>[] = [];
  public readonly actorGroupList: StoreUseData<ActorGroup>[] = [];
  public readonly cardMetaList: StoreUseData<CardMeta>[] = [];
  public readonly cardObjectList: StoreUseData<CardObject>[] = [];
  public readonly cardDeckBigList: StoreUseData<CardDeckBig>[] = [];
  public readonly cardDeckSmallList: StoreUseData<CardDeckSmall>[] = [];

  public get clientRoomInfo(): ClientRoomInfo {
    if (!this.__clientRoomInfo) {
      throw new ApplicationError(
        `Unsupported operation. clientRoomInfo is null.`
      );
    }
    return this.__clientRoomInfo;
  }

  public getExclusionOwnerId(socketId: string | null): string | null {
    const socketUserInfo = this.socketUserList.find(
      su => su.data!.socketId === socketId
    );
    if (!socketUserInfo) return null;
    return socketUserInfo.data!.userId;
  }

  public getExclusionOwnerName(socketId: string): string {
    const userId = this.getExclusionOwnerId(socketId);
    if (!userId) return "";
    const userInfo = findById(this.userList, userId);
    return !userInfo
      ? LanguageManager.instance.getText("label.unknown")
      : userInfo.data!.name;
  }

  public async deleteSceneObject(id: string) {
    const sceneAndObjectIdList: string[] = [];

    const sceneAndObjectCC = SocketFacade.instance.sceneAndObjectCC();
    this.sceneAndObjectList
      .filter(sao => sao.data!.objectId === id)
      .forEach(sao => {
        sceneAndObjectIdList.push(sao.id!);
      });

    const sceneObjectCC = SocketFacade.instance.sceneObjectCC();
    const failure = () => {
      const msg =
        "Failure to delete object.\nAny data is locked.\nPlease try again latter.";
      alert(msg);
    };

    try {
      await sceneObjectCC!.touchModify([id]);
    } catch (err) {
      return failure();
    }

    try {
      await sceneAndObjectCC!.touchModify(sceneAndObjectIdList);
    } catch (err) {
      await sceneObjectCC.releaseTouch([id]);
      return failure();
    }

    await sceneAndObjectCC!.delete(sceneAndObjectIdList);
    await sceneObjectCC!.delete([id]);
  }

  public get mySelfUser(): StoreUseData<UserData> | null {
    return this.userList.find(p => p.id === this.mySelfUserId) || null;
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
    if (!userId) throw new ApplicationError(`Illegal timing error.`);
    return userId;
  }

  public get mySelfActorId(): string {
    return this.actorList.find(
      a => a.data!.type === "user" && a.owner === this.mySelfUserId
    )!.id!;
  }

  public getList(type: string): StoreUseData<any>[] | null {
    switch (type) {
      case "chat":
        return this.chatList;
      case "chatTab":
        return this.chatTabList;
      case "groupChatTab":
        return this.groupChatTabList;
      case "scene":
        return this.sceneList;
      case "media":
        return this.mediaList;
      case "bgm-stand-by":
        return this.bgmStandByList;
      case "user":
        return this.userList;
      case "socket-user":
        return this.socketUserList;
      case "scene-object":
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
      case "resource-master":
        return this.resourceMasterList;
      case "resource":
        return this.resourceList;
      case "initiative-column":
        return this.initiativeColumnList;
      case "property-selection":
        return this.propertySelectionList;
      case "tag-note":
        return this.tagNoteList;
      case "actor-group":
        return this.actorGroupList;
      case "card-meta":
        return this.cardMetaList;
      case "card-object":
        return this.cardObjectList;
      case "card-deck-big":
        return this.cardDeckBigList;
      case "card-deck-small":
        return this.cardDeckSmallList;
    }
    return null;
  }
}
