import Vue from "vue";
import Vuex from "vuex";
import statePublic from "@/app/store/store_public_chat_log";
import stateSetting from "@/app/store/store_setting";

Vue.use(Vuex);

/**
 * Store
 * @type {Store}
 */
export default new Vuex.Store({
  modules: {
    setting: stateSetting,
    public: statePublic
  },
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
      const filterFunc: Function = (obj: any) => obj.key === key;
      if (kind === "groupTargetTab") {
        // グループチャットタブ
        return rootGetters.groupTargetTabList.filter(filterFunc)[0];
      } else if (kind === "chatTab") {
        // チャットタブ
        return rootGetters.chatTabList.filter(filterFunc)[0];
      } else if (kind === "imgTag") {
        // イメージタグ
        return rootGetters.imageTagList.filter(filterFunc)[0];
      } else if (kind === "player") {
        // プレイヤー
        return rootGetters.playerList.filter(filterFunc)[0];
      } else if (kind === "character") {
        // キャラクター
        return rootGetters.characterList.filter(filterFunc)[0];
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
