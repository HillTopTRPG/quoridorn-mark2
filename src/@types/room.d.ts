import { CutInStore, LikeStore, SceneStore } from "@/@types/store-data";
import { DiceMaterial, RoomInfoExtend } from "@/@types/store-data-optional";

type PlayBgmInfo =
  | {
      targetKey: string;
      data: null;
    }
  | {
      targetKey: null;
      data: CutInStore;
    };

type MediaUploadInfo = {
  resultList: (File | string)[];
};

type YoutubeVolumeChangeInfo = {
  tag: string;
  windowStatus: string;
  volume: number;
};

type YoutubeMuteChangeInfo = {
  tag: string;
  windowStatus: string;
  isMute: boolean;
};

type OriginalTableStore = {
  commandName: string;
  diceRoll: string;
  tableTitle: string;
  tableContents: {
    [key in string]: string;
  };
  bcdiceServer: string | null;
  bcdiceVersion: string | null;
  system: string; // yamlファイルには未記載。プログラムで設定する変数。
};

type AddRoomPresetDataRequest = {
  roomName: string;
  bcdiceServer: string; // BCDiceサーバー
  bcdiceVersion: string; // BCDiceAPIバージョン
  system: string; // BCDiceSystem
  roomExtendInfo: RoomInfoExtend;
  sceneData: SceneStore;
  cutInDataList: CutInStore[];
  diceMaterial: DiceMaterial;
  likeList: LikeStore[];
  originalTableList: OriginalTableStore[];
  language: {
    mainChatTabName: string;
    allGroupChatTabName: string;
    nameLabel: string;
  };
};
