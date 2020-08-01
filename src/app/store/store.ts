import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    setting: {
      useReadAloud: false
    }
  },
  actions: {},
  mutations: {
    setUseReadAloud: (state, useReadAloud) => {
      console.log(`store#setUseReadAloud: ${useReadAloud}`);
      state.setting.useReadAloud = useReadAloud;
    }
  },
  getters: {
    useReadAloud: state => state.setting.useReadAloud
  }
});

export default store;
