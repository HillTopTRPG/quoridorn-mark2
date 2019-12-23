import { Matrix } from "@/@types/address";

export type State = {
  grid: Matrix;
};

const state: State = {
  grid: { column: 0, row: 0 }
};

export default {
  state,
  getters: {
    mapGrid: (state: State): Matrix => state.grid
  }
};
