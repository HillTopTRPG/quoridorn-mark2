import { MapObject } from "@/app/basic/map-object/MapObject";

export interface MapMaskInfo extends MapObject {
  color: string;
  fontColor: string;
}

const state: SyncObjList<MapMaskInfo> = {
  list: [],
  nextKey: 0
};

export default {
  state,
  actions: {},
  mutations: {},
  getters: {
    mapMaskList: (state: SyncObjList<MapMaskInfo>): any[] => state.list
  }
};
