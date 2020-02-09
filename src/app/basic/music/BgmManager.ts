import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import { StoreUseData } from "@/@types/store";
import { CutInDeclareInfo } from "@/@types/room";

export default class BgmManager {
  // シングルトン
  public static get instance(): BgmManager {
    if (!BgmManager._instance) BgmManager._instance = new BgmManager();
    return BgmManager._instance;
  }
  private static _instance: BgmManager;

  // コンストラクタの隠蔽
  private constructor() {
    this.asyncConstructor().then();
  }

  private async asyncConstructor() {
    this._bgmList = await SocketFacade.instance.cutInDataCC().getList(true);
  }

  private _bgmList: StoreUseData<CutInDeclareInfo>[] = [];

  public get bgmList() {
    return this._bgmList;
  }

  private getInfo(id: string | null) {
    return this._bgmList.filter(info => info.id === id)[0];
  }

  private static getUrl(target: string | CutInDeclareInfo): string | null {
    if (typeof target === "string") {
      const info: StoreUseData<CutInDeclareInfo> = BgmManager.instance.getInfo(
        target
      );
      if (!info) return null;
      return info.data!.url;
    } else {
      return target.url;
    }
  }

  public static isYoutube(target: string | CutInDeclareInfo) {
    const url = BgmManager.getUrl(target);
    if (!url) return false;
    return /www\.youtube\.com/.test(url);
  }

  public static isDropbox(target: string | CutInDeclareInfo) {
    const url = BgmManager.getUrl(target);
    if (!url) return false;
    return /dropbox/.test(url);
  }
}
