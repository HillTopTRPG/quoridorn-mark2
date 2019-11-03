import { Matrix, Point } from "@/@types/address";

export type State = {
  isDraggingRight: boolean;
  grid: Matrix;
  mouse: {
    onScreen: Point;
    onTable: Point;
    onCanvas: Point;
  };
};

const state: State = {
  isDraggingRight: false,
  grid: { column: 0, row: 0 },
  mouse: {
    onScreen: { x: 0, y: 0 },
    onTable: { x: 0, y: 0 },
    onCanvas: { x: 0, y: 0 }
  }
};

export default {
  state,
  mutations: {},
  getters: {
    isMapDraggingRight: (state: State): boolean => state.isDraggingRight,
    mouseOnCanvasLocate: (state: State): Point => state.mouse.onCanvas,
    mapGrid: (state: State): Matrix => state.grid
  }
};
