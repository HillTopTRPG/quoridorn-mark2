import { Address, Point } from "address";
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
type SceneObjectBase = Address & {
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
};

type SceneObject = SceneObjectBase &
  (
    | MapMaskStore
    | MapMarkerStore
    | ChitStore
    | FloorTileStore
    | DiceSymbolStore
    | CharacterStore
  );

type MapMaskStore = {
  type: "map-mask";
};
type MapMarkerStore = {
  type: "map-marker";
};
type ChitStore = {
  type: "chit";
};
type FloorTileStore = {
  type: "floor-tile";
};
type DiceSymbolStore = {
  type: "dice-symbol";
  diceType: string; // dice-symbol
  pips: number; // dice-symbol
  faceNum: number; // dice-symbol
};
type CharacterStore = {
  type: "character";
  chatFontColorType: "owner" | "original"; // character
  chatFontColor: string; // character
  actorStatusId: string; // character(id)
  isHide: boolean; // character
  url: string; // character
};

type ExtraStore = {
  owner: string; // id
  chatFontColorType: "owner" | "original";
  chatFontColor: string;
  actorStatusId: string; // id
};

type ActorStatusStore = {
  parentId: string;
  name: string;
  standImageInfoId: "" | string; // id
  chatPaletteInfoId: "" | string; // id
};

// import { StandImageInfo } from "@/app/basic/stand-image/StandImage";
type StandImageDiffInfo = Point & {
  imageId: string;
  imageTag: string;
  type: number;
  time: [number, number];
};

type StandImageInfo = {
  parentId: string;
  baseImageId: string;
  baseImageTag: string;
  autoResize: boolean;
  animationLength: number;
  locate: number;
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
  point: Point;
  columns: number;
  rows: number;
};
