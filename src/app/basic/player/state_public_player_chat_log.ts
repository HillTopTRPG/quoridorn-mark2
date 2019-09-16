export default {
  /** プレイヤー */
  state: {
    list: []
  },
  actions: {},
  mutations: {
    initPlayer(state: any, actorList: any[]) {
      state.list = actorList.filter(
        (actor: any) => actor.key.split("-")[0] === "player"
      );
    }
  },
  getters: {
    playerList: (state: any): any[] => state.list
  }
};
