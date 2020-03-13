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
  point: Point;
  width: number;
  height: number;
  isFix: boolean;
};
