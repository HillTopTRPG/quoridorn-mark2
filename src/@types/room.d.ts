import { Address, Point } from "address";
import { PartialRoomInfoExtend, RoomInfoExtend, UserType } from "./socket";
import { DiceResult } from "./bcdice";
import { IconClass, UrlType } from "@/app/core/utility/FileUtility";
import { DiceMaterial, LikeStore } from "@/@types/gameObject";

export type PlayBgmInfo =
  | {
      targetKey: string;
      data: null;
    }
  | {
      targetKey: null;
      data: CutInDeclareInfo;
    };

export type MediaUploadInfo = {
  resultList: (File | string)[];
};

/**
 * roomDataCCのデータ定義
 * 部屋1つに関する設定情報
 */
type RoomData = {
  name: string;
  sceneKey: string;
  settings: RoomInfoExtend;
};

type PartialRoomData = Partial<RoomData> & {
  settings?: PartialRoomInfoExtend;
};

/**
 * userCCのデータ定義
 * ユーザ1人に関する情報
 */
type UserData = {
  name: string;
  type: UserType;
  login: number;
};

/**
 * socketCCのデータ定義
 * 通信1本に関する情報
 */
type SocketUserData = {
  userKey: string;
  socketId: string;
};

/**
 * 画像の付与情報の定義の1つ
 * 表示サイズ
 */
type BackgroundSize =
  | "contain"
  | "cover-start"
  | "cover-center"
  | "cover-end"
  | "100%";

/**
 * 画像の付与情報の定義の1つ
 * 向き
 */
type Direction = "none" | "horizontal" | "vertical" | "180";

/**
 * マップの背景の定義の1つ
 * 背景色による指定
 */
type TextureColor = {
  type: "color";
  backgroundColor: string;
  fontColor: string;
  text: string;
};

/**
 * マップの背景の定義の1つ
 * 画像による指定
 */
type TextureImage = {
  type: "image";
  mediaTag: string;
  mediaKey: string;
  direction: Direction;
  backgroundSize: BackgroundSize;
};

/**
 * マップの背景の定義の集合体
 */
type Texture = TextureColor | TextureImage;

type ChatLinkable = {
  chatLinkage: number;
  chatLinkageSearch: string;
};

/**
 * マップレイヤーの種別
 */
type SceneLayerType =
  | "floor-tile"
  | "map-mask"
  | "map-marker"
  | "dice-symbol"
  | "card"
  | "character"
  | "other";

/**
 * sceneLayerCCのデータ定義
 * マップレイヤー1層の情報
 */
type SceneLayer = {
  type: SceneLayerType;
  defaultOrder: number; // マップ設定をいじらなければこのオーダー順に従う(= z-index)
  isSystem: boolean; // システムレイヤーは削除させない
  name?: string; // ユーザが追加するレイヤーのみこのフィールドを使う
};

/**
 * sceneAndLayerCCのデータ定義
 * マップとレイヤーの紐付き1本単位の情報
 */
type SceneAndLayer = {
  sceneKey: string;
  layerKey: string;
  isUse: boolean;
};

/**
 * sceneAndObjectCCのデータ定義
 * マップとオブジェクトの紐付き1本単位の情報
 */
type SceneAndObject = {
  sceneKey: string;
  objectKey: string;
  // startTimeStatus: "" | "normal" | string; // マップに同期切替した際に設定されるステータス（キャラクターのみ）
  // startTimePlace: "" | Place; // マップに同期切替した際に設定される場所
  isOriginalAddress: boolean; // マップ独自の座標を持つかどうか
  originalAddress: Address | null; // 独自座標を持つならその座標
  entering: "normal" | string; // 登場の仕方
};

/**
 * CSS的な罫線の定義
 */
type Border = {
  width: number;
  color: string;
  style:
    | "solid"
    | "groove"
    | "ridge"
    | "inset"
    | "outset"
    | "double"
    | "dotted"
    | "dashed";
};

/**
 * 画面を切替える際の演出の選定情報
 */
type SceneSwitch = {
  priority: number; // 優先順位。１が最も優先。
  direction: "normal" | ""; // 演出方法
};

/**
 * sceneListCCのデータ定義
 * 1画面の情報
 */
type Scene = ChatLinkable & {
  name: string;
  columns: number;
  rows: number;
  gridSize: number;
  gridColor: string;
  fontColor: string;
  portTileMapping: string; // タイル番号の羅列
  switchBefore: SceneSwitch;
  switchAfter: SceneSwitch;
  shapeType:
    | "square"
    | "hex-horizontal-slim"
    | "hex-horizontal-fat"
    | "hex-horizontal-start"
    | "hex-horizontal-end"
    | "hex-vertical-slim"
    | "hex-vertical-fat"
    | "hex-vertical-start"
    | "hex-vertical-end";
  texture: Texture;
  background: {
    texture: Texture;
    maskBlur: number;
  };
  margin: {
    useTexture: "original" | "same map" | "same background";
    texture: Texture;
    columns: number;
    rows: number;
    isUseGrid: boolean;
    gridColorBold: string;
    gridColorThin: string;
    maskColor: string;
    maskBlur: number;
    border: Border;
  };
};

/**
 * 画像1件に付与される、立ち絵に関する付与情報
 */
type StandImageInfo = Point & {
  status: string;
  viewStart: number;
  viewEnd: number;
  type: "pile" | "replace";
};

type MediaInfo = {
  name: string;
  rawPath: string;
  mediaFileId: string;
  tag: string;
  url: string;
  urlType: UrlType;
  iconClass: IconClass;
  imageSrc: string;
  dataLocation: "server" | "direct";
};

export type ActorRef = {
  key: string;
  type: "user" | "other";
  userKey: string | null;
};

/**
 * actorGroupCCのデータ定義
 * 任意のユーザとキャラクターのグループとして管理するための情報
 */
export type ActorGroup = {
  name: string;
  isSystem: boolean;
  list: ActorRef[];
};

export type GroupChatTabInfo = {
  name: string;
  isSystem: boolean;
  actorGroupKey: string;
  isSecret: boolean;
  outputChatTabKey: string | null;
};

/**
 * cutInDataCCのデータ定義
 */
export type CutInDeclareInfo = {
  url: string;
  title: string;
  tag: string;
  isRepeat: boolean;
  fadeIn: number;
  fadeOut: number;
  start: number;
  end: number;
  volume: number;
  chatLinkageType: "none" | "last" | "regexp";
  chatLinkageTarget: string;
  isStandBy: boolean;
  isForceNew: boolean;
  isForceContinue: boolean;
  duration?: number; // 長さ（再生することで得られる）
};

type YoutubeVolumeChangeInfo = {
  tag: string;
  windowStatus: string;
  volume: number;
};

type YoutubeMuteChangeInfo = {
  tag: string;
  windowStatus: string;
  isMute: boolean;
};

type CustomDiceBotInfo = {
  commandName: string;
  diceRoll: string;
  tableTitle: string;
  tableContents: {
    [key in string]: string;
  };
  system: string; // yamlファイルには未記載。プログラムで設定する変数。
};

type Like = {
  char: string;
  actorKey: string;
  count: number;
};

type ChatInfo = {
  chatType: "chat" | "system-message";
  tabKey: string;
  text: string;
  diceRollResult: string | null;
  dices: DiceResult[];
  isSecretDice: boolean; // BCDiceのシークレットダイス
  customDiceBotResult: string | null;
  actorKey: string | null;
  statusKey: string | null;
  system: string;
  targetType: "group" | "actor" | null;
  targetKey: string;
  isSecret: boolean; // 秘匿チャット
  like: Like[];
};

type ChatTabInfo = {
  name: string;
  isSystem: boolean;
  useReadAloud: boolean;
  readAloudVolume: number;
};

type AddRoomPresetDataRequest = {
  roomName: string;
  roomExtendInfo: RoomInfoExtend;
  sceneData: Scene;
  cutInDataList: CutInDeclareInfo[];
  diceMaterial: DiceMaterial;
  likeList: LikeStore[];
  language: {
    mainChatTabName: string;
    allGroupChatTabName: string;
    nameLabel: string;
  };
};
