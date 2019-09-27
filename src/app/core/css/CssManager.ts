type CssInfo = {
  property: string;
  value: string;
};

const cssInfoList: CssInfo[] = require("./css.yaml");

export default class CssManager {
  // シングルトン
  public static get instance(): CssManager {
    if (!this._instance) this._instance = new CssManager();
    return this._instance;
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
}
