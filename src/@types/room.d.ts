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
  defaultOrder: number;
  deletable: boolean;
  isDefault: boolean;
  name?: string;
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

type MapSetting = ChatLinkable & {
  name: string;
  shapeType: "square" | "hex-horizontal" | "hex-vertical";
  totalColumn: number;
  totalRow: number;
  gridSize: number;
  gridBorderColor: string;
  isPourTile: boolean;
  isHexFirstCorner: boolean;
  isHexSecondSmall: boolean;
  texture: Texture;
  background: {
    texture: Texture;
    maskBlur: number;
  };
  margin: {
    texture: Texture;
    isUseGridColor: boolean;
    gridColorBold: string;
    gridColorThin: string;
    column: number;
    row: number;
    isUseMaskColor: boolean;
    maskColor: string;
    maskBlur: number;
    isUseImage: "none" | "same map" | "same background" | "original";
    borderWidth: number;
    borderColor: string;
    borderStyle: "solid" | "ridge" | "double";
  };
  portTileMapping: string;
};
