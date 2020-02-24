import { StoreUseData } from "@/@types/store";
import { CutInDeclareInfo } from "@/@types/room";
import YoutubeManager, {
  YoutubeEventHandler
} from "@/app/basic/music/YoutubeManager";
import GameObjectManager from "@/app/basic/GameObjectManager";
import TaskManager from "@/app/core/task/TaskManager";
import { PlayBgmInfo } from "window-info";
import { WindowOpenInfo } from "@/@types/window";
import { StandByReturnInfo } from "task-info";

export default class BgmManager {
  // シングルトン
  public static get instance(): BgmManager {
    if (!BgmManager._instance) BgmManager._instance = new BgmManager();
    return BgmManager._instance;
  }
  private static _instance: BgmManager;
  public standByWindowList: {
    targetId: string;
    windowKeyList: (string | null)[];
  }[] = [];

  public static async openStandByWindow(targetId: string) {
    TaskManager.instance
      .ignition<WindowOpenInfo<PlayBgmInfo>, never>({
        type: "window-open",
        owner: "Quoridorn",
        value: {
          type: "play-youtube-window",
          args: {
            targetId,
            data: null
          }
        }
      })
      .then();
  }

  public notifyOpenedStandByWindow(targetId: string, windowKey: string) {
    const windowKeyList = this.standByWindowList.filter(
      s => s.targetId === targetId
    )[0].windowKeyList;
    const idx = windowKeyList.findIndex(wk => !wk);
    windowKeyList[idx] = windowKey;
  }

  public async callBgm(playBgmInfo: PlayBgmInfo) {
    const targetId = playBgmInfo.targetId;
    const cutInInfo = BgmManager.getCutInInfo(playBgmInfo);
    const tag = cutInInfo.tag;

    let matchAndContinue = false;

    // URLが空だったら同じタブを全て閉じる
    if (!cutInInfo.url) {
      GameObjectManager.instance.playingBgmList
        .filter(b => b.tag === tag)
        .forEach(async b => {
          TaskManager.instance
            .ignition<string, never>({
              type: "window-close",
              owner: "Quoridorn",
              value: b.windowKey
            })
            .then();
        });
      return;
    }
    if (cutInInfo.isForceNew) {
      // 窓を何個でも開く
    } else {
      GameObjectManager.instance.playingBgmList
        .filter(b => b.targetId === targetId || b.tag === tag)
        .forEach(async b => {
          if (b.targetId === targetId && cutInInfo.isForceContinue) {
            matchAndContinue = true;
          } else if (b.targetId === targetId || b.tag === tag) {
            TaskManager.instance
              .ignition<string, never>({
                type: "window-close",
                owner: "Quoridorn",
                value: b.windowKey
              })
              .then();
          }
        });
    }
    if (!matchAndContinue) {
      if (targetId && cutInInfo.isStandBy) {
        const standByWindowInfo = this.standByWindowList.filter(
          sbw => sbw.targetId === targetId
        )[0];
        const windowKeyList = standByWindowInfo.windowKeyList;
        let intervalId: number | null;

        const func = (): boolean => {
          const idx = windowKeyList.findIndex(wk => wk);
          if (idx >= 0) {
            if (intervalId) clearInterval(intervalId);
            const windowKey = windowKeyList[idx]!;
            windowKeyList[idx] = null;
            TaskManager.instance
              .ignition<StandByReturnInfo, never>({
                type: "stand-by-return",
                owner: "Quoridorn",
                value: { windowKey }
              })
              .then();
            setTimeout(() => {
              BgmManager.openStandByWindow(targetId).then();
            });
            return true;
          }
          return false;
        };
        if (!func()) intervalId = window.setInterval(func, 10);
      } else {
        TaskManager.instance
          .ignition<WindowOpenInfo<PlayBgmInfo>, never>({
            type: "window-open",
            owner: "Quoridorn",
            value: {
              type: "play-youtube-window",
              args: playBgmInfo
            }
          })
          .then();
      }
    }
  }

  public static async playBgm(
    targetId: string | null,
    cutInInfo: CutInDeclareInfo,
    windowKey: string,
    windowStatus: string,
    playElmId: string,
    playerHandler: YoutubeEventHandler
  ) {
    if (cutInInfo) {
      if (cutInInfo.fadeIn < 2) playerHandler.setVolume(cutInInfo.volume);
      const tag = cutInInfo.tag;
      if (windowStatus !== "window") {
        YoutubeManager.instance.addEventHandler(playElmId, playerHandler);
        playerHandler.setVolume(YoutubeManager.instance.getVolume(playElmId));
        playerHandler.setIsMute(YoutubeManager.instance.isMuted(playElmId));
      } else {
        YoutubeManager.instance.open(playElmId, cutInInfo, playerHandler);
        if (!cutInInfo.isStandBy) {
          GameObjectManager.instance.playingBgmList.push({
            targetId,
            tag,
            windowKey
          });
        }
      }
    }
  }

  public static closeBgm(playBgmInfo: PlayBgmInfo) {
    const targetId = playBgmInfo.targetId;
    const cutInInfo = BgmManager.getCutInInfo(playBgmInfo);
    const tag = cutInInfo.tag;
    const playingBgmList = GameObjectManager.instance.playingBgmList;
    const idx = playingBgmList.findIndex(
      b => b.targetId === targetId && b.tag === tag
    );
    playingBgmList.splice(idx, 1);
  }

  private static getCutInInfo(playBgmInfo: PlayBgmInfo): CutInDeclareInfo {
    if (playBgmInfo.data) return playBgmInfo.data;
    const cutInList = GameObjectManager.instance.cutInList;
    const cutInData = cutInList.filter(c => c.id === playBgmInfo.targetId)[0];
    return cutInData!.data!;
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
