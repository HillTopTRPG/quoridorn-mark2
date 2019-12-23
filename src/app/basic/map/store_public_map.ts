export default {
  getters: {
    getMapObjectList: <T>(state: any, getters: any, rootState: any) => ({
      kind,
      place = "",
      playerKey = ""
    }: {
      kind: string;
      place: string;
      playerKey: string;
    }): T[] => {
      const list: any[] = rootState.public[kind].list;
      if (!place && !playerKey) return list;
      return list.filter((target: any) => {
        if (playerKey && target.owner !== playerKey) return false;
        return !(place && target.place !== place);
      });
    }
  }
};
