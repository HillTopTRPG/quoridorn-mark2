const bgmList: BgmInfo[] = require("../../../../public/static/conf/bgm.yaml");

export default class BgmManager {
  // シングルトン
  public static get instance(): BgmManager {
    if (!this._instance) this._instance = new BgmManager();
    return this._instance;
  }
  private static _instance: BgmManager;

  // コンストラクタの隠蔽
  private constructor() {
    this.bgmList = bgmList;
    this.nextKey = bgmList.length + 1;
  }

  private nextKey: number = 0;
  private readonly bgmList: BgmInfo[];
}
