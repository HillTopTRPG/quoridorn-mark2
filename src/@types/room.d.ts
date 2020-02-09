import { UserType } from "@/@types/socket";
import { MapObjectType, Place } from "@/@types/gameObject";
import { Point } from "address";

/**
 * roomDataCCのデータ定義
 * 部屋1つに関する設定情報
 */
type RoomData = {
  mapId: string;
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
type MapLayerType =
  | "floor-tile"
  | "map-mask"
  | "map-marker"
  | "dice-symbol"
  | "character"
  | "other";

/**
 * mapLayerCCのデータ定義
 * マップレイヤー1層の情報
 */
type MapLayer = {
  type: MapLayerType;
  defaultOrder: number; // マップ設定をいじらなければこのオーダー順に従う(= z-index)
  deletable: boolean; // システムレイヤーは削除させない
  isDefault: boolean; // マップ追加時に自動的に紐づけられるレイヤーはtrue
  name?: string; // ユーザが追加するレイヤーのみこのフィールドを使う
};

/**
 * マップレイヤーが表示される際にオブジェクトに対して上書き設定する情報
 */
type MapObjectLocation = Point & {
  objectId: string;
  objectType: MapObjectType;
  status: "normal" | string;
  place: Place;
  entering: "normal" | string; // 登場の仕方
};

/**
 * mapAndLayerCCのデータ定義
 * マップとレイヤーの紐付き1本単位の情報
 */
type MapAndLayer = {
  mapId: string;
  layerId: string;
  entering: "normal" | string; // 登場の仕方
  objectList: MapObjectLocation[];
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
