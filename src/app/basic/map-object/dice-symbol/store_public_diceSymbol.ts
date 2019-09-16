import { MapObject } from "@/app/basic/map-object/MapObject";

export interface DiceSymbolInfo extends MapObject {
  faceNum: number;
  type: string;
  label: string;
  pips: number;
  isHide: boolean;
}

const state: SyncObjList<DiceSymbolInfo> = {
  list: [],
  nextKey: 0
};

export default {
  state,
  actions: {},
  mutations: {},
  getters: {
    diceSymbolList: (state: SyncObjList<DiceSymbolInfo>): any[] => state.list
  }
};
