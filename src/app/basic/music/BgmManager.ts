import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import { StoreUseData } from "@/@types/store";
import { CutInDeclareInfo } from "@/@types/room";
import YoutubeManager, {
  YoutubeEventHandler
} from "@/app/basic/music/YoutubeManager";
import GameObjectManager from "@/app/basic/GameObjectManager";

export default class BgmManager {
  // シングルトン
  public static get instance(): BgmManager {
    if (!BgmManager._instance) BgmManager._instance = new BgmManager();
    return BgmManager._instance;
  }
  private static _instance: BgmManager;

  // コンストラクタの隠蔽
  private constructor() {}

  public static async playBgm(
    targetId: string,
    windowKey: string,
    windowStatus: string,
    playElmId: string,
    playerHandler: YoutubeEventHandler
  ) {
    const cutInDataCC = SocketFacade.instance.cutInDataCC();
    const cutInData = await cutInDataCC.getData(targetId);
    const cutInInfo = cutInData!.data;

    if (cutInInfo) {
      if (cutInInfo.fadeIn < 2) playerHandler.setVolume(cutInInfo.volume);
      const tag = cutInInfo.tag;
      if (windowStatus !== "window") {
        YoutubeManager.instance.addEventHandler(tag, playerHandler);
        playerHandler.setVolume(YoutubeManager.instance.getVolume(tag));
        playerHandler.setIsMute(YoutubeManager.instance.isMuted(tag));
      } else {
        YoutubeManager.instance.open(playElmId, cutInInfo, playerHandler);
        GameObjectManager.instance.playingBgmList.push({
          targetId,
          tag,
          windowKey
        });
      }
    }
    return cutInInfo;
  }

  public static closeBgm(targetId: string) {
    const playingBgmList = GameObjectManager.instance.playingBgmList;
    const idx = playingBgmList.findIndex(b => b.targetId === targetId);
    playingBgmList.splice(idx, 1);
  }

  public static async getTargetTag(targetId: string) {
    const cutInDataCC = SocketFacade.instance.cutInDataCC();
    const cutInData = await cutInDataCC.getData(targetId);
    const cutInInfo = cutInData!.data;
    return cutInInfo ? cutInInfo.tag : null;
  }

  private getInfo(id: string | null) {
    return GameObjectManager.instance.cutInList.filter(
      info => info.id === id
    )[0];
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
