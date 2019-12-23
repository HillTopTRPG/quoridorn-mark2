import Vue from "vue";
import Vuex from "vuex";

import store_volatile from "@/app/store/store_volatile";
import store_public from "@/app/store/store_public";

Vue.use(Vuex);

const store = new Vuex.Store({
  modules: {
    volatile: store_volatile,
    public: store_public
  },
  state: {},
  actions: {
    windowOpen: () => {},
    setProperty: () => {},
    doResetWindowLocate: () => {},
    exportStart: () => {},
    addListObj: () => {},
    saveChatLogHtml: () => {},
    reverseProperty: () => {}
  },
  mutations: {},
  getters: {
    roomName: () => "test room",
    peerId: () => "test peer",
    members: () => [],
    isRoomJoined: () => false,
    isWindowOpen: () => () => false,
    getObj: () => "getObjValue"
  }
});

export default store;
