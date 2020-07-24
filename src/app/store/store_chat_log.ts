import Vue from "vue";
import Vuex from "vuex";
import { findRequireByKey } from "../core/utility/Utility";

Vue.use(Vuex);

/**
 * Store
 * @type {Store}
 */
export default new Vuex.Store({
  state: {},
  actions: {
    /**
     * =================================================================================================================
     * 起動時の最初の処理
     * @param dispatch
     * @param commit
     * @param state
     * @param rootState
     * @param rootGetters
     */
    onMount({ dispatch, commit, state, rootState, rootGetters }) {
      // state_settingの初期化
      commit("init_state_setting");

      const decode = (text: string) => {
        const txt = document.createElement("textarea");
        txt.innerHTML = text;
        return txt.value;
      };
      const replaceFunc = (text: string) =>
        decode(text).replace(/\n/g, "<br />");

      const getDecodeStr = (target: string): any[] => {
        const planeStr = decode((window as any)![target]);
        return JSON.parse(planeStr).map((str: string) =>
          JSON.parse(replaceFunc(rootGetters.decrypt({ cipherText: str })))
        );
      };

      const chatLogs: any[] = getDecodeStr("chatLogs");
      const chatTabList: any[] = getDecodeStr("chatTabList");
      const groupTargetTabList: any[] = getDecodeStr("groupTargetTabList");
      const actors: any[] = getDecodeStr("actors");
      commit("setChatLogs", chatLogs);
      commit("setChatTabs", chatTabList);
      commit("setGroupTargetTabList", groupTargetTabList);
      commit("initPlayer", actors);
      commit("initCharacter", actors);
    }
  },
  mutations: {},
  getters: {
    getObj: (state: any, getters: any, rootState: any, rootGetters: any) => (
      key: string
    ): any => {
      if (!key) return null;
      const kind = key.split("-")[0];
      if (kind === "groupTargetTab") {
        // グループチャットタブ
        return findRequireByKey(rootGetters.groupTargetTabList, key);
      } else if (kind === "chatTab") {
        // チャットタブ
        return findRequireByKey(rootGetters.chatTabList, key);
      } else if (kind === "imgTag") {
        // イメージタグ
        return findRequireByKey(rootGetters.imageTagList, key);
      } else if (kind === "player") {
        // プレイヤー
        return findRequireByKey(rootGetters.playerList, key);
      } else if (kind === "character") {
        // キャラクター
        return findRequireByKey(rootGetters.characterList, key);
      } else {
        // その他
        return null;
      }
    },
    getViewName: (state: any, getters: any) => (key: string): string => {
      const obj = getters.getObj(key);
      if (!obj) {
        if (key.split("-")[0] === "chatTab") return "削除済";
        return key;
      }
      const kind = obj.key.split("-")[0];
      if (kind === "player") {
        return `${obj.name}(${obj.type})`;
      } else {
        return obj.name;
      }
    },
    isModal: () => false
  }
});
