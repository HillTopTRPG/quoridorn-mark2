import {
  GroupRef,
  Address,
  BcdiceDiceRollResult,
  Border,
  CardDeckLayout,
  ChatLinkable,
  DiceResult,
  Direction,
  IconClass,
  Like,
  Place,
  Point,
  RefProperty,
  ResourceType,
  RoomInfoExtend,
  SceneLayerType,
  SceneObjectType,
  SceneSwitch,
  Texture,
  UrlType,
  UserType
} from "@/@types/store-data-optional";
import { Anchor } from "address";

/**
 * authorityGroupCCのデータ定義
 * 任意のユーザとキャラクターのグループとして管理するための情報
 */
type AuthorityGroupStore = {
  name: string;
  isSystem: boolean;
  list: GroupRef[];
};

type ActorStatusStore = {
  // actorKey: string; actorKeyはownerで管理
  name: string; // ステータス名
  isSystem: boolean;
  standImageKey: string | null; // key
};

type ActorStore = {
  name: string; // 名前
  tag: string; // タグ
  type: "user" | "character";
  chatFontColorType: "owner" | "original"; // チャット文字色はオーナー（ユーザ）の色か独自の色か
  chatFontColor: string; // 独自のチャット文字色
  standImagePosition: number; // 1〜12
  pieceKeyList: string[]; // コマのID一覧
  statusKey: string; // ステータスへの参照
};

type CardDeckBigStore = {
  name: string;
};

type CardDeckSmallStore = {
  // owner があれば手札
  name: string;
  layout: CardDeckLayout;
  address: Address; // x, y: 手札の起点, row, column: フィールドの起点
  width: number; // 手札の表示幅
  rows: number; // フィールドの設置高さ
  columns: number; // フィールドの設置幅
  isUseHoverView: boolean;
  tileReorderingMode: "substitute" | "insert"; // タイルの並べ替え方式(substitute: 置換, insert: 挿入)
  cardWidthRatio: number; // 置き場の大きさに収まるカードの枚数（幅）
  cardHeightRatio: number; // 置き場の大きさに収まるカードの枚数（高さ）
  layoutRows: number; // 置き場に対して何行使ってカードを配置するか
  layoutColumns: number; // 置き場に対して何列使ってカードを配置するか
  layerKey: string; // 配置するシーンレイヤー
  total: number;
};

// カード１枚のデータ
// カード一覧で見せたくない場合はこいつのView権限
type CardMetaStore = {
  // cardDeckBigKey は owner で管理
  // cardDeckSmallKey は ここでは不要
  width: number; // カードの横幅
  height: number; // カードの高さ
  padHorizontal: number; // ふちの幅（横方向）
  padTop: number; // ふちの幅（上部）
  padBottom: number; // ふちの幅（下部）
  radius: number; // 角の丸み
  frontImage: string; // オモテ面の画像
  frontBackgroundColor: string; // オモテ面の背景色
  backImage: string; // ウラ面の画像
  backBackgroundColor: string; // ウラ面の背景色
  fontColor: string; // 文字色
  name: string; // 名前
  nameHeight: number; // 名前の表示高さ
  nameFontSize: number; // 名前のフォントサイズ
  nameBackgroundColor: string; // 名前の背景色
  text: string; // テキスト
  textHeight: number; // テキストの表示高さ
  textFontSize: number; // テキストのフォントサイズ
  textPadding: number; // テキストの内余白
  textBackgroundColor: string; // テキストの背景色
};

// オブジェクトとして触れるカードのデータ
// こいつのView権限はオモテ面を公開するかどうか。
type CardObjectStore = {
  // cardDeckSmallKey は owner で管理
  cardMetaKey: string; // カード情報への参照
  cardDeckBigKey: string; // 所属するデッキへの参照
  isTurnOff: boolean; // 伏せているかどうか
  point: Point; // 置き場のレイアウトが frankness の場合の座標
  angle: number; // 置き場のレイアウトが frankness の場合の角度
};

type ChatPaletteStore = {
  name: string;
  source: "normal" | string;
  paletteText: string;
  chatFontColorType: "owner" | "original"; // チャット文字色はオーナーの色か独自の色か
  chatFontColor: string; // 独自のチャット文字色
  actorKey: string | null;
  sceneObjectKey: string | null;
  targetKey: string | null;
  outputTabKey: string | null;
  statusKey: string | null;
  system: string | null;
  isSecret: boolean;
};

type ChatStore = {
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

type ChatTabStore = {
  name: string;
  isSystem: boolean;
  useReadAloud: boolean;
  readAloudVolume: number;
};

/**
 * cutInDataCCのデータ定義
 */
type CutInStore = {
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
  imageKey: string | null;
  imageTag: string | null;
  direction: Direction;
  bgmKey: string | null;
  bgmTag: string | null;
  isUseImage: boolean;
  isUseBgm: boolean;
  fitEdge: "none" | "width" | "height";
  imageWidth: number;
  imageHeight: number;
};

type DiceTypeStore = {
  faceNum: string;
  subType: string;
  label: string;
};

type DiceAndPipsStore = {
  diceTypeKey: string;
  pips: string;
  mediaKey: string;
};

type GroupChatTabStore = {
  name: string;
  isSystem: boolean;
  authorityGroupKey: string;
  isSecret: boolean;
  outputChatTabKey: string | null;
};

// イニシアティブ表の列の定義
type InitiativeColumnStore = {
  resourceMasterKey: string;
};

type KeepBcdiceDiceRollResultStore = {
  type: "secret-dice-roll" | "hide-dice-symbol-roll";
  text: string;
  targetKey: string;
  bcdiceDiceRollResult: BcdiceDiceRollResult;
};

type LikeStore = {
  char: string;
  isThrowLinkage: boolean;
  linkageResourceKey: string | null;
};

type MediaStore = {
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

type MemoStore = {
  // 所有者はownerで表現(characterだとその他欄, publicMemoだと共有メモといった具合)
  tab: string;
  type: "normal" | "url";
  text: string;
};

type PropertySelectionStore = {
  selection: string;
  label: string;
  value: string;
};

type PublicMemoStore = {
  name: string;
  mediaKey: string;
  mediaTag: string;
  direction: Direction;
};

type ResourceMasterStore = {
  label: string;
  type: ResourceType;
  systemColumnType: "name" | "initiative" | null; // システム列の種類
  isAutoAddActor: boolean; // アクターに自動付与するかどうか
  isAutoAddMapObject: boolean; // コマに自動付与するかどうか
  icon: {
    mediaKey: string | null; // アイコンを設定するならその画像のID
    mediaTag: string | null; // アイコンを設定するならその画像のタグ
    imageDirection: Direction | null; // アイコンを設定するならその画像の表示方法
  };
  refProperty: RefProperty | null; // 参照先プロパティ
  min: number | null; // 数値の場合、その最小値
  max: number | null; // 数値の場合、その最大値
  interval: number | null; // 数値の場合、その変化値
  selectionStr: string | null; // radio or select or comboの場合、その候補
  defaultValue: string;
};

// リソースインスタンス
type ResourceStore = {
  // 誰のリソースかはownerで表現
  resourceMasterKey: string;
  type: ResourceType;
  value: string;
};

/**
 * roomDataCCのデータ定義
 * 部屋1つに関する設定情報
 */
type RoomDataStore = {
  name: string;
  sceneKey: string;
  settings: RoomInfoExtend;
};

/**
 * sceneAndLayerCCのデータ定義
 * マップとレイヤーの紐付き1本単位の情報
 */
type SceneAndLayerStore = {
  sceneKey: string;
  layerKey: string;
  isUse: boolean;
};

/**
 * sceneAndObjectCCのデータ定義
 * マップとオブジェクトの紐付き1本単位の情報
 */
type SceneAndObjectStore = {
  sceneKey: string;
  objectKey: string;
  // startTimeStatus: "" | "normal" | string; // マップに同期切替した際に設定されるステータス（キャラクターのみ）
  // startTimePlace: "" | Place; // マップに同期切替した際に設定される場所
  isOriginalAddress: boolean; // マップ独自の座標を持つかどうか
  originalAddress: Address | null; // 独自座標を持つならその座標
  entering: "normal" | string; // 登場の仕方
};

/**
 * sceneLayerCCのデータ定義
 * マップレイヤー1層の情報
 */
type SceneLayerStore = {
  type: SceneLayerType;
  defaultOrder: number; // マップ設定をいじらなければこのオーダー順に従う(= z-index)
  isSystem: boolean; // システムレイヤーは削除させない
  name?: string; // ユーザが追加するレイヤーのみこのフィールドを使う
};

type SceneObjectStore = Address & {
  type: SceneObjectType;
  tag: string;
  name: string;
  actorKey: string | null; // key
  rows: number;
  columns: number;
  isHideBorder: boolean;
  isHideHighlight: boolean;
  isLock: boolean;
  place: Place;
  layerKey: string;
  textures: Texture[];
  textureIndex: number;
  angle: number;
  url: string; // character
  subTypeKey: string; // サイコロの種類など
  subTypeValue: string; // 出目など
  isHideSubType: boolean; // 出目を隠すかどうか
};

/**
 * sceneListCCのデータ定義
 * 1画面の情報
 */
type SceneStore = ChatLinkable & {
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
 * socketCCのデータ定義
 * 通信1本に関する情報
 */
type SocketUserStore = {
  userKey: string;
  socketId: string;
};

/**
 * userCCのデータ定義
 * ユーザ1人に関する情報
 */
type UserStore = {
  name: string;
  type: UserType;
  login: number;
  password: string;
  isExported: string;
  token: string;
};

type CounterRemoconTargetType = "every-one" | "own";
type CounterRemoconModifyType = "substitute" | "plus-minus";

type CounterRemoconStore = {
  name: string;
  targetType: CounterRemoconTargetType;
  resourceMasterKey: string | null;
  modifyType: CounterRemoconModifyType;
  value: string; // 空文字で範囲選択
  messageFormat: string;
};

type MapDrawType = "text" | "polygon" | "line";
type MapDrawStore = {
  sceneLayerKey: string;
  pointList: Point[];
  type: MapDrawType;
  lineWidth: number;
  fillStyle: string;
  strokeStyle: string;
  value: string;
  fontSize: number;
  textAnchor: Anchor;
  correctionText: Point;
  style: string;
};
