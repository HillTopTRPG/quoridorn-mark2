import SocketFacade from "../core/api/app-server/SocketFacade";
import DocumentSnapshot from "nekostore/lib/DocumentSnapshot";
import { ClientRoomInfo } from "@/@types/socket";
import {
  ActorStatusStore,
  ActorStore,
  CardDeckBigStore,
  CardDeckSmallStore,
  CardMetaStore,
  CardObjectStore,
  KeepBcdiceDiceRollResultStore,
  ChatPaletteStore,
  InitiativeColumnStore,
  ResourceMasterStore,
  ResourceStore,
  SceneObjectStore,
  MemoStore,
  PublicMemoStore,
  LikeStore,
  ActorGroupStore,
  ChatStore,
  ChatTabStore,
  CutInStore,
  GroupChatTabStore,
  MediaStore,
  RoomDataStore,
  SceneStore,
  SceneAndLayerStore,
  SceneAndObjectStore,
  SceneLayerStore,
  SocketUserStore,
  UserStore,
  DiceTypeStore,
  DiceAndPipsStore,
  CounterRemoconStore
} from "@/@types/store-data";
import { ApplicationError } from "../core/error/ApplicationError";
import {
  errorDialog,
  findByKey,
  findRequireByKey
} from "../core/utility/Utility";
import { loadYaml } from "../core/utility/FileUtility";
import LanguageManager from "../../LanguageManager";
import {
  PartialRoomData,
  RoomInfoExtend,
  WindowSettings
} from "@/@types/store-data-optional";

export type ChatPublicInfo = {
  isUseAllTab: boolean;
  actorKey: string;
  tabKey: string;
  targetKey: string;
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
    // Block 1
    await Promise.all([
      sf.chatListCC().getList(true, this.chatList),
      sf.cardDeckBigCC().getList(true, this.cardDeckBigList),
      sf.cardMetaCC().getList(true, this.cardMetaList),
      sf.socketUserCC().getList(true, this.socketUserList),
      sf.publicMemoListCC().getList(true, this.publicMemoList)
    ]);
    // Block 2
    await Promise.all([
      sf.sceneAndObjectCC().getList(true, this.sceneAndObjectList),
      sf.resourceMasterCC().getList(true, this.resourceMasterList),
      sf.actorGroupCC().getList(true, this.actorGroupList),
      sf.cutInDataCC().getList(true, this.cutInList),
      sf.diceTypeListCC().getList(true, this.diceTypeList)
    ]);
    // Block 3
    await Promise.all([
      sf.resourceCC().getList(true, this.resourceList),
      sf.cardDeckSmallCC().getList(true, this.cardDeckSmallList),
      sf.userCC().getList(true, this.userList),
      sf.chatPaletteListCC().getList(true, this.chatPaletteList),
      sf.diceAndPipsListCC().getList(true, this.diceAndPipsList)
    ]);
    // Block 4
    await Promise.all([
      sf.actorStatusCC().getList(true, this.actorStatusList),
      sf.sceneAndLayerCC().getList(true, this.sceneAndLayerList),
      sf.sceneListCC().getList(true, this.sceneList),
      sf.counterRemoconCC().getList(true, this.counterRemoconList),
      sf
        .keepBcdiceDiceRollResultListCC()
        .getList(true, this.keepBcdiceDiceRollResultList)
    ]);
    // Block 5
    await Promise.all([
      sf.mediaCC().getList(true, this.mediaList),
      sf.cardObjectCC().getList(true, this.cardObjectList),
      sf.actorCC().getList(true, this.actorList),
      sf.chatTabListCC().getList(true, this.chatTabList),
      sf.memoCC().getList(true, this.memoList)
    ]);
    // Block 6
    await Promise.all([
      sf.sceneObjectCC().getList(true, this.sceneObjectList),
      sf.sceneLayerCC().getList(true, this.sceneLayerList),
      sf.initiativeColumnCC().getList(true, this.initiativeColumnList),
      sf.groupChatTabListCC().getList(true, this.groupChatTabList),
      sf.likeListCC().getList(true, this.likeList)
    ]);

    const roomDataCC = sf.roomDataCC();
    const roomData = (await roomDataCC.getList(false))[0];
    this.roomDataKey = roomData.key;

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
    this.roomData.sceneKey = roomData.data!.sceneKey;
    writeSettings(roomData.data!.settings, this.roomData.settings);

    await roomDataCC.setSnapshot(
      "GameObjectManager",
      this.roomDataKey!,
      (snapshot: DocumentSnapshot<StoreData<RoomDataStore>>) => {
        if (snapshot.exists() && snapshot.data.status === "modified") {
          const d = snapshot.data.data!;
          // Object.assign()
          this.roomData.sceneKey = d.sceneKey;
          writeSettings(d.settings, this.roomData.settings);
        }
      }
    );

    // 画像のプリロード
    this.mediaList.forEach(media => {
      const url = media.data!.url;
      const urlType = media.data!.urlType;
      if (!url.startsWith("data") && urlType === "image") {
        const imgElm = document.createElement("img");
        imgElm.src = url;
      }
    });

    // チャットフォーマットの読み込み
    try {
      // 読み込み必須でないためthrowは伝搬しないで警告だけ表示
      this.chatFormatList.push(
        ...(await loadYaml<ChatFormatInfo[]>("static/conf/chatFormat.yaml"))
      );
    } catch (err) {
      console.warn(err.toString());
    }

    // チャット設定の初期化
    this.chatPublicInfo.actorKey = this.mySelfActorKey;
    this.chatPublicInfo.tabKey = this.chatTabList.find(
      ct => ct.data!.isSystem
    )!.key;
    this.chatPublicInfo.targetKey = this.groupChatTabList.find(
      gct => gct.data!.isSystem
    )!.key;
    this.chatPublicInfo.system = this.clientRoomInfo.system;
    this.chatPublicInfo.bcdiceUrl = this.clientRoomInfo.bcdiceServer;
  }

  /**
   * ユーザー名を取得する
   * @param userKey
   */
  public getUserName(userKey: string | null) {
    const user = findByKey(this.userList, userKey);
    if (!user) return LanguageManager.instance.getText("label.system");
    const type = LanguageManager.instance.getText(
      `selection.user-type.${user.data!.type}`.toLowerCase()
    );
    return `${user.data!.name}(${type})`;
  }

  /**
   * 部屋情報を更新する
   * @param data
   */
  public async updateRoomData(data: PartialRoomData): Promise<void> {
    if (!this.roomDataKey)
      throw new ApplicationError("Illegal timing error(roomDataKey is null).");
    const cc = SocketFacade.instance.roomDataCC();

    try {
      await cc.touchModify([this.roomDataKey]);
    } catch (err) {
      // nothing.
      console.error(err);
      return;
    }

    // Object.assign()
    if (data.name !== undefined) this.roomData.name = data.name;
    if (data.sceneKey !== undefined) this.roomData.sceneKey = data.sceneKey;
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
    await cc.update([
      {
        key: this.roomDataKey,
        data: this.roomData
      }
    ]);
  }

  private __clientRoomInfo: ClientRoomInfo | null = null;

  public readonly chatPublicInfo: ChatPublicInfo = {
    isUseAllTab: false,
    actorKey: "",
    tabKey: "",
    targetKey: "",
    system: "",
    bcdiceUrl: ""
  };

  // シーンの編集中にシーンの切り替えが行われたとき、その追従を行うための変数
  public isSceneEditing: boolean = false;
  public sceneEditingUpdateSceneKey: string | null = null;

  // 部屋の設定情報
  private roomDataKey: string | null = null;
  public readonly roomData: RoomDataStore = {
    name: "",
    sceneKey: "",
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
    targetKey: string | null;
    tag: string;
    windowKey: string;
  }[] = [];

  public readonly chatList: StoreUseData<ChatStore>[] = [];
  public readonly chatTabList: StoreUseData<ChatTabStore>[] = [];
  public readonly groupChatTabList: StoreUseData<GroupChatTabStore>[] = [];
  public readonly sceneList: StoreUseData<SceneStore>[] = [];
  public readonly cutInList: StoreUseData<CutInStore>[] = [];
  public readonly mediaList: StoreUseData<MediaStore>[] = [];
  public readonly userList: StoreUseData<UserStore>[] = [];
  public readonly socketUserList: StoreUseData<SocketUserStore>[] = [];
  public readonly actorList: StoreUseData<ActorStore>[] = [];
  public readonly sceneLayerList: StoreUseData<SceneLayerStore>[] = [];
  public readonly sceneAndLayerList: StoreUseData<SceneAndLayerStore>[] = [];
  public readonly sceneAndObjectList: StoreUseData<SceneAndObjectStore>[] = [];
  public readonly sceneObjectList: StoreUseData<SceneObjectStore>[] = [];
  public readonly actorStatusList: StoreUseData<ActorStatusStore>[] = [];
  public readonly resourceMasterList: StoreUseData<ResourceMasterStore>[] = [];
  public readonly resourceList: StoreUseData<ResourceStore>[] = [];
  public readonly initiativeColumnList: StoreUseData<
    InitiativeColumnStore
  >[] = [];
  public readonly actorGroupList: StoreUseData<ActorGroupStore>[] = [];
  public readonly cardMetaList: StoreUseData<CardMetaStore>[] = [];
  public readonly cardObjectList: StoreUseData<CardObjectStore>[] = [];
  public readonly cardDeckBigList: StoreUseData<CardDeckBigStore>[] = [];
  public readonly cardDeckSmallList: StoreUseData<CardDeckSmallStore>[] = [];
  public readonly chatPaletteList: StoreUseData<ChatPaletteStore>[] = [];
  public readonly diceTypeList: StoreUseData<DiceTypeStore>[] = [];
  public readonly diceAndPipsList: StoreUseData<DiceAndPipsStore>[] = [];
  public readonly keepBcdiceDiceRollResultList: StoreUseData<
    KeepBcdiceDiceRollResultStore
  >[] = [];
  public readonly memoList: StoreUseData<MemoStore>[] = [];
  public readonly publicMemoList: StoreUseData<PublicMemoStore>[] = [];
  public readonly likeList: StoreUseData<LikeStore>[] = [];
  public readonly counterRemoconList: StoreUseData<CounterRemoconStore>[] = [];

  public get clientRoomInfo(): ClientRoomInfo {
    if (!this.__clientRoomInfo) {
      throw new ApplicationError(
        `Unsupported operation. clientRoomInfo is null.`
      );
    }
    return this.__clientRoomInfo;
  }

  public getExclusionOwnerKey(socketId: string | null): string | null {
    const socketUserInfo = this.socketUserList.find(
      su => su.data!.socketId === socketId
    );
    if (!socketUserInfo) return null;
    return socketUserInfo.data!.userKey;
  }

  public getExclusionOwnerName(socketId: string): string {
    const userKey = this.getExclusionOwnerKey(socketId);
    if (!userKey) return "";
    const userInfo = findByKey(this.userList, userKey);
    return !userInfo
      ? LanguageManager.instance.getText("label.unknown")
      : userInfo.data!.name;
  }

  public static async deleteSceneObject(key: string) {
    try {
      await SocketFacade.instance.sceneObjectCC()!.deletePackage([key]);
    } catch (err) {
      await errorDialog({
        title: LanguageManager.instance.getText("message.error"),
        text:
          "Failure to delete object.\nAny data is locked.\nPlease try again latter."
      });
    }
  }

  public get mySelfUser(): StoreUseData<UserStore> | null {
    return findByKey(this.userList, SocketFacade.instance.userKey) || null;
  }

  public get isGm(): boolean {
    if (!SocketFacade.instance.userKey) return false;
    return (
      !!this.mySelfUser &&
      !!this.mySelfUser.data &&
      this.mySelfUser.data.type === "GM"
    );
  }

  public get mySelfActorKey(): string {
    return this.actorList.find(
      a => a.data!.type === "user" && a.owner === SocketFacade.instance.userKey
    )!.key;
  }

  public async updateMemoList(
    dataList: StoreData<MemoStore>[],
    ownerType: string,
    owner: string
  ): Promise<void> {
    const memoCC = SocketFacade.instance.memoCC();
    const deleteKeyList = GameObjectManager.instance.memoList
      .filter(
        m =>
          m.ownerType === ownerType &&
          m.owner === owner &&
          !dataList.some(d => d.key === m.key)
      )
      .map(m => m.key);
    await memoCC.updatePackage(
      dataList
        .map((ot, index) => ({
          key: ot.key,
          order: ot.owner ? index : -1,
          permission: ot.permission,
          data: ot.data!
        }))
        .filter(data => data.order !== undefined && data.order > -1)
    );
    if (dataList.filter(ot => ot.collection === "volatile").length) {
      const addDataList = dataList
        .map((ot, index: number) => ({
          ownerType,
          owner,
          order: ot.collection === "volatile" ? index : -1,
          permission: ot.permission,
          data: ot.data!
        }))
        .filter(data => data.order > -1);
      await memoCC.addDirect(addDataList);
    }
    if (deleteKeyList.length) {
      await memoCC.deletePackage(deleteKeyList);
    }
  }

  public getOwner<T>(data: StoreData<T>): StoreData<T> | null {
    const ownerType = data.ownerType;
    const owner = data.owner;
    if (!ownerType) return null;
    return findRequireByKey(
      GameObjectManager.instance.getList<T>(ownerType!)!,
      owner
    );
  }

  public getList<T>(type: string): StoreData<T>[] | null {
    let list: StoreData<unknown>[] | null = null;
    switch (type) {
      case "chat-list":
        list = this.chatList;
        break;
      case "chat-tab-list":
        list = this.chatTabList;
        break;
      case "group-chat-tab-list":
        list = this.groupChatTabList;
        break;
      case "scene-list":
        list = this.sceneList;
        break;
      case "media-list":
        list = this.mediaList;
        break;
      case "user-list":
        list = this.userList;
        break;
      case "socket-user-list":
        list = this.socketUserList;
        break;
      case "scene-object-list":
      case "map-mask":
      case "map-marker":
      case "chit":
      case "floor-tile":
      case "dice-symbol":
      case "character":
        list = this.sceneObjectList;
        break;
      case "actor-status-list":
        list = this.actorStatusList;
        break;
      case "actor-list":
        list = this.actorList;
        break;
      case "scene-layer-list":
        list = this.sceneLayerList;
        break;
      case "scene-and-layer-list":
        list = this.sceneAndLayerList;
        break;
      case "scene-and-object-list":
        list = this.sceneAndObjectList;
        break;
      case "resource-master-list":
        list = this.resourceMasterList;
        break;
      case "resource-list":
        list = this.resourceList;
        break;
      case "initiative-column-list":
        list = this.initiativeColumnList;
        break;
      case "actor-group-list":
        list = this.actorGroupList;
        break;
      case "card-meta-list":
        list = this.cardMetaList;
        break;
      case "card-object":
      case "card-object-list":
        list = this.cardObjectList;
        break;
      case "card-deck-big-list":
        list = this.cardDeckBigList;
        break;
      case "card-deck-small":
      case "card-deck-small-list":
        list = this.cardDeckSmallList;
        break;
      case "cut-in-list":
        list = this.cutInList;
        break;
      case "chat-palette-list":
        list = this.chatPaletteList;
        break;
      case "dice-type-list":
        list = this.diceTypeList;
        break;
      case "dice-and-pips-list":
        list = this.diceAndPipsList;
        break;
      case "chat-bcdice-dice-roll-result-list":
        list = this.keepBcdiceDiceRollResultList;
        break;
      case "memo-list":
        list = this.memoList;
        break;
      case "public-memo-list":
      case "public-memo":
        list = this.publicMemoList;
        break;
      case "like-list":
        list = this.likeList;
        break;
      case "counter-remocon-list":
        list = this.counterRemoconList;
        break;
      default:
    }
    return list ? (list as StoreData<T>[]) : null;
  }
}
