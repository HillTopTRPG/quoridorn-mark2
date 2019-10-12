type CssInfo = {
  property: string;
  value: string;
  customizable: boolean;
};

const cssInfoList: CssInfo[] = require("./css.yaml");

export default class CssManager {
  // シングルトン
  public static get instance(): CssManager {
    if (!CssManager._instance) CssManager._instance = new CssManager();
    return CssManager._instance;
  }
  private static _instance: CssManager;

  // コンストラクタの隠蔽
  private constructor() {}

  private readonly cssInfoList = cssInfoList;

  public setGlobalCss() {
    this.cssInfoList.forEach(info => {
      const elm = document.documentElement;
      elm.style.setProperty(info.property, info.value);
    });
  }

  public static getCss(name: string) {
    const elm = document.documentElement;
    return window.getComputedStyle(elm).getPropertyValue(name);
  }
}
