export interface State extends LocationPoint {
  drag: {
    from: LocationPoint;
    move: LocationPoint;
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
    setMouseLocate: (state: State, value: LocationPoint) => {
      state.x = value.x;
      state.y = value.y;
    }
  },
  getters: {
    mouseLocate: (state: State): LocationPoint => ({ x: state.x, y: state.y })
  }
};
