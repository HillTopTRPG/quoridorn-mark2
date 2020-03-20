import { convertNumberZero } from "@/app/core/utility/PrimaryDataUtility";

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
    const scrollbarElem = document.createElement("div");
    scrollbarElem.setAttribute(
      "style",
      "visibility: hidden; position: absolute; top: 0; left: 0; width: 100vw;"
    );
    document.body.appendChild(scrollbarElem);
    const vw = convertNumberZero(
      window.getComputedStyle(scrollbarElem).width.replace("px", "")
    );
    scrollbarElem.style.width = "100%";
    const pc = convertNumberZero(
      window.getComputedStyle(scrollbarElem).width.replace("px", "")
    );
    document.body.removeChild(scrollbarElem);
    document.documentElement.style.overflow = "hidden";
    return vw - pc;
  }

  public static getCss(name: string, elm?: HTMLElement) {
    const useElm = elm || document.documentElement;
    return window.getComputedStyle(useElm).getPropertyValue(name);
  }
}
