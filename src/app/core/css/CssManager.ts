import { convertNumberZero } from "../utility/PrimaryDataUtility";

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

  public readonly propMap: { [name: string]: number } = {};

  public setGlobalCss() {
    this.cssInfoList.forEach(info => {
      const elm = document.documentElement;
      if (info.property === "--scroll-bar-width")
        info.value = CssManager.getScrollbarWidth() + "px";
      elm.style.setProperty(info.property, info.value);
    });
  }

  /** スクロールバーの幅 (ピクセル単位) を取得する */
  private static getScrollbarWidth() {
    document.documentElement.style.overflow = "scroll";

    // スクロールバーの幅を取得するための要素を生成する
    const contentElm = document.createElement("div");
    contentElm.style.visibility = "hidden";
    contentElm.style.position = "absolute";
    contentElm.style.top = "0";
    contentElm.style.left = "0";
    document.body.appendChild(contentElm);

    const getWindowWidth = (widthStyle: string): number => {
      contentElm.style.width = widthStyle;
      const elmWidth = window.getComputedStyle(contentElm).width;
      return convertNumberZero(elmWidth.replace("px", ""));
    };
    const vw = getWindowWidth("100vw");
    const pc = getWindowWidth("100%");

    document.body.removeChild(contentElm);
    document.documentElement.style.overflow = "hidden";

    // スクロールバーの有無によって変化するwindowの幅の違いがスクロールバーの幅
    return vw - pc;
  }

  public static getCss(name: string, elm?: HTMLElement) {
    const useElm = elm || document.documentElement;
    return window.getComputedStyle(useElm).getPropertyValue(name);
  }
}
