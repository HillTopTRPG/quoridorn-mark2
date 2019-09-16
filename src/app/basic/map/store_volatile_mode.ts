export interface State {
  isModal: boolean;
  isLoading: number;
  isWait: boolean;
}

const state: State = {
  isModal: false,
  isLoading: 0,
  isWait: false
};

export default {
  state,
  mutations: {
    setIsModal: (state: State, value: boolean) => {
      state.isModal = value;
    },
    setIsLoading: (state: State, value: number) => {
      state.isLoading = value;
    },
    setIsWait: (state: State, value: boolean) => {
      state.isWait = value;
    }
  },
  getters: {
    isModal: (state: State): boolean => state.isModal,
    isLoading: (state: State): number => state.isLoading,
    isWait: (state: State): boolean => state.isWait
  }
};
