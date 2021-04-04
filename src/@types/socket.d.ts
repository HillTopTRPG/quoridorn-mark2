import { ChangeType } from "nekostore/lib/DocumentChange";
import { TargetVersion } from "@/app/core/api/Github";
import { MediaStore } from "@/@types/store-data";
import {
  RoomInfoExtend,
  UrlType,
  UserType
} from "@/@types/store-data-optional";

type RoomLoginInfo = {
  roomKey: string;
  roomNo: number;
  roomPassword: string;
};

type UserLoginWindowInput = {
  isSetting: boolean;
  visitable: boolean;
  nameList: string[];
  name: string | null;
};

type UserLoginInput = {
  name: string;
  type?: UserType;
  password: string;
};
type UserLoginRequest = UserLoginInput;

type UserLoginResponse = {
  userKey: string;
  token: string;
};

type TouchRequest = {
  roomNo: number;
};
type ReleaseTouchRequest = TouchRequest;

type DeleteRoomInput = {
  roomPassword: string;
};

type BaseRoomInfo = {
  name: string;
  bcdiceServer: string; // BCDiceサーバー
  bcdiceVersion: string; // BCDiceAPIバージョン
  system: string; // BCDiceSystem
  extend: RoomInfoExtend;
};

type CreateRoomInput = BaseRoomInfo & {
  roomPassword: string;
  roomCreatePassword?: string;
};

type LoginRoomInput = DeleteRoomInput;
type RoomLoginRequest = RoomLoginInfo;
type CreateRoomRequest = RoomLoginInfo &
  BaseRoomInfo & {
    roomCreatePassword?: string;
  };
type DeleteRoomRequest = RoomLoginInfo;

type ClientRoomInfo = BaseRoomInfo & {
  memberNum: number;
  hasPassword: boolean;
  roomNo: number;
};
type Message = {
  title: string;
  descriptions: string[];
  termsOfUse: string;
};
type GetRoomListResponse = {
  roomList: StoreUseData<ClientRoomInfo>[] | null;
  message: Message;
  isNeedRoomCreatePassword: boolean;
};

type LoginWindowInput = GetRoomListResponse & {
  serverTestResult: ServerTestResult;
};

type RoomViewResponse = {
  changeType: ChangeType;
  id: string;
  data: StoreData<ClientRoomInfo> | undefined;
};

type AppServerSettingInput = {
  url: string;
};

type GetVersionResponse = {
  version: string;
  title: string;
  targetClient: TargetVersion;
};

type ServerTestResult = {
  serverVersion: string;
  title: string;
  targetClient: TargetVersion;
  targetServer: TargetVersion;
  usable: boolean;
};

type DefaultServerInfo = ServerTestResult & {
  url: string;
};

type SendDataRequest<T> = {
  targetList: string[];
  dataType: string;
  owner: string;
  data: T | null;
};

type UploadMediaInfo = MediaStore & { key?: string } & (
    | { dataLocation: "direct" }
    | {
        dataLocation: "server";
        blob: Blob;
        arrayBuffer: ArrayBuffer;
      }
  );

type UploadMediaResponse = {
  key: string;
  rawPath: string;
  url: string;
  name: string;
  tag: string;
  urlType: UrlType;
}[];

type UploadMediaRequest = {
  uploadMediaInfoList: UploadMediaInfo[];
  option: Partial<StoreData<any>>;
};

type DeleteFileRequest = {
  urlList: string[];
};
