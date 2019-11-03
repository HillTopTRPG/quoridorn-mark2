export type MapInfoInput = {
  imageTag: string;
  imageKey: string;
  isReverse: boolean;
  margin: {
    gridSize: number;
    gridColor: string;
    maskColor: string;
    maskAlpha: number;
    isUseGridColor: boolean;
    isUseImage: boolean;
    borderWidth: number;
  };
  grid: {
    totalColumn: number;
    totalRow: number;
    size: number;
    color: string;
  };
  background: string;
  chatLinkage: number;
  chatLinkageSearch: string;
  updateTime: number;
  owner: string;
};

export type MapInfo = MapInfoInput & {
  key: string;
};

export type State = {
  list: MapInfo[];
  isEditing: boolean;
  nextKey: number;
  current: string;
};

const state: State = {
  list: [
    {
      key: `map-0`,
      imageTag: "imgTag-1",
      imageKey: "image-0",
      isReverse: false,
      margin: {
        gridSize: 5,
        gridColor: "#FFFFFF",
        maskColor: "#145014",
        maskAlpha: 0.1,
        isUseGridColor: true,
        isUseImage: false,
        borderWidth: 10
      },
      grid: { totalColumn: 20, totalRow: 15, size: 50, color: "#000000" },
      background: "#92A8B3",
      chatLinkage: 0,
      chatLinkageSearch: "",
      updateTime: 20010203000000,
      owner: "Quoridorn"
    }
  ],
  isEditing: false,
  nextKey: 1,
  current: "map-0"
};

export default {
  state,
  mutations: {
    setIsMapEditing: (state: State, value: boolean) => {
      state.isEditing = value;
    },
    setMapCurrent: (state: State, value: string) => {
      state.current = value;
    },
    addMap: (state: State, value: MapInfoInput) => {
      const map: MapInfo = value as MapInfo;
      map.key = `map-${state.nextKey++}`;
      state.list.push(map);
    }
  },
  getters: {
    isMapEditing: (state: State): boolean => state.isEditing,
    currentMapKey: (state: State): string => state.current,
    currentMapObj: (state: State): MapInfo =>
      state.list.filter((map: MapInfo) => map.key === state.current)[0],
    getBackgroundImage: (
      state: any,
      getters: any,
      rootState: any,
      rootGetters: any
    ): string | null => {
      const imageObj = rootGetters.imageList.filter(
        (image: any) => image.key === getters.currentMapObj.imageKey
      )[0];
      return imageObj ? imageObj.data : null;
    },
    mapMarginGridColor: (state: State, getters: any): string =>
      getters.currentMapObj.margin.gridColor,
    mapMarginMaskColor: (state: State, getters: any): string =>
      getters.currentMapObj.margin.maskColor,
    mapMarginMaskAlpha: (state: State, getters: any): number =>
      getters.currentMapObj.margin.maskAlpha,
    isMapUseGridColor: (state: State, getters: any): boolean =>
      getters.currentMapObj.margin.isUseGridColor,
    isMapUseImage: (state: State, getters: any): boolean =>
      getters.currentMapObj.margin.isUseImage,
    mapColumns: (state: State, getters: any): number =>
      getters.currentMapObj.grid.totalColumn,
    mapRows: (state: State, getters: any): number =>
      getters.currentMapObj.grid.totalRow,
    mapGridSize: (state: State, getters: any): number =>
      getters.currentMapObj.grid.size,
    mapBorderWidth: (state: State, getters: any): number =>
      getters.currentMapObj.margin.borderWidth,
    mapMarginGridSize: (state: State, getters: any): number =>
      getters.currentMapObj.margin.gridSize,
    mapGridColor: (state: State, getters: any): string =>
      getters.currentMapObj.grid.color,
    isMapReverse: (state: State, getters: any): boolean =>
      getters.currentMapObj.isReverse,
    mapCanvasSize(state: State, getters: any) {
      return {
        w: getters.mapColumns * getters.mapGridSize,
        h: getters.mapRows * getters.mapGridSize
      };
    },
    mapBackgroundColor: (state: State, getters: any) =>
      getters.currentMapObj.background,
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
