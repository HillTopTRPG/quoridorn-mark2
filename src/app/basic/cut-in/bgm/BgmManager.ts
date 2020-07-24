import YoutubeManager, { YoutubeEventHandler } from "./YoutubeManager";
import { StandByReturnInfo } from "task-info";
import { StoreUseData } from "../../../../@types/store";
import TaskManager from "../../../core/task/TaskManager";
import GameObjectManager from "../../GameObjectManager";
import { WindowOpenInfo } from "../../../../@types/window";
import { CutInDeclareInfo, PlayBgmInfo } from "../../../../@types/room";
import { findById, findRequireById } from "../../../core/utility/Utility";

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
    const windowKeyList = this.standByWindowList.find(
      s => s.targetId === targetId
    )!.windowKeyList;
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

    window.console.log(1, !cutInInfo.isForceNew);
    window.console.log(JSON.stringify(cutInInfo, null, ""));

    // 再生中の画面を閉じる
    if (!cutInInfo.isForceNew) {
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
          window.console.log(
            b.targetId === targetId && cutInInfo.isForceContinue,
            b.targetId === targetId || b.tag === tag
          );
        });
    }

    if (matchAndContinue) return;

    if (targetId && cutInInfo.isStandBy) {
      const standByWindowInfo = this.standByWindowList.find(
        sbw => sbw.targetId === targetId
      )!;
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
      window.console.log(JSON.stringify(cutInInfo));
      TaskManager.instance
        .ignition<WindowOpenInfo<PlayBgmInfo>, never>({
          type: "window-open",
          owner: "Quoridorn",
          value: {
            type: BgmManager.isYoutube(cutInInfo)
              ? "play-youtube-window"
              : "play-bgm-file-window",
            args: playBgmInfo
          }
        })
        .then();
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
    if (!cutInInfo) return;

    if (cutInInfo.fadeIn < 2) playerHandler.setVolume(cutInInfo.volume);

    if (windowStatus === "window") {
      if (BgmManager.isYoutube(cutInInfo)) {
        YoutubeManager.instance.open(playElmId, cutInInfo, playerHandler);
      }
      if (!cutInInfo.isStandBy) {
        GameObjectManager.instance.playingBgmList.push({
          targetId,
          tag: cutInInfo.tag,
          windowKey
        });
      }
    } else {
      if (BgmManager.isYoutube(cutInInfo)) {
        YoutubeManager.instance.addEventHandler(playElmId, playerHandler);
        playerHandler.setVolume(YoutubeManager.instance.getVolume(playElmId));
        playerHandler.setIsMute(YoutubeManager.instance.isMuted(playElmId));
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
    return findRequireById(cutInList, playBgmInfo.targetId).data!;
  }

  private static getInfo(id: string | null) {
    return findById(GameObjectManager.instance.cutInList, id);
  }

  private static getUrl(target: string | CutInDeclareInfo): string | null {
    if (typeof target === "string") {
      const info: StoreUseData<CutInDeclareInfo> | null = BgmManager.getInfo(
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
