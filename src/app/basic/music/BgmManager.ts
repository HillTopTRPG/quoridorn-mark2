const bgmDeclareList: BgmDeclareInfo[] = require("../../../../public/static/conf/bgm.yaml");

export default class BgmManager {
  // シングルトン
  public static get instance(): BgmManager {
    if (!this._instance) this._instance = new BgmManager();
    return this._instance;
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
}
