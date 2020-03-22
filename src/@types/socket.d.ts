import { ChangeType } from "nekostore/lib/DocumentChange";
import { StoreObj, StoreUseData } from "@/@types/store";
import { TargetVersion } from "@/app/core/api/Github";

type WindowSetting =
  | "not-use" // 使えなくします
  | "free" // 特に指定はありません
  | "init-view" // 入室時に表示します
  | "always-open"; // 常に開いています。閉じることはできません。

type WindowSettings = {
  chat: WindowSetting;
  resource: WindowSetting;
  initiative: WindowSetting;
  chatPalette: WindowSetting;
  counterRemocon: WindowSetting;
};

/**
 * 部屋の追加情報
 */
export type RoomInfoExtend = {
  visitable: boolean; // 見学許可
  isFitGrid: boolean; // マップオブジェクトをセルに自動調整するか
  isViewDice: boolean; // ダイスを表示するか
  isViewCutIn: boolean; // カットインを表示するか
  isDrawGridId: boolean; // マップ座標を表示するか
  mapRotatable: boolean; // マップを回転させるか
  isDrawGridLine: boolean; // マップ罫線を表示するか
  isShowStandImage: boolean; // 立ち絵を表示するか,
  isShowRotateMarker: boolean; // マップオブジェクトの回転マーカーを表示するか
  windowSettings: WindowSettings;
};

export type PartialRoomInfoExtend = Partial<RoomInfoExtend> & {
  windowSettings?: Partial<WindowSettings>;
};

type BaseRoomInfo = {
  name: string;
  bcdiceServer: string;
  system: string;
  extend: RoomInfoExtend;
};

export type RoomLoginInfo = {
  roomId: string;
  roomNo: number;
  roomPassword: string;
};

export type UserType = "GM" | "PL" | "VISITOR";

export type UserLoginWindowInput = {
  isSetting: boolean;
  visitable: boolean;
  nameList: string[];
  name: string | null;
};

export type UserLoginInput = {
  name: string;
  type?: UserType;
  password: string;
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

export type SendDataRequest<T> = {
  targetList: string[];
  dataType: string;
  owner: string;
  data: T | null;
};

export type UploadFileInfo = {
  name: string;
  src: string | ArrayBuffer | null;
};

export type UploadFileRequest = UploadFileInfo[];
