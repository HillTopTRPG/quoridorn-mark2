import { MapObject } from "@/app/basic/map-object/MapObject";

export interface ChitInfo extends MapObject {}

const state: SyncObjList<ChitInfo> = {
  list: [],
  nextKey: 0
};

export default {
  state,
  actions: {},
  mutations: {},
  getters: {
    chitList: (state: SyncObjList<ChitInfo>): any[] => state.list
  }
};
