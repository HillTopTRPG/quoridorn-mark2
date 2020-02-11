import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {},
  actions: {
    windowOpenDeprecated: () => {},
    setPropertyDeprecated: () => {},
    doResetWindowLocateDeprecated: () => {},
    exportStartDeprecated: () => {},
    addListObjDeprecated: () => {},
    saveChatLogHtmlDeprecated: () => {},
    reversePropertyDeprecated: () => {}
  },
  mutations: {},
  getters: {
    isWindowOpenDeprecated: () => () => false,
    getObj: () => "getObjValue" // 数が多すぎて整理を一旦諦めた
  }
});

export default store;
