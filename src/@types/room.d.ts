import { UserType } from "@/@types/socket";
import { Point } from "@/@types/address";
import { Place } from "@/@types/gameObject";

type RoomData = {
  mapId: string;
  isDrawGridLine: boolean;
  isDrawGridId: boolean;
  isFitGrid: boolean;
  isUseRotateMarker: boolean;
};

type UserData = {
  userName: string;
  userType: UserType;
  login: number;
};

type Color = {
  type: "color";
  backgroundColor: string;
  fontColor: string;
  text: string;
};

type BackgroundSize =
  | "contain"
  | "cover-start"
  | "cover-center"
  | "cover-end"
  | "100%";
type Direction = "none" | "horizontal" | "vertical" | "180";

type Image = {
  type: "image";
  imageTag: string;
  imageId: string;
  direction: Direction;
  backgroundSize: BackgroundSize;
};

type Texture = Color | Image;

type ChatLinkable = {
  chatLinkage: number;
  chatLinkageSearch: string;
};

type MapLayerType =
  | "floor-tile"
  | "map-mask"
  | "map-marker"
  | "dice-symbol"
  | "character"
  | "other";

type MapLayer = {
  type: MapLayerType;
  defaultOrder: number; // マップ設定をいじらなければこのオーダー順に従う(= z-index)
  deletable: boolean; // システムレイヤーは削除させない
  isDefault: boolean; // マップ追加時に自動的に紐づけられるレイヤーはtrue
  name?: string; // ユーザが追加するレイヤーのみこのフィールドを使う
};

type MapObjectLocation = Point & {
  objectId: string;
  status: "normal" | string;
  place: Place;
  entering: "none" | string; // 入方方法
};

type MapAndLayer = {
  mapId: string;
  layerId: string;
  isTakeOver: boolean;
  objectList: MapObjectLocation[];
};

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
