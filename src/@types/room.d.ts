import { UserType } from "@/@types/socket";

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

type ColorSpec = {
  backgroundType: "color";
  backgroundColor: string;
};

type ImageSpec = {
  backgroundType: "image";
  imageTag: string;
  imageId: string;
  reverse: "none" | "horizontal" | "vertical" | "180";
};

type ChatLinkable = {
  chatLinkage: number;
  chatLinkageSearch: string;
};

type MapSetting = (ColorSpec | ImageSpec) &
  ChatLinkable & {
    shapeType: "square" | "hex-horizontal" | "hex-vertical";
    totalColumn: number;
    totalRow: number;
    gridSize: number;
    gridBorderColor: string;
    isPourTile: boolean;
    isHexFirstCorner: boolean;
    isHexSecondSmall: boolean;
    background: (ColorSpec | ImageSpec) & {
      maskBlur: number;
    };
    margin: (ColorSpec | ImageSpec) & {
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
