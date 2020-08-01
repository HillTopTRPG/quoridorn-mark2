export default {
  state: {
    chatFormat: {
      lineRegExp: null,
      borderStyleRegExp: null,
      styleRegExp: null,
      targetList: []
    }
  } /* end of state */,

  mutations: {
    init_state_setting: (state: any) => {
      /* ----------------------------------------------------------------------
       * チャット整形に使う正規表現の初期化
       */
      const colorFormat = "#[0-9a-f]+|rgba? *\\([0-9., ]+\\)|[a-z]+";
      const lineStyleFormat = "solid|double|dotted|dashed|wavy";
      state.chatFormat.borderStyleRegExp = new RegExp(lineStyleFormat, "gi");
      const colorAndLineFormat = `(${lineStyleFormat}|${colorFormat})`;
      const styleRegExpList = [
        `(b?c)(?: *{ *)(${colorFormat})(?: *})`,
        `([uo])(?: *{ *)${colorAndLineFormat}(?: *\\| *${colorAndLineFormat})?(?: *})`,
        "(b)",
        "(i)",
        "(lt)",
        "(r)(?: *{ *)([^}]+)(?: *})"
      ];
      const styleRegExpStr = `(?:: *)(?:${styleRegExpList.join("|")})`;
      state.chatFormat.styleRegExp = new RegExp(styleRegExpStr, "gi");

      const regExpStr = `\\[\\[ *style((?: *${styleRegExpStr})*) *]]`;
      // console.log(regExpStr);
      state.chatFormat.lineRegExp = new RegExp(regExpStr, "gi");
    }
  },

  getters: {
    chatLineRegExp: (state: any) => state.chatFormat.lineRegExp,
    borderStyleRegExp: (state: any) => state.chatFormat.borderStyleRegExp,
    chatStyleRegExp: (state: any) => state.chatFormat.styleRegExp
  }
};
