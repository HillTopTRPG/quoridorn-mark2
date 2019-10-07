const bgmDeclareList: BgmDeclareInfo[] = require("../../../../public/static/conf/bgm.yaml");

export default class BgmManager {
  // シングルトン
  public static get instance(): BgmManager {
    if (!BgmManager._instance) BgmManager._instance = new BgmManager();
    return BgmManager._instance;
  }
  private static _instance: BgmManager;

  // コンストラクタの隠蔽
  private constructor() {
    this._bgmList = bgmDeclareList.map((declareInfo, index) => {
      return {
        key: `bgm-${index}`,
        ...declareInfo
      };
    });
    this.nextKey = bgmDeclareList.length + 1;
  }

  private nextKey: number = 0;
  private readonly _bgmList: BgmInfo[];

  public get bgmList() {
    return this._bgmList;
  }

  public getBgmInfo(key: string): BgmInfo {
    return this.bgmList.filter(info => info.key === key)[0];
  }

  private static getUrl(target: string | BgmDeclareInfo): string | null {
    if (typeof target === "string") {
      if (target.startsWith("bgm-")) {
        const info: BgmInfo = BgmManager.instance.getBgmInfo(target);
        if (!info) return null;
        return info.url;
      } else {
        return target;
      }
    } else {
      return target.url;
    }
  }

  public static isYoutube(target: string | BgmDeclareInfo) {
    const url = BgmManager.getUrl(target);
    if (!url) return false;
    return /www\.youtube\.com/.test(url);
  }

  public static isDropbox(target: string | BgmDeclareInfo) {
    const url = BgmManager.getUrl(target);
    if (!url) return false;
    return /dropbox/.test(url);
  }
}
