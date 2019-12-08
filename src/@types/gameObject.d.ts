import { Point } from "@/@types/address";
import { ColorSpec, ImageSpec } from "@/@types/room";

type VolatileMapObject = {
  moveFrom: Point;
  moveFromPlane: Point;
  moveFromPlaneRelative: Point;
  moveGridOffset: Point;
  moveDiff: Point;
  angleFrom: number;
  angleDiff: number;
};

type MapObject = Point & {
  owner: string; // id
  columns: number;
  rows: number;
  isHideBorder: boolean;
  isHideHighlight: boolean;
  isLock: boolean;
  place: "field" | "graveyard" | "backstage";
  backgroundList: (ColorSpec | ImageSpec)[];
  useBackGround: number;
  angle: number;
};

type MapMaskStore = MapObject;
type ChitStore = MapObject;
type FloorTileStore = MapObject;
type DiceSymbolStore = {
  owner: string; // id
  size: number;
  isHideBorder: boolean;
  isHideHighlight: boolean;
  place: "field" | "graveyard" | "backstage";
  type: string;
  pips: number;
  faceNum: number;
};

type ExtraStore = {
  owner: string; // id
  fontColorType: "owner" | "original";
  fontColor: string;
  status: string; // id
};

type CharacterStore = MapObject & {
  fontColorType: "owner" | "original";
  fontColor: string;
  status: string; // id
  isHide: boolean;
  url: string;
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
