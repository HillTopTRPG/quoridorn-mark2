import DocumentSnapshot from "nekostore/lib/DocumentSnapshot";
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
  AuthorityGroupStore,
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
  CounterRemoconStore,
  MapDrawStore
} from "@/@types/store-data";
import { PartialRoomData } from "@/@types/store-data-optional";
import { OriginalTableStore } from "@/@types/room";
import {
  errorDialog,
  findByKey,
  findRequireByKey
} from "@/app/core/utility/Utility";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import LanguageManager from "@/LanguageManager";
import { ApplicationError } from "@/app/core/error/ApplicationError";
import { loadYaml } from "@/app/core/utility/FileUtility";
import TaskManager from "@/app/core/task/TaskManager";

export type ChatPublicInfo = {
  isUseAllTab: boolean;
  actorKey: string;
  tabKey: string;
  targetKey: string;
  system: string;
  bcdiceUrl: string;
  bcdiceVersion: string;
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

  /**
   * GameObjectManagerのイニシャライズ
   */
  public async initialize() {
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
      sf.authorityGroupCC().getList(true, this.authorityGroupList),
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
        .getList(true, this.keepBcdiceDiceRollResultList),
      sf.mapDrawListCC().getList(true, this.mapDrawList)
    ]);
    // Block 5
    await Promise.all([
      sf.mediaCC().getList(true, this.mediaList),
      sf.cardObjectCC().getList(true, this.cardObjectList),
      sf.actorCC().getList(true, this.actorList),
      sf.chatTabListCC().getList(true, this.chatTabList),
      sf.memoCC().getList(true, this.memoList),
      sf.originalTableListCC().getList(true, this.originalTableList)
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

    this.roomData = { ...roomData.data! };

    await roomDataCC.setSnapshot(
      "GameObjectManager",
      this.roomDataKey!,
      (snapshot: DocumentSnapshot<StoreData<RoomDataStore>>) => {
        if (snapshot.exists() && snapshot.data.status === "modified") {
          this.roomData = { ...snapshot.data.data! };
          TaskManager.instance.ignition<RoomDataStore, void>({
            type: "room-data-update",
            owner: "Quoridorn",
            value: snapshot.data.data!
          });
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
    this.chatPublicInfo.system = this.roomData.system;
    this.chatPublicInfo.bcdiceUrl = this.roomData.bcdiceServer;
    this.chatPublicInfo.bcdiceVersion = this.roomData.bcdiceVersion;
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
   * アクター名を取得する
   * @param actorKey
   */
  public getActorName(actorKey: string | null) {
    const actor = findByKey(this.actorList, actorKey);
    if (!actor) return LanguageManager.instance.getText("label.system");

    let userSuffix: string = "";
    if (actor.data!.type === "user") {
      const user = findByKey(this.userList, actor.owner)!;
      const type = LanguageManager.instance.getText(
        `selection.user-type.${user.data!.type}`.toLowerCase()
      );
      userSuffix = `(${type})`;
    }
    return `${actor.data!.name}${userSuffix}`;
  }

  /**
   * 部屋情報を更新する
   * @param data
   */
  public async updateRoomData(data: PartialRoomData): Promise<void> {
    if (!this.roomDataKey)
      throw new ApplicationError("Illegal timing error(roomDataKey is null).");

    // Object.assign()
    if (data.settings) {
      if (data.settings.windowSettings) {
        data.settings.windowSettings = {
          ...this.roomData.settings.windowSettings,
          ...data.settings.windowSettings
        };
      }
      data.settings = { ...this.roomData.settings, ...data.settings };
    }
    const roomData: RoomDataStore = { ...this.roomData, ...data };

    await SocketFacade.instance.roomDataCC().updatePackage([
      {
        key: this.roomDataKey,
        data: roomData
      }
    ]);
  }

  public readonly chatPublicInfo: ChatPublicInfo = {
    isUseAllTab: false,
    actorKey: "",
    tabKey: "",
    targetKey: "",
    system: "",
    bcdiceUrl: "",
    bcdiceVersion: ""
  };

  // シーンの編集中にシーンの切り替えが行われたとき、その追従を行うための変数
  public isSceneEditing: boolean = false;
  public sceneEditingUpdateSceneKey: string | null = null;

  // 部屋の設定情報
  private roomDataKey: string | null = null;
  public roomData: RoomDataStore = {
    name: "",
    roomNo: -1,
    sceneKey: "",
    bcdiceServer: "",
    bcdiceVersion: "",
    system: "DiceBot",
    settings: {
      visitable: true,
      isFitGrid: true,
      isViewDice: true,
      isViewCutIn: true,
      isDrawGridLine: true,
      isDrawGridId: true,
      mapRotatable: true,
      isShowStandImage: true,
      standImageGridNum: 12,
      isShowRotateMarker: true,
      windowSettings: {
        chat: "free",
        initiative: "free",
        "chat-palette": "free",
        "counter-remocon": "free"
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
  public readonly authorityGroupList: StoreUseData<AuthorityGroupStore>[] = [];
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
  public readonly mapDrawList: StoreUseData<MapDrawStore>[] = [];
  public readonly originalTableList: StoreUseData<OriginalTableStore>[] = [];

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

  public static isOwn(data: StoreData<any>): boolean {
    const rootOwner = GameObjectManager.getRootOwner(data);
    return !!rootOwner && rootOwner.owner === SocketFacade.instance.userKey;
  }

  public static getRootOwner(
    data: StoreData<any>
  ): StoreData<UserStore> | null {
    let currentData: StoreData<any> | null = data;
    while (
      currentData &&
      currentData.ownerType &&
      currentData.ownerType !== "user-list"
    ) {
      currentData = GameObjectManager.getOwner(currentData);
    }
    return currentData;
  }

  public static getOwner<T>(data: StoreData<T>): StoreData<T> | null {
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
      case "status-list":
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
      case "authority-group-list":
        list = this.authorityGroupList;
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
      case "map-draw-list":
        list = this.mapDrawList;
        break;
      case "original-table-list":
        list = this.originalTableList;
        break;
      default:
    }
    return list ? (list as StoreData<T>[]) : null;
  }
}
