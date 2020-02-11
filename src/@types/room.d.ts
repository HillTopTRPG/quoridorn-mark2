import { UserType } from "@/@types/socket";
import { Place } from "@/@types/gameObject";
import { Matrix, Point } from "address";

/**
 * roomDataCCのデータ定義
 * 部屋1つに関する設定情報
 */
type RoomData = {
  screenId: string;
  isDrawGridLine: boolean;
  isDrawGridId: boolean;
  isFitGrid: boolean;
  isUseRotateMarker: boolean;
};

/**
 * userCCのデータ定義
 * ユーザ1人に関する情報
 */
type UserData = {
  userName: string;
  userType: UserType;
  login: number;
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
 * マップの背景の定義の1つa
 * 画像による指定
 */
type TextureImage = {
  type: "image";
  imageTag: string;
  imageId: string;
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
type ScreenLayerType =
  | "floor-tile"
  | "map-mask"
  | "map-marker"
  | "dice-symbol"
  | "character"
  | "other";

/**
 * screenLayerCCのデータ定義
 * マップレイヤー1層の情報
 */
type ScreenLayer = {
  type: ScreenLayerType;
  defaultOrder: number; // マップ設定をいじらなければこのオーダー順に従う(= z-index)
  isSystem: boolean; // システムレイヤーは削除させない
  name?: string; // ユーザが追加するレイヤーのみこのフィールドを使う
};

/**
 * screenAndLayerCCのデータ定義
 * マップとレイヤーの紐付き1本単位の情報
 */
type ScreenAndLayer = {
  screenId: string;
  layerId: string;
  isUse: boolean;
};

/**
 * screenAndObjectCCのデータ定義
 * マップとオブジェクトの紐付き1本単位の情報
 */
type ScreenAndObject = {
  screenId: string;
  objectId: string;
  startTimeStatus: "normal" | string | null; // マップに同期切替した際に設定されるステータス（キャラクターのみ）
  startTimePlace: Place | null; // マップに同期切替した際に設定される場所
  startTimePoint: Point | null; // マップに同期切替した際に設定される座標
  startTimeMatrix: Matrix | null; // マップに同期切替した際に設定される座標
  isOriginalPoint: boolean; // マップ独自の座標を持つかどうか
  originalPoint: Point | null; // 独自座標を持つならその座標
  originalMatrix: Matrix | null; // 独自座標を持つならその座標
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
 * screenListCCのデータ定義
 * 1画面の情報
 */
type Screen = ChatLinkable & {
  name: string;
  columns: number;
  rows: number;
  gridSize: number;
  gridColor: string;
  fontColor: string;
  portTileMapping: string; // タイル番号の羅列
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

/**
 * imageDataCCのデータ定義
 * 画像1件の情報
 */
type Image = {
  tag: string;
  data: string;
  password: string;
  standImageInfo: StandImageInfo | null;
};

/**
 * actorGroupCCのデータ定義
 * 任意のユーザとキャラクターのグループとして管理するための情報
 */
export type ActorGroup = {
  name: string;
  isSystem: boolean;
  isChatGroup: boolean;
  list: {
    type: "user" | "character";
    id: string;
  }[];
};

/**
 * cutInDataCCのデータ定義
 */
type CutInDeclareInfo = {
  title: string;
  url: string;
  tag: string;
  chatLinkage: 0 | 1 | 2;
  chatLinkageSearch: string;
  forceReset: boolean;
  start: number;
  end: number;
  volume: number;
  isLoop: boolean;
  fadeIn: number;
  fadeOut: number;
};

/**
 * playListCCのデータ定義
 */
type CutInPlayingInfo = {
  duration: number;
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
