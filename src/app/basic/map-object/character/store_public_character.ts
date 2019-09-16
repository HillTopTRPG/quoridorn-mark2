import { MapObject } from "@/app/basic/map-object/MapObject";
import { StatusInfo } from "@/app/basic/common/Status";

export interface CharacterInfo extends MapObject {
  isHide: boolean;
  url: string;
  fontColorType: string;
  fontColor: string;
  statusList: StatusInfo[];
  property: {
    [P in string]: any;
  };
}

const state: SyncObjList<CharacterInfo> = {
  list: [],
  nextKey: 0
};

export default {
  state,
  actions: {},
  mutations: {},
  getters: {
    characterList: (state: SyncObjList<CharacterInfo>): any[] => state.list
  }
};
