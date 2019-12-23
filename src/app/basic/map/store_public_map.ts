export type MapInfo = {
  grid: {
    totalColumn: number;
    totalRow: number;
  };
  key: string;
};

export type State = {
  list: MapInfo[];
  current: string;
};

const state: State = {
  list: [
    {
      key: `map-0`,
      grid: { totalColumn: 20, totalRow: 15 }
    }
  ],
  current: "map-0"
};

export default {
  state,
  getters: {
    currentMapObj: (state: State): MapInfo =>
      state.list.filter((map: MapInfo) => map.key === state.current)[0],
    mapColumns: (state: State, getters: any): number =>
      getters.currentMapObj.grid.totalColumn,
    mapRows: (state: State, getters: any): number =>
      getters.currentMapObj.grid.totalRow,
    getMapObjectList: <T>(state: any, getters: any, rootState: any) => ({
      kind,
      place = "",
      playerKey = ""
    }: {
      kind: string;
      place: string;
      playerKey: string;
    }): T[] => {
      const list: any[] = rootState.public[kind].list;
      if (!place && !playerKey) return list;
      return list.filter((target: any) => {
        if (playerKey && target.owner !== playerKey) return false;
        return !(place && target.place !== place);
      });
    }
  }
};
