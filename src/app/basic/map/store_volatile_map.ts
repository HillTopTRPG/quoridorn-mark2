import { Matrix } from "address";

export type State = {
  grid: Matrix;
};

const state: State = {
  grid: { column: 0, row: 0 }
};

export default {
  state,
  getters: {
    // マウスカーソル直下のマス情報
    mapGrid: (state: State): Matrix => state.grid
  }
};
