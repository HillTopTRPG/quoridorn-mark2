export interface State {
  isModal: boolean;
}

const state: State = {
  isModal: false
};

export default {
  state,
  getters: {
    isModal: (state: State): boolean => state.isModal
  }
};
