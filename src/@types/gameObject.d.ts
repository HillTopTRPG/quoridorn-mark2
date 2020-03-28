import { Address, Point, Rectangle } from "address";
import { Texture } from "@/@types/room";

type SceneObjectType =
  | "character"
  | "map-mask"
  | "map-marker"
  | "dice-symbol"
  | "chit"
  | "floor-tile";

type VolatileMapObject = {
  moveFrom: Point;
  moveFromPlane: Point;
  moveFromPlaneRelative: Point;
  moveGridOffset: Point;
  moveDiff: Point;
  angleFrom: number;
  angleDiff: number;
};

type Place = "field" | "graveyard" | "backstage";
type SceneObject = Address & {
  type: SceneObjectType;
  tag: string;
  name: string;
  owner: string; // id
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
  subType: string; // サイコロの色など
  pips: number; // 出目
  faceNum: number; // 出目の最大数
};

type ActorStore = {
  name: string; // 名前
  tag: string; // タグ
  type: "user" | "character";
  chatFontColorType: "owner" | "original"; // チャット文字色はオーナー（ユーザ）の色か独自の色か
  chatFontColor: string; // 独自のチャット文字色
  standImagePosition: number; // 1〜12
  isUseTableData: boolean; // イニシアティブ表のデータを持つかどうか
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

// import { ChatPaletteInfo } from "@/app/basic/chat-palette/ChatPalette";
type ChatPaletteInfo = {
  parentId: string;
  list: string[];
};

type TagNoteStore = {
  fontColor: string;
  backgroundColor: string;
  text: string;
};

type PropertyFaceStore = {
  owner: string;
  label: string;
  permissionType: "ALL" | "OK" | "NG";
  targets: string[];
};

type PropertyStore = {
  owner: string;
  label: string;
  type:
    | "title"
    | "subTitle"
    | "text"
    | "input-text"
    | "number"
    | "check"
    | "radio"
    | "select"
    | "combo"
    | "image"
    | "color";
  min?: number;
  max?: number;
  interval?: number;
  selection?: string;
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
  // actorId は owner で管理
  cardMetaId: string; // カード情報への参照
  cardDeckBigId: string; // 所属するデッキへの参照
  cardDeckSmallId: string | null; // 所属するデッキへの参照
  isTurnOff: boolean; // 伏せているかどうか
  point: Point; // 置き場のレイアウトが frankness の場合の座標
  angle: number; // 置き場のレイアウトが frankness の場合の角度
};

type CardDeckBig = {
  name: string;
};

type CardDeckSmall = {
  name: string;
  layout: "deck" | "hand" | "tile" | "frankness";
  address: Address; // x, y: 手札の起点, row, column: フィールドの起点
  width: number; // 手札の表示幅
  rows: number; // フィールドの設置高さ
  columns: number; // フィールドの設置幅
  tileReorderingMode: "substitute" | "insert"; // タイルの並べ替え方式(substitute: 置換, insert: 挿入)
  cardWidthRatio: number; // 置き場の大きさに収まるカードの枚数（幅）
  cardHeightRatio: number; // 置き場の大きさに収まるカードの枚数（高さ）
  layoutRows: number; // 置き場に対して何行使ってカードを配置するか
  layoutColumns: number; // 置き場に対して何列使ってカードを配置するか
  layerId: string; // 配置するシーンレイヤー
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
