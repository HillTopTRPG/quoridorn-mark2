import { ChangeType } from "nekostore/lib/DocumentChange";
import { StoreObj, StoreUseData } from "@/@types/store";
import { TargetVersion } from "@/app/core/api/Github";

/**
 * マップのデフォルト形状
 */
type MapShape = "square" | "horizontal-hex" | "vertical-hex";

/**
 * 部屋の追加情報
 */
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

type BaseRoomInfo = {
  name: string;
  system: string;
  extend?: RoomInfoExtend; // 一時的措置
};

export type RoomLoginInfo = {
  roomId: string;
  roomNo: number;
  roomPassword: string;
};

export type UserType = "GM" | "PL" | "VISITOR";

export type UserLoginWindowInput = {
  isSetting: boolean;
  userNameList: string[];
  userName: string | null;
};

export type UserLoginInput = {
  userName: string;
  userType?: UserType;
  userPassword: string;
};
export type UserLoginRequest = UserLoginInput;

export type UserLoginResponse = {
  userId: string;
  token: string;
};

export type TouchRequest = {
  roomNo: number;
};
export type ReleaseTouchRequest = TouchRequest;

export type CreateRoomInput = BaseRoomInfo & {
  roomPassword: string;
};
export type DeleteRoomInput = {
  roomPassword: string;
};
export type LoginRoomInput = DeleteRoomInput;
export type RoomLoginRequest = RoomLoginInfo;
export type CreateRoomRequest = RoomLoginInfo & BaseRoomInfo;
export type DeleteRoomRequest = RoomLoginInfo;

export type ClientRoomInfo = BaseRoomInfo & {
  memberNum: number;
  hasPassword: boolean;
  roomNo: number;
};
export type Message = {
  title: string;
  descriptions: string[];
  termsOfUse: string;
};
export type GetRoomListResponse = {
  roomList: StoreUseData<ClientRoomInfo>[] | null;
  message: Message;
};

export type LoginWindowInput = GetRoomListResponse & {
  serverTestResult: ServerTestResult;
};

export type RoomViewResponse = {
  changeType: ChangeType;
  id: string;
  data?: StoreObj<ClientRoomInfo>;
};

export type LoginResponse = ClientRoomInfo & {
  roomCollectionPrefix: string;
};

export type AppServerSettingInput = {
  url: string;
};

export type GetVersionResponse = {
  version: string;
  title: string;
  targetClient: TargetVersion;
};

export type ServerTestResult = {
  serverVersion: string;
  title: string;
  targetClient: TargetVersion;
  targetServer: TargetVersion;
  usable: boolean;
};

export type DefaultServerInfo = ServerTestResult & {
  url: string;
};

export type VersionWindowInfo = {
  message: Message;
  version: string;
};
