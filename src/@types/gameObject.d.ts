import { Address, Point, Rectangle } from "address";
import { Direction, Texture } from "./room";
import { BcdiceDiceRollResult } from "@/@types/bcdice";

type SceneObjectType =
  | "character"
  | "map-mask"
  | "map-marker"
  | "dice-symbol"
  | "chit"
  | "floor-tile";

type ObjectMoveInfo = {
  fromPoint: Point;
  fromAbsPoint: Point; // オブジェクトの座標（スクロールによる拡大縮小やマップの回転を無視した絶対座標）
  fromAbsRelPoint: Point; // オブジェクト座標とマウス座標の差（どちらも絶対座標）
  moveDiff: Point;
  cardCenter: Point; // Card向け
  angleFrom: number;
  angleDiff: number;
};

type Place = "field" | "graveyard" | "backstage";
type SceneObject = Address & {
  type: SceneObjectType;
  tag: string;
  name: string;
  actorId: string | null; // id
  rows: number;
  columns: number;
  isHideBorder: boolean;
  isHideHighlight: boolean;
  isLock: boolean;
  otherText: string;
  place: Place;
  layerId: string;
  textures: Texture[];
  textureIndex: number;
  angle: number;
  url: string; // character
  subTypeId: string; // サイコロの種類など
  subTypeValue: string; // 出目など
  isHideSubType: boolean; // 出目を隠すかどうか
};

type ActorStore = {
  name: string; // 名前
  tag: string; // タグ
  type: "user" | "character";
  chatFontColorType: "owner" | "original"; // チャット文字色はオーナー（ユーザ）の色か独自の色か
  chatFontColor: string; // 独自のチャット文字色
  standImagePosition: number; // 1〜12
  pieceIdList: string[]; // コマのID一覧
  statusId: string; // ステータスへの参照
};

type ActorStatusStore = {
  // actorId: string; actorIdはownerで管理
  name: string; // ステータス名
  isSystem: boolean;
  standImageInfoId: string | null; // id
  chatPaletteInfoId: string | null; // id
};

// import { StandImageInfo } from "@/app/basic/stand-image/StandImage";
type StandImageDiffInfo = Point & {
  texture: Texture;
  stackType: number; // 重ね方
  time: [number, number];
};

type StandImageInfo = {
  statusId: string;
  texture: Texture;
  autoResize: boolean;
  animationLength: number;
  diffList: StandImageDiffInfo[];
};

type ChatPaletteStore = {
  name: string;
  paletteText: string;
  chatFontColorType: "owner" | "original"; // チャット文字色はオーナーの色か独自の色か
  chatFontColor: string; // 独自のチャット文字色
  actorId: string | null;
  sceneObjectId: string | null;
  targetId: string | null;
  outputTabId: string | null;
  statusId: string | null;
  system: string | null;
  isSecret: boolean;
};

type TagNoteStore = {
  fontColor: string;
  backgroundColor: string;
  text: string;
};

// リソース定義
type ResourceType =
  | "no-contents"
  | "ref-normal"
  | "ref-owner"
  | "text"
  | "input-text"
  | "number"
  | "check"
  | "select"
  | "combo"
  | "color";

type RefProperty =
  | "name"
  | "type"
  | "tag"
  | "actor-name"
  | "actor-type"
  | "actor-tag"
  | "owner-name"
  | "owner-type"
  | "object-other-text"
  | "object-layer"
  | "actor-status-name"
  | "actor-chat-text-color"
  | "actor-stand-image-position";

type ResourceMasterStore = {
  label: string;
  type: ResourceType;
  systemColumnType: "name" | "initiative" | null; // システム列の種類
  isAutoAddActor: boolean; // アクターに自動付与するかどうか
  isAutoAddMapObject: boolean; // コマに自動付与するかどうか
  iconImageId: string | null; // アイコンを設定するならその画像のID
  iconImageTag: string | null; // アイコンを設定するならその画像のタグ
  iconImageDirection: Direction | null; // アイコンを設定するならその画像の表示方法
  refProperty: RefProperty | null; // 参照先プロパティ
  min: number | null; // 数値の場合、その最小値
  max: number | null; // 数値の場合、その最大値
  interval: number | null; // 数値の場合、その変化値
  selectionStr: string | null; // radio or select or comboの場合、その候補
  defaultValue: string;
};

// イニシアティブ表の列の定義
type InitiativeColumnStore = {
  resourceMasterId: string;
};

// リソースインスタンス
type ResourceStore = {
  // 誰のリソースかはownerで表現
  masterId: string;
  type: ResourceType;
  value: string;
};

type PropertySelectionStore = {
  selection: string;
  label: string;
  value: string;
};

type OtherTextViewInfo = {
  type: string;
  docId: string;
  text: string;
  rect: Rectangle;
  isFix: boolean;
};

// カード１枚のデータ
// カード一覧で見せたくない場合はこいつのView権限
type CardMeta = {
  // cardDeckBigId は owner で管理
  // cardDeckSmallId は ここでは不要
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
type CardObject = {
  // cardDeckSmallId は owner で管理
  cardMetaId: string; // カード情報への参照
  cardDeckBigId: string; // 所属するデッキへの参照
  isTurnOff: boolean; // 伏せているかどうか
  point: Point; // 置き場のレイアウトが frankness の場合の座標
  angle: number; // 置き場のレイアウトが frankness の場合の角度
};

type CardDeckBig = {
  name: string;
};

type CardDeckLayout = "pile-up" | "spread-out" | "tile" | "line" | "hand";
type CardDeckSmall = {
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
  layerId: string; // 配置するシーンレイヤー
  total: number;
};

type InputCardInfo = {
  name?: string;
  text?: string;
  imagePath?: string;
  backgroundColor?: string;
  fontColor?: string;
  style?: any; // プログラムで追加する
};

type CardYamlInfo = {
  title: string;
  basePath: string;
  back: {
    imagePath: string;
    backgroundColor: string;
  };
  width: number;
  height: number;
  radius: number;
  padHorizontal: number;
  padTop: number;
  padBottom: number;
  nameHeight: number;
  nameFontSize: number;
  nameBackgroundColor: string;
  textHeight: number;
  textFontSize: number;
  textPadding: number;
  textBackgroundColor: string;
  source: {
    author: string;
    title: string;
    refs: {
      url: string;
      author: string;
      title: string;
    }[];
  };
  cards: InputCardInfo[];
};

type DiceInfo = {
  type: string;
  label: string;
  pips: { [P: string]: string };
};
type DiceMaterial = { [P: string]: DiceInfo[] };

type KeepBcdiceDiceRollResult = {
  type: "secret-dice-roll" | "hide-dice-symbol-roll";
  targetId: string;
  bcdiceDiceRollResult: BcdiceDiceRollResult;
};
