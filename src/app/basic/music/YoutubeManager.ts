import { Size } from "address";
import { createSize } from "@/app/core/Coordinate";
import { CutInDeclareInfo } from "@/@types/room";

type PlayerInfo = {
  player: any;
  elementId: string;
  eventHandlers: YoutubeEventHandler[];
  timeUpdateTimer: number | null;
  timerReload: number | null;
};

export type YoutubeEventHandler = {
  onReady: () => void;
  timeUpdate: (time: number) => void;
  onPlaying: (duration: number, event: any) => void;
  onEnded: () => void;
  onError: (error: any) => void;
  onPaused: () => void;
  onReject: () => void;
  setVolume: (volume: number) => void;
  setIsMute: (isMute: boolean) => void;
};

/**
 * 複数のYoutubeを再生するための特製のクラス！
 */
export default class YoutubeManager {
  public static playerElementSize: Size = createSize(640, 360);

  // シングルトン
  public static get instance(): YoutubeManager {
    if (!YoutubeManager._instance)
      YoutubeManager._instance = new YoutubeManager();
    return YoutubeManager._instance;
  }
  private static _instance: YoutubeManager;

  public static init() {
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/player_api";
    const firstScript: HTMLScriptElement = document.getElementsByTagName(
      "script"
    )[0] as HTMLScriptElement;
    firstScript.parentNode!.insertBefore(script, firstScript);
    if (!YoutubeManager._instance)
      YoutubeManager._instance = new YoutubeManager();
  }

  // コンストラクタの隠蔽
  private constructor() {}

  private playerMapping: {
    [key: string]: PlayerInfo;
  } = {};

  public getPlayerInfo(key: string) {
    return this.playerMapping[key];
  }

  private static getUrlParam(name: string, url: string) {
    name = name.replace(/[[\]]/g, "\\$&");
    const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
    let results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  public open(
    elementId: string,
    { url, start, end }: CutInDeclareInfo,
    eventHandler: YoutubeEventHandler
  ) {
    let playerObj = this.playerMapping[elementId];
    if (playerObj && playerObj.elementId === elementId) {
      // 全く同じプレイヤー要素
    } else {
      // プレイヤー要素の切替の場合は以前のプレイヤーを破棄する
      if (playerObj) {
        window.console.log("destroy player", elementId);
        this.destroyed(elementId);
      }
      const videoId = YoutubeManager.getUrlParam("v", url);

      // 新規プレイヤー作成
      const player = new YT.Player(elementId, {
        width: YoutubeManager.playerElementSize.width,
        height: YoutubeManager.playerElementSize.height,
        videoId,
        events: {
          onReady: () => this.eventHandler.onReady(elementId),
          onStateChange: (event: any) => {
            switch (event.data) {
              case YT.PlayerState.ENDED:
                this.eventHandler.onEnded(elementId);
                break;
              case YT.PlayerState.PLAYING:
                this.eventHandler.onPlaying(elementId, event);
                break;
              case YT.PlayerState.PAUSED:
                this.eventHandler.onPaused(elementId);
                break;
              // case YT.PlayerState.BUFFERING:
              //   this.eventHandler.onBuffering(elementId);
              //   break;
              // case YT.PlayerState.CUED:
              //   this.eventHandler.onCued(elementId);
              //   break;
              default:
            }
          },
          onError: (event: any) => {
            this.eventHandler.onError(elementId, event);
          }
          // onPlaybackQualityChange: (suggestedQuality: string) => {
          //   this.eventHandler.onPlaybackQualityChange(elementId, suggestedQuality);
          // },
          // onPlaybackRateChange: (event: any) => {
          //   this.eventHandler.onPlaybackRateChange(elementId, event);
          // },
          // onApiChange: (event: any) => {
          //   this.eventHandler.onApiChange(elementId);
          // }
        },
        playerVars: {
          origin: location.protocol + "//" + location.hostname + ":8080/",
          playlist: videoId,
          autoplay: 0, // 0:自動再生しない or 1:自動再生
          controls: 0, // 再生ボタンとか出さない
          disablekb: 1, // ショートカットキー無効
          enablejsapi: 1, // JavaScript API 有効
          playsinline: 1,
          fs: 0,
          list: "search", // 検索クエリ使用
          listType: "search", // 検索クエリ使用
          loop: 0, // 0:ループしない or 1:ループする 後で再設定する
          rel: 0, // 関連動画出さない
          start,
          end,
          modestbranding: 1,
          showinfo: 0 // 動画名とか出さない
        }
      });

      playerObj = {
        player,
        elementId,
        eventHandlers: [eventHandler],
        timeUpdateTimer: null,
        timerReload: null
      };
      this.playerMapping[elementId] = playerObj;

      // 既にタイマーが張られていたら停止する
      if (playerObj.timerReload !== null) {
        clearTimeout(playerObj.timerReload);
      }

      // 1500ミリ秒経っても再生できてなければRejectする
      // （通常に読み込めるときの時間は900msくらい）
      playerObj.timerReload = window.setTimeout(() => {
        this.playerMapping[elementId].eventHandlers.forEach(eh => {
          eh.onReject();
        });
      }, 1500);
    }
  }

  public addEventHandler(elementId: string, eventHandler: YoutubeEventHandler) {
    this.playerMapping[elementId].eventHandlers.push(eventHandler);
  }

  public destroyed(elementId: string) {
    let playerObj = this.playerMapping[elementId];
    if (!playerObj) return;

    // 既にタイマーが張られていたら停止する
    if (playerObj.timerReload !== null) {
      clearTimeout(playerObj.timerReload);
      playerObj.timerReload = null;
    }
    if (playerObj.timeUpdateTimer !== null) {
      clearInterval(playerObj.timeUpdateTimer);
      playerObj.timeUpdateTimer = null;
    }

    delete this.playerMapping[elementId];
  }

  /**
   * ===================================================================================================================
   * サポートするYoutubeメソッド
   */
  private doPlayerMethod(methodName: string, ...args: any[]) {
    const yPlayer = this.playerMapping[args.shift()];
    if (!yPlayer) return;
    // window.console.log('doPlayerMethod', methodName, ...args)
    let result = null;
    try {
      result = yPlayer.player[methodName](...args);
    } catch (error) {
      /* Nothing */
    }
    return result;
  }

  /** IDを指定して読み込ませる */
  public loadVideoById(
    elementId: string,
    { url, start, end }: CutInDeclareInfo,
    suggestedQuality: string = "small"
  ) {
    let playerObj = this.playerMapping[elementId];
    if (!playerObj) return;

    const videoId = YoutubeManager.getUrlParam("v", url);
    this.playerMapping[elementId].player.loadVideoById({
      videoId,
      startSeconds: start,
      endSeconds: end,
      suggestedQuality
    });

    // 既にタイマーが張られていたら停止する
    if (playerObj.timerReload !== null) {
      clearTimeout(playerObj.timerReload);
    }

    // 1500ミリ秒経っても再生できてなければRejectする
    // （通常に読み込めるときの時間は900msくらい）
    playerObj.timerReload = window.setTimeout(() => {
      this.playerMapping[elementId].eventHandlers.forEach(eh => {
        eh.onReject();
      });
    }, 1500);
  }

  /** 再生する */
  public play(elementId: string) {
    this.doPlayerMethod("playVideo", elementId);
  }

  /** 一時停止する */
  public pause(elementId: string) {
    this.doPlayerMethod("pauseVideo", elementId);
  }

  /** 再生経過時間の設定 */
  public seekTo(elementId: string, seconds: number, allowSeekAhead: boolean) {
    this.doPlayerMethod("seekTo", elementId, seconds, allowSeekAhead);
  }

  /** ミュート設定 */
  public mute(elementId: string) {
    this.doPlayerMethod("mute", elementId);
  }

  /** ミュート解除 */
  public unMute(elementId: string) {
    this.doPlayerMethod("unMute", elementId);
  }

  /** ミュート状態の取得 */
  public isMuted(elementId: string): boolean {
    return this.doPlayerMethod("isMuted", elementId);
  }

  /** 音量設定 */
  public setVolume(elementId: string, volume: number) {
    this.doPlayerMethod("setVolume", elementId, volume);
  }

  /** 音量取得 */
  public getVolume(elementId: string): number {
    return this.doPlayerMethod("getVolume", elementId);
  }

  /** ループ状態の設定 */
  public setLoop(elementId: string) {
    this.doPlayerMethod("setLoop", elementId);
  }

  /** プレーヤーがバッファ済みの動画の割合を 0～1 の数値で取得 */
  public getVideoLoadedFraction(elementId: string) {
    this.doPlayerMethod("getVideoLoadedFraction", elementId);
  }

  /**
   * プレーヤーの状態の取得
   * YT.PlayerState.ENDED
   * YT.PlayerState.PLAYING
   * YT.PlayerState.PAUSED
   * YT.PlayerState.BUFFERING
   * YT.PlayerState.CUED
   */
  public getPlayerState(elementId: string) {
    this.doPlayerMethod("getPlayerState", elementId);
  }

  /** 動画の再生を開始してからの経過時間を秒数で取得 */
  public getCurrentTime(elementId: string) {
    this.doPlayerMethod("getCurrentTime", elementId);
  }

  /**
   * 現在の動画の実際の画質を取得
   * small
   * medium
   * large
   * hd720
   * hd1080
   * highres
   */
  public getPlaybackQuality(elementId: string): string {
    return this.doPlayerMethod("getPlaybackQuality", elementId);
  }

  /** 現在の動画の推奨画質を設定 */
  public setPlaybackQuality(elementId: string, suggestedQuality: string): void {
    this.doPlayerMethod("setPlaybackQuality", elementId, suggestedQuality);
  }

  /** 現在の動画で有効な画質のセットを取得 */
  public getAvailableQualityLevels(elementId: string): string {
    return this.doPlayerMethod("getAvailableQualityLevels", elementId);
  }

  /** 再生中の動画の長さを秒数で取得 */
  public getDuration(elementId: string): number {
    return this.doPlayerMethod("getDuration", elementId);
  }

  /** 読み込み済みまたは再生中の動画の YouTube.com URLを取得 */
  public getVideoUrl(elementId: string): string {
    return this.doPlayerMethod("getVideoUrl", elementId);
  }

  /** 埋め込まれた <iframe> に対する DOM ノードを取得 */
  public getIframe(elementId: string): HTMLElement {
    return this.doPlayerMethod("getIframe", elementId);
  }

  /**
   * ===================================================================================================================
   * サポートするYoutubeイベント
   */
  // private callEventHandler = (
  //   elementId: string,
  //   eventName: string,
  //   ...args: any[]
  // ) => {
  //   if (eventName !== "timeUpdate") {
  //     // window.console.log(`--- ${eventName} => ${index}`, ...args)
  //   }
  //
  //   const playerObj = this.playerMapping[elementId];
  //   if (!playerObj) return;
  //
  //   const eventHandler = playerObj.eventHandler[eventName];
  //   if (eventHandler) eventHandler(...args);
  // };

  // type YoutubeEventHandler = {
  //   onReady: () => void;
  //   timeUpdate: (time: number) => void;
  //   onPlaying: (duration: number, event: any) => void;
  //   onError: (error: any) => void;
  //   onPaused: () => void;
  //   onReject: () => void;
  // };

  private eventHandler = {
    onReady: (elementId: string) => {
      this.playerMapping[elementId].eventHandlers.forEach(eh => {
        eh.onReady();
      });
    },
    onEnded: (elementId: string) => {
      this.playerMapping[elementId].eventHandlers.forEach(eh => {
        eh.onEnded();
      });
    },
    onPlaying: (elementId: string, event: any) => {
      try {
        let playerObj = this.playerMapping[elementId];
        if (!playerObj) return;

        // 既にタイマーが張られていたら停止する
        if (playerObj.timeUpdateTimer !== null) {
          clearInterval(playerObj.timeUpdateTimer);
          playerObj.timeUpdateTimer = null;
        }
        if (playerObj.timerReload !== null) {
          clearTimeout(playerObj.timerReload);
          playerObj.timerReload = null;
        }

        // 100ミリ秒毎に現在の再生経過時間を通知する
        playerObj.timeUpdateTimer = window.setInterval(() => {
          this.playerMapping[elementId].eventHandlers.forEach(eh => {
            eh.timeUpdate(event.target!.getCurrentTime());
          });
        }, 100);
      } catch (error) {
        window.console.error(error);
      }
      this.playerMapping[elementId].eventHandlers.forEach(eh => {
        eh.onPlaying(event.target.getDuration(), event.target);
      });
    },
    onPaused: (elementId: string) => {
      let playerObj = this.playerMapping[elementId];
      if (!playerObj) return;

      // 既にタイマーが張られていたら停止する
      if (playerObj.timeUpdateTimer !== null) {
        clearInterval(playerObj.timeUpdateTimer);
        playerObj.timeUpdateTimer = null;
      }
      if (playerObj.timerReload !== null) {
        clearTimeout(playerObj.timerReload);
        playerObj.timerReload = null;
      }

      this.playerMapping[elementId].eventHandlers.forEach(eh => {
        eh.onPaused();
      });
    },
    onError: (elementId: string, event: any) => {
      this.playerMapping[elementId].eventHandlers.forEach(eh => {
        eh.onError(event);
      });
    }
    // onBuffering: (elementId: string) => {
    //   let playerObj = this.playerMapping[elementId];
    //   if (!playerObj) return;
    //
    //   // 既にタイマーが張られていたら停止する
    //   if (playerObj.timeUpdateTimer !== null) {
    //     clearInterval(playerObj.timeUpdateTimer);
    //     playerObj.timeUpdateTimer = null;
    //   }
    //
    //   this.playerMapping[elementId].eventHandler.onBuffering();
    // },
    // onCued: (elementId: string) => {
    //   this.playerMapping[elementId].eventHandler.onCued();
    // },
    // onPlaybackQualityChange: (elementId: string, suggestedQuality: string) => {
    //   this.playerMapping[elementId].eventHandler.onPlaybackQualityChange(
    //     suggestedQuality
    //   );
    // },
    // onPlaybackRateChange: (elementId: string, event: any) => {
    //   this.playerMapping[elementId].eventHandler.onPlaybackRateChange(event);
    // },
    // onApiChange: (elementId: string) => {
    //   this.playerMapping[elementId].eventHandler.onApiChange();
    // }
  };
}
