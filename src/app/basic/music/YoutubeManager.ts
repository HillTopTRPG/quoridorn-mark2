import { Size } from "@/@types/address";
import { createSize } from "@/app/core/Coordinate";

type PlayerInfo = {
  player: any;
  elementId: string;
  eventHandler: YoutubeEventHandler;
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
};

/**
 * 複数のYoutubeを再生するための特製のクラス！
 */
export default class YoutubeManager {
  public static playerElementSize: Size = createSize(640, 360);

  // シングルトン
  public static get instance(): YoutubeManager {
    if (!YoutubeManager._instance) {
      YoutubeManager._instance = new YoutubeManager();

      const script = document.createElement("script");
      script.src = "https://www.youtube.com/player_api";
      const firstScript: HTMLScriptElement = document.getElementsByTagName(
        "script"
      )[0] as HTMLScriptElement;
      firstScript.parentNode!.insertBefore(script, firstScript);
    }
    return YoutubeManager._instance;
  }
  private static _instance: YoutubeManager;

  // コンストラクタの隠蔽
  private constructor() {}

  private playerMapping: {
    [tag: string]: PlayerInfo;
  } = {};

  public getPlayerInfo(tag: string) {
    return this.playerMapping[tag];
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
    { tag, url }: CutInDeclareInfo,
    eventHandler: YoutubeEventHandler
  ) {
    let playerObj = this.playerMapping[tag];
    if (playerObj && playerObj.elementId === elementId) {
      // 全く同じプレイヤー要素
    } else {
      // プレイヤー要素の切替の場合は以前のプレイヤーを破棄する
      if (playerObj) {
        window.console.log("destroy player", elementId);
        this.destroyed(tag);
      }
      const videoId = YoutubeManager.getUrlParam("v", url);

      // 新規プレイヤー作成
      const player = new YT.Player(elementId, {
        width: YoutubeManager.playerElementSize.width,
        height: YoutubeManager.playerElementSize.height,
        videoId,
        events: {
          onReady: () => this.eventHandler.onReady(tag),
          onStateChange: (event: any) => {
            switch (event.data) {
              case YT.PlayerState.ENDED:
                this.eventHandler.onEnded(tag);
                break;
              case YT.PlayerState.PLAYING:
                this.eventHandler.onPlaying(tag, event);
                break;
              case YT.PlayerState.PAUSED:
                this.eventHandler.onPaused(tag);
                break;
              // case YT.PlayerState.BUFFERING:
              //   this.eventHandler.onBuffering(tag);
              //   break;
              // case YT.PlayerState.CUED:
              //   this.eventHandler.onCued(tag);
              //   break;
              default:
            }
          },
          onError: (event: any) => {
            this.eventHandler.onError(tag, event);
          }
          // onPlaybackQualityChange: (suggestedQuality: string) => {
          //   this.eventHandler.onPlaybackQualityChange(tag, suggestedQuality);
          // },
          // onPlaybackRateChange: (event: any) => {
          //   this.eventHandler.onPlaybackRateChange(tag, event);
          // },
          // onApiChange: (event: any) => {
          //   this.eventHandler.onApiChange(tag);
          // }
        },
        playerVars: {
          origin: location.protocol + "//" + location.hostname + "/",
          autoplay: 0, // 0:自動再生しない or 1:自動再生
          controls: 0, // 再生ボタンとか出さない
          disablekb: 1, // ショートカットキー無効
          enablejsapi: 1, // JavaScript API 有効
          list: "search", // 検索クエリ使用
          listType: "search", // 検索クエリ使用
          loop: 1, // 0:ループしない or 1:ループする 後で再設定する
          rel: 0, // 関連動画出さない
          showinfo: 0 // 動画名とか出さない
        }
      });

      playerObj = {
        player,
        elementId,
        eventHandler: eventHandler,
        timeUpdateTimer: null,
        timerReload: null
      };
      this.playerMapping[tag] = playerObj;
    }
  }

  public destroyed(tag: string) {
    let playerObj = this.playerMapping[tag];
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

    delete this.playerMapping[tag];
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
    { tag, url, start, end }: CutInDeclareInfo,
    suggestedQuality: string = "small"
  ) {
    let playerObj = this.playerMapping[tag];
    if (!playerObj) return;

    const videoId = YoutubeManager.getUrlParam("v", url);
    this.playerMapping[tag].player.loadVideoById({
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
      this.playerMapping[tag].eventHandler.onReject();
    }, 1500);
  }

  /** 再生する */
  public play(tag: string) {
    this.doPlayerMethod("playVideo", tag);
  }

  /** 一時停止する */
  public pause(tag: string) {
    this.doPlayerMethod("pauseVideo", tag);
  }

  /** 再生経過時間の設定 */
  public seekTo(tag: string, seconds: number, allowSeekAhead: boolean) {
    this.doPlayerMethod("seekTo", tag, seconds, allowSeekAhead);
  }

  /** ミュート設定 */
  public mute(tag: string) {
    this.doPlayerMethod("mute", tag);
  }

  /** ミュート解除 */
  public unMute(tag: string) {
    this.doPlayerMethod("unMute", tag);
  }

  /** ミュート状態の取得 */
  public isMuted(tag: string) {
    this.doPlayerMethod("isMuted", tag);
  }

  /** 音量設定 */
  public setVolume(tag: string, volume: number) {
    this.doPlayerMethod("setVolume", tag, volume);
  }

  /** 音量取得 */
  public getVolume(tag: string) {
    this.doPlayerMethod("getVolume", tag);
  }

  /** ループ状態の設定 */
  public setLoop(tag: string) {
    this.doPlayerMethod("setLoop", tag);
  }

  /** プレーヤーがバッファ済みの動画の割合を 0～1 の数値で取得 */
  public getVideoLoadedFraction(tag: string) {
    this.doPlayerMethod("getVideoLoadedFraction", tag);
  }

  /**
   * プレーヤーの状態の取得
   * YT.PlayerState.ENDED
   * YT.PlayerState.PLAYING
   * YT.PlayerState.PAUSED
   * YT.PlayerState.BUFFERING
   * YT.PlayerState.CUED
   */
  public getPlayerState(tag: string) {
    this.doPlayerMethod("getPlayerState", tag);
  }

  /** 動画の再生を開始してからの経過時間を秒数で取得 */
  public getCurrentTime(tag: string) {
    this.doPlayerMethod("getCurrentTime", tag);
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
  public getPlaybackQuality(tag: string): string {
    return this.doPlayerMethod("getPlaybackQuality", tag);
  }

  /** 現在の動画の推奨画質を設定 */
  public setPlaybackQuality(tag: string, suggestedQuality: string): void {
    this.doPlayerMethod("setPlaybackQuality", tag, suggestedQuality);
  }

  /** 現在の動画で有効な画質のセットを取得 */
  public getAvailableQualityLevels(tag: string): string {
    return this.doPlayerMethod("getAvailableQualityLevels", tag);
  }

  /** 再生中の動画の長さを秒数で取得 */
  public getDuration(tag: string): number {
    return this.doPlayerMethod("getDuration", tag);
  }

  /** 読み込み済みまたは再生中の動画の YouTube.com URLを取得 */
  public getVideoUrl(tag: string): string {
    return this.doPlayerMethod("getVideoUrl", tag);
  }

  /** 埋め込まれた <iframe> に対する DOM ノードを取得 */
  public getIframe(tag: string): HTMLElement {
    return this.doPlayerMethod("getIframe", tag);
  }

  /**
   * ===================================================================================================================
   * サポートするYoutubeイベント
   */
  // private callEventHandler = (
  //   tag: string,
  //   eventName: string,
  //   ...args: any[]
  // ) => {
  //   if (eventName !== "timeUpdate") {
  //     // window.console.log(`--- ${eventName} => ${index}`, ...args)
  //   }
  //
  //   const playerObj = this.playerMapping[tag];
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
    onReady: (tag: string) => {
      this.playerMapping[tag].eventHandler.onReady();
    },
    onEnded: (tag: string) => {
      this.playerMapping[tag].eventHandler.onEnded();
    },
    onPlaying: (tag: string, event: any) => {
      try {
        let playerObj = this.playerMapping[tag];
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
          this.playerMapping[tag].eventHandler.timeUpdate(
            event.target!.getCurrentTime()
          );
        }, 100);
      } catch (error) {
        window.console.error(error);
      }
      this.playerMapping[tag].eventHandler.onPlaying(
        event.target.getDuration(),
        event.target
      );
    },
    onPaused: (tag: string) => {
      let playerObj = this.playerMapping[tag];
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

      this.playerMapping[tag].eventHandler.onPaused();
    },
    onError: (tag: string, event: any) => {
      this.playerMapping[tag].eventHandler.onError(event);
    }
    // onBuffering: (tag: string) => {
    //   let playerObj = this.playerMapping[tag];
    //   if (!playerObj) return;
    //
    //   // 既にタイマーが張られていたら停止する
    //   if (playerObj.timeUpdateTimer !== null) {
    //     clearInterval(playerObj.timeUpdateTimer);
    //     playerObj.timeUpdateTimer = null;
    //   }
    //
    //   this.playerMapping[tag].eventHandler.onBuffering();
    // },
    // onCued: (tag: string) => {
    //   this.playerMapping[tag].eventHandler.onCued();
    // },
    // onPlaybackQualityChange: (tag: string, suggestedQuality: string) => {
    //   this.playerMapping[tag].eventHandler.onPlaybackQualityChange(
    //     suggestedQuality
    //   );
    // },
    // onPlaybackRateChange: (tag: string, event: any) => {
    //   this.playerMapping[tag].eventHandler.onPlaybackRateChange(event);
    // },
    // onApiChange: (tag: string) => {
    //   this.playerMapping[tag].eventHandler.onApiChange();
    // }
  };
}
