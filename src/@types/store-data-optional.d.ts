import { MemoStore, RoomDataStore } from "@/@types/store-data";

type ActorRef = {
  key: string;
  type: "user" | "other";
  userKey: string | null;
};

type Address = Point & Matrix;

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

type BcdiceDiceRollResult = {
  ok: string;
  result?: string;
  secret?: boolean;
  dices?: DiceResult[];
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

type CardDeckLayout = "pile-up" | "spread-out" | "tile" | "line" | "hand";

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

type ChatLinkable = {
  chatLinkage: number;
  chatLinkageSearch: string;
};

type DiceInfo = {
  type: string;
  label: string;
  pips: { [P: string]: string };
};

type DiceMaterial = { [P: string]: DiceInfo[] };

type DiceResult = {
  faces: number;
  value: number;
};

/**
 * 画像の付与情報の定義の1つ
 * 向き
 */
type Direction = "none" | "horizontal" | "vertical" | "180";

type IconClass =
  | "icon-warning"
  | "icon-youtube2"
  | "icon-image"
  | "icon-music"
  | "icon-text";

type InputCardInfo = {
  name?: string;
  text?: string;
  imagePath?: string;
  backgroundColor?: string;
  fontColor?: string;
  style?: any; // プログラムで追加する
};

type Like = {
  char: string;
  actorKey: string;
  count: number;
};

type Matrix = {
  column: number;
  row: number;
};

type ObjectMoveInfo = {
  fromPoint: Point;
  fromAbsPoint: Point; // オブジェクトの座標（スクロールによる拡大縮小やマップの回転を無視した絶対座標）
  fromAbsRelPoint: Point; // オブジェクト座標とマウス座標の差（どちらも絶対座標）
  moveDiff: Point;
  cardCenter: Point; // Card向け
  angleFrom: number;
  angleDiff: number;
};

type OtherTextViewInfo = {
  type: string;
  title?: string;
  key: string;
  dataList: StoreUseData<MemoStore>[];
  rect: Rectangle;
  isFix: boolean;
};

type PartialRoomData = Partial<RoomDataStore> & {
  settings?: PartialRoomInfoExtend;
};

type PartialRoomInfoExtend = Partial<RoomInfoExtend> & {
  windowSettings?: Partial<WindowSettings>;
};

type Place = "field" | "graveyard" | "backstage";

type Point = {
  x: number;
  y: number;
};

type Rectangle = Point & Size;

type RefProperty =
  | "name"
  | "type"
  | "tag"
  | "actor-name"
  | "actor-type"
  | "actor-tag"
  | "owner-name"
  | "owner-type"
  | "object-layer"
  | "actor-status-name"
  | "actor-chat-text-color"
  | "actor-stand-image-position";

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

/**
 * 部屋の追加情報
 */
type RoomInfoExtend = {
  visitable: boolean; // 見学許可
  isFitGrid: boolean; // マップオブジェクトをセルに自動調整するか
  isViewDice: boolean; // ダイスを表示するか
  isViewCutIn: boolean; // カットインを表示するか
  isDrawGridId: boolean; // マップ座標を表示するか
  mapRotatable: boolean; // マップを回転させるか
  isDrawGridLine: boolean; // マップ罫線を表示するか
  isShowStandImage: boolean; // 立ち絵を表示するか,
  isShowRotateMarker: boolean; // マップオブジェクトの回転マーカーを表示するか
  windowSettings: WindowSettings;
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

type SceneObjectType =
  | "character"
  | "map-mask"
  | "map-marker"
  | "dice-symbol"
  | "chit"
  | "floor-tile";

/**
 * 画面を切替える際の演出の選定情報
 */
type SceneSwitch = {
  priority: number; // 優先順位。１が最も優先。
  direction: "normal" | ""; // 演出方法
};

type Size = {
  width: number;
  height: number;
};

// import { StandImageInfo } from "@/app/basic/stand-image/StandImage";
type StandImageDiffInfo = Point & {
  texture: Texture;
  stackType: number; // 重ね方
  time: [number, number];
};

type StandImageInfo = {
  statusKey: string;
  texture: Texture;
  autoResize: boolean;
  animationLength: number;
  diffList: StandImageDiffInfo[];
};

/**
 * マップの背景の定義の集合体
 */
type Texture = TextureColor | TextureImage;

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

type UrlType = "youtube" | "image" | "music" | "setting" | "unknown";

type UserType = "GM" | "PL" | "VISITOR";

type WindowSetting =
  | "not-use" // 使えなくします
  | "free" // 特に指定はありません
  | "init-view" // 入室時に表示します
  | "always-open"; // 常に開いています。閉じることはできません。

type WindowSettings = {
  chat: WindowSetting;
  resource: WindowSetting;
  initiative: WindowSetting;
  chatPalette: WindowSetting;
  counterRemocon: WindowSetting;
};
