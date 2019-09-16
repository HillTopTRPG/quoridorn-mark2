export type State = {
  angle: number;
  wheel: number;
};

const state: State = {
  angle: 0,
  wheel: 0
};

export default {
  /** マップ */
  state,
  mutations: {
    setMapAngle: (state: State, value: number) => {
      state.angle = value;
    },
    setMapWheel: (state: State, value: number) => {
      state.wheel = value;
    }
  },
  getters: {
    mapAngle: (state: any): number => state.angle,
    mapWheel: (state: any): number => state.wheel
  }
};
