export default {
  /** キャラクター */
  state: {
    list: []
  },
  actions: {},
  mutations: {
    initCharacter(state: any, actorList: any[]) {
      state.list = actorList.filter(
        (actor: any) => actor.key.split("-")[0] === "character"
      );
    }
  },
  getters: {
    characterList: (state: any): any[] => state.list
  }
};
