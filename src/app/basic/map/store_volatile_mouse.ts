export interface State extends Point {
  drag: {
    from: Point;
    move: Point;
  };
}

const state: State = {
  x: 0,
  y: 0,
  drag: {
    from: { x: 0, y: 0 },
    move: { x: 0, y: 0 }
  }
};

export default {
  state,
  mutations: {
    setMouseLocate: (state: State, value: Point) => {
      state.x = value.x;
      state.y = value.y;
    }
  },
  getters: {
    mouseLocate: (state: State): Point => ({ x: state.x, y: state.y })
  }
};
