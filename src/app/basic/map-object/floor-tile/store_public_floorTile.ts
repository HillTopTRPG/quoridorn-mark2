import { MapObject } from "@/app/basic/map-object/MapObject";

export interface FloorTileInfo extends MapObject {}

const state: SyncObjList<FloorTileInfo> = {
  list: [],
  nextKey: 0
};

export default {
  state,
  actions: {},
  mutations: {},
  getters: {
    floorTileList: (state: SyncObjList<FloorTileInfo>): any[] => state.list
  }
};
