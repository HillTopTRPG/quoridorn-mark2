import Vue from "vue";
import Vuex from "vuex";

import eventQueue from "./EventQueue";
import store_private from "@/app/store/store_private";
import store_volatile from "@/app/store/store_volatile";
import store_public from "@/app/store/store_public";

Vue.use(Vuex);

const store = new Vuex.Store({
  modules: {
    eventQueue,
    volatile: store_volatile,
    private: store_private,
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
    isWindowOpen: () => () => false
  }
});

export default store;
