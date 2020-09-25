import YoutubeManager, { YoutubeEventHandler } from "./YoutubeManager";
import { StandByReturnInfo } from "task-info";
import { StoreObj } from "@/@types/store";
import TaskManager from "../../../core/task/TaskManager";
import GameObjectManager from "../../GameObjectManager";
import { WindowOpenInfo } from "@/@types/window";
import { CutInDeclareInfo, PlayBgmInfo } from "@/@types/room";
import { findByKey, findRequireByKey } from "@/app/core/utility/Utility";

export default class BgmManager {
  // シングルトン
  public static get instance(): BgmManager {
    if (!BgmManager._instance) BgmManager._instance = new BgmManager();
    return BgmManager._instance;
  }
  private static _instance: BgmManager;
  public standByWindowList: {
    targetKey: string;
    windowKeyList: (string | null)[];
  }[] = [];

  public static async openStandByWindow(targetKey: string) {
    TaskManager.instance
      .ignition<WindowOpenInfo<PlayBgmInfo>, never>({
        type: "window-open",
        owner: "Quoridorn",
        value: {
          type: "play-youtube-window",
          args: {
            targetKey,
            data: null
          }
        }
      })
      .then();
  }

  public notifyOpenedStandByWindow(targetKey: string, windowKey: string) {
    const windowKeyList = this.standByWindowList.find(
      s => s.targetKey === targetKey
    )!.windowKeyList;
    const index = windowKeyList.findIndex(wk => !wk);
    windowKeyList[index] = windowKey;
  }

  public async callBgm(playBgmInfo: PlayBgmInfo) {
    const targetKey = playBgmInfo.targetKey;
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

    console.log(1, !cutInInfo.isForceNew);
    console.log(JSON.stringify(cutInInfo, null, ""));

    // 再生中の画面を閉じる
    if (!cutInInfo.isForceNew) {
      GameObjectManager.instance.playingBgmList
        .filter(b => b.targetKey === targetKey || b.tag === tag)
        .forEach(async b => {
          if (b.targetKey === targetKey && cutInInfo.isForceContinue) {
            matchAndContinue = true;
          } else if (b.targetKey === targetKey || b.tag === tag) {
            TaskManager.instance
              .ignition<string, never>({
                type: "window-close",
                owner: "Quoridorn",
                value: b.windowKey
              })
              .then();
          }
          console.log(
            b.targetKey === targetKey && cutInInfo.isForceContinue,
            b.targetKey === targetKey || b.tag === tag
          );
        });
    }

    if (matchAndContinue) return;

    if (targetKey && cutInInfo.isStandBy) {
      const standByWindowInfo = this.standByWindowList.find(
        sbw => sbw.targetKey === targetKey
      )!;
      const windowKeyList = standByWindowInfo.windowKeyList;
      let intervalKey: number | null;

      const func = (): boolean => {
        const index = windowKeyList.findIndex(wk => wk);
        if (index >= 0) {
          if (intervalKey) clearInterval(intervalKey);
          const windowKey = windowKeyList[index]!;
          windowKeyList[index] = null;
          TaskManager.instance
            .ignition<StandByReturnInfo, never>({
              type: "stand-by-return",
              owner: "Quoridorn",
              value: { windowKey }
            })
            .then();
          setTimeout(() => {
            BgmManager.openStandByWindow(targetKey).then();
          });
          return true;
        }
        return false;
      };
      if (!func()) intervalKey = window.setInterval(func, 10);
    } else {
      console.log(JSON.stringify(cutInInfo));
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
    targetKey: string | null,
    cutInInfo: CutInDeclareInfo,
    windowKey: string,
    windowStatus: string,
    playElmKey: string,
    playerHandler: YoutubeEventHandler
  ) {
    if (!cutInInfo) return;

    if (cutInInfo.fadeIn < 2) playerHandler.setVolume(cutInInfo.volume);

    if (windowStatus === "window") {
      if (BgmManager.isYoutube(cutInInfo)) {
        YoutubeManager.instance.open(playElmKey, cutInInfo, playerHandler);
      }
      if (!cutInInfo.isStandBy) {
        GameObjectManager.instance.playingBgmList.push({
          targetKey,
          tag: cutInInfo.tag,
          windowKey
        });
      }
    } else {
      if (BgmManager.isYoutube(cutInInfo)) {
        YoutubeManager.instance.addEventHandler(playElmKey, playerHandler);
        playerHandler.setVolume(YoutubeManager.instance.getVolume(playElmKey));
        playerHandler.setIsMute(YoutubeManager.instance.isMuted(playElmKey));
      }
    }
  }

  public static closeBgm(playBgmInfo: PlayBgmInfo) {
    const targetKey = playBgmInfo.targetKey;
    const cutInInfo = BgmManager.getCutInInfo(playBgmInfo);
    const tag = cutInInfo.tag;
    const playingBgmList = GameObjectManager.instance.playingBgmList;
    const index = playingBgmList.findIndex(
      b => b.targetKey === targetKey && b.tag === tag
    );
    playingBgmList.splice(index, 1);
  }

  private static getCutInInfo(playBgmInfo: PlayBgmInfo): CutInDeclareInfo {
    if (playBgmInfo.data) return playBgmInfo.data;
    const cutInList = GameObjectManager.instance.cutInList;
    return findRequireByKey(cutInList, playBgmInfo.targetKey).data!;
  }

  private static getInfo(id: string | null) {
    return findByKey(GameObjectManager.instance.cutInList, id);
  }

  private static getUrl(target: string | CutInDeclareInfo): string | null {
    if (typeof target === "string") {
      const info: StoreObj<CutInDeclareInfo> | null = BgmManager.getInfo(
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
