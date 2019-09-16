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
  mutations: {},
  actions: {}
});

export default store;
