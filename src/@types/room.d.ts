type MapShape = "square" | "horizontal-hex" | "vertical-hex";

export type RoomInfoExtend = {
  visitable: boolean;
  chatWindow: boolean;
  dice: boolean;
  initiativeWindow: boolean;
  resourceWindow: boolean;
  chatPaletteWindow: boolean;
  counterRemocon: boolean;
  standImage: boolean;
  cutIn: boolean;
  drawMapAddress: boolean;
  mapShape: MapShape;
  drawMapShape: boolean;
  autoFitMapShape: boolean;
  autoResizeStandImage: boolean;
};

export type RoomInfo = {
  name: string;
  hasPassword: boolean;
  system: string;
  memberNum: number;
  extend?: RoomInfoExtend; // 一時的措置
};

export type RoomInfoWithPassword = {
  password: string;
  roomInfo: RoomInfo;
};

export type LoginInfo = {
  no: number;
  password: string;
};

export type CreateRoomInfo = {
  no: number;
};
