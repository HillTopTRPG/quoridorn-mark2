type PlayerInfo = {
  player: any;
  index: number;
  using: boolean;
  eventHandler: {
    [eventName: string]: Function;
  };
  timeUpdateTimer: number | null;
  timerReload: number | null;
};

/**
 * 複数のYoutubeを再生するための特製のクラス！
 */
export default class YoutubeManager {
  // シングルトン
  public static get instance(): YoutubeManager {
    if (!YoutubeManager._instance) {
      const instance = new YoutubeManager();
      YoutubeManager._instance = instance;
      (window as any).onYouTubeIframeAPIReady = instance.init.bind(instance);

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

  private playerArr: any[] = [];
  private playerMapping: {
    [tag: string]: PlayerInfo;
  } = {};

  public registration(
    tag: string,
    url: string,
    startSeconds: number,
    endSeconds: number,
    eventHandler: { [eventName: string]: Function }
  ) {
    let playerObj = this.playerMapping[tag];
    if (!playerObj) {
      // 空いてる番号を取得する
      const indexArr = [];
      for (const _tag in this.playerMapping) {
        if (!this.playerMapping.hasOwnProperty(_tag)) continue;
        indexArr.push(this.playerMapping[_tag].index);
      }
      indexArr.sort((a, b) => {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
      });
      let useIndex = 0;
      for (const i of indexArr) {
        if (useIndex !== i) break;
        useIndex++;
      }

      const usePlayer = this.playerArr[useIndex];
      if (!usePlayer) {
        alert(
          "アクティブなYoutube再生の上限を超えました。\nこの操作をキャンセルします。"
        );
        return false;
      }
      playerObj = {
        player: usePlayer,
        index: useIndex,
        using: true,
        eventHandler: eventHandler,
        timeUpdateTimer: null,
        timerReload: null
      };
      this.playerMapping[tag] = playerObj;
    } else {
      playerObj.using = true;
      playerObj.eventHandler = eventHandler;
    }

    playerObj.player.a.parentNode.classList.remove("unUse");

    const getUrlParam = (name: string, url: string) => {
      name = name.replace(/[[\]]/g, "\\$&");
      const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
      let results = regex.exec(url);
      if (!results) return null;
      if (!results[2]) return "";
      return decodeURIComponent(results[2].replace(/\+/g, " "));
    };
    const videoId = getUrlParam("v", url);
    this.loadVideoById(tag, videoId!, startSeconds, endSeconds, "small");

    return true;
  }

  private destroyed(tag: string) {
    let playerObj = this.playerMapping[tag];
    if (!playerObj) return;

    // 既にタイマーが張られていたら停止する
    if (playerObj.timerReload) clearTimeout(playerObj.timerReload);

    playerObj.player.a.parentNode.classList.add("unUse");
    playerObj.using = false;
    playerObj.eventHandler = {};
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
  private loadVideoById(
    tag: string,
    videoId: string,
    startSeconds: number,
    endSeconds: number,
    suggestedQuality: string
  ) {
    this.doPlayerMethod(
      "loadVideoById",
      tag,
      videoId,
      startSeconds,
      endSeconds,
      suggestedQuality
    );

    let playerObj = this.playerMapping[tag];
    if (!playerObj) return;

    // 既にタイマーが張られていたら停止する
    if (playerObj.timerReload) clearTimeout(playerObj.timerReload);

    // 1500ミリ秒経っても再生できてなければRejectする
    // （通常に読み込めるときの時間は900msくらい）
    playerObj.timerReload = setTimeout(() => {
      this.callEventHandlerTag(tag, "onReject");
    }, 1500);
  }

  /** 再生する */
  private play(tag: string) {
    this.doPlayerMethod("playVideo", tag);
  }

  /** 一時停止する */
  private pause(tag: string) {
    this.doPlayerMethod("pauseVideo", tag);
  }

  /** 再生経過時間の設定 */
  private seekTo(tag: string, seconds: number, allowSeekAhead: boolean) {
    this.doPlayerMethod("seekTo", tag, seconds, allowSeekAhead);
  }

  /** ミュート設定 */
  private mute(tag: string) {
    this.doPlayerMethod("mute", tag);
  }

  /** ミュート解除 */
  private unMute(tag: string) {
    this.doPlayerMethod("unMute", tag);
  }

  /** ミュート状態の取得 */
  private isMuted(tag: string) {
    this.doPlayerMethod("isMuted", tag);
  }

  /** 音量設定 */
  private setVolume(tag: string, volume: number) {
    this.doPlayerMethod("setVolume", tag, volume);
  }

  /** 音量取得 */
  private getVolume(tag: string) {
    this.doPlayerMethod("getVolume", tag);
  }

  /** ループ状態の設定 */
  private setLoop(tag: string) {
    this.doPlayerMethod("setLoop", tag);
  }

  /** プレーヤーがバッファ済みの動画の割合を 0～1 の数値で取得 */
  private getVideoLoadedFraction(tag: string) {
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
  private getPlayerState(tag: string) {
    this.doPlayerMethod("getPlayerState", tag);
  }

  /** 動画の再生を開始してからの経過時間を秒数で取得 */
  private getCurrentTime(tag: string) {
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
  private getPlaybackQuality(tag: string) {
    this.doPlayerMethod("getPlaybackQuality", tag);
  }

  /** 現在の動画の推奨画質を設定 */
  private setPlaybackQuality(tag: string) {
    this.doPlayerMethod("setPlaybackQuality", tag);
  }

  /** 現在の動画で有効な画質のセットを取得 */
  private getAvailableQualityLevels(tag: string) {
    this.doPlayerMethod("getAvailableQualityLevels", tag);
  }

  /** 再生中の動画の長さを秒数で取得 */
  private getDuration(tag: string) {
    this.doPlayerMethod("getDuration", tag);
  }

  /** 読み込み済みまたは再生中の動画の YouTube.com URLを取得 */
  private getVideoUrl(tag: string) {
    this.doPlayerMethod("getVideoUrl", tag);
  }

  /** 埋め込まれた <iframe> に対する DOM ノードを取得 */
  private getIframe(tag: string) {
    this.doPlayerMethod("getIframe", tag);
  }

  /**
   * ===================================================================================================================
   * サポートするYoutubeイベント
   */
  private getPlayerObj = (index: number) => {
    let playerObj = null;
    for (const tag in this.playerMapping) {
      if (!this.playerMapping.hasOwnProperty(tag)) continue;
      if (this.playerMapping[tag].player === this.playerArr[index]) {
        playerObj = this.playerMapping[tag];
        break;
      }
    }
    return playerObj;
  };

  private callEventHandler = (
    index: number,
    eventName: string,
    ...args: any[]
  ) => {
    if (eventName !== "timeUpdate") {
      // window.console.log(`--- ${eventName} => ${index}`, ...args)
    }

    const playerObj = this.getPlayerObj(index);
    if (!playerObj) return;

    const eventHandler = playerObj.eventHandler[eventName];
    if (eventHandler) eventHandler(...args);
  };

  private callEventHandlerTag = (
    tag: string,
    eventName: string,
    ...args: any[]
  ) => {
    if (eventName !== "timeUpdate") {
      // window.console.log(`--- ${eventName} => ${index}`, ...args)
    }

    const playerObj = this.playerMapping[tag];
    if (!playerObj) return;

    const eventHandler = playerObj.eventHandler[eventName];
    if (eventHandler) eventHandler(...args);
  };

  private eventHandler = {
    onReady: (index: number) => {
      this.callEventHandler(index, "onReady");
    },
    onEnded: (index: number) => {
      this.callEventHandler(index, "onEnded");
    },
    onPlaying: (index: number, event: any) => {
      window.console.log("onPlaying");
      try {
        let playerObj = this.getPlayerObj(index);
        if (!playerObj) return;

        // 既にタイマーが張られていたら停止する
        if (playerObj.timeUpdateTimer) clearInterval(playerObj.timeUpdateTimer);
        if (playerObj.timerReload) clearTimeout(playerObj.timerReload);

        // 100ミリ秒毎に現在の再生経過時間を通知する
        playerObj.timeUpdateTimer = setInterval(() => {
          this.callEventHandler(
            index,
            "timeUpdate",
            event.target!.getCurrentTime()
          );
        }, 100);
      } catch (error) {
        window.console.error(error);
      }
      this.callEventHandler(
        index,
        "onPlaying",
        event.target.getDuration(),
        event.target
      );
    },
    onPaused: (index: number) => {
      let playerObj = this.getPlayerObj(index);
      if (!playerObj) return;

      // 既にタイマーが張られていたら停止する
      if (playerObj.timeUpdateTimer) clearInterval(playerObj.timeUpdateTimer);
      if (playerObj.timerReload) clearTimeout(playerObj.timerReload);

      this.callEventHandler(index, "onPaused");
    },
    onBuffering: (index: number) => {
      let playerObj = this.getPlayerObj(index);
      if (!playerObj) return;

      // 既にタイマーが張られていたら停止する
      if (playerObj.timeUpdateTimer) clearInterval(playerObj.timeUpdateTimer);

      this.callEventHandler(index, "onBuffering");
    },
    onCued: (index: number) => {
      this.callEventHandler(index, "onCued");
    },
    onPlaybackQualityChange: (index: number) => {
      this.callEventHandler(index, "onPlaybackQualityChange");
    },
    onPlaybackRateChange: (index: number) => {
      this.callEventHandler(index, "onPlaybackRateChange");
    },
    onError: (index: number, event: Event) => {
      this.callEventHandler(index, "onError", event);
    },
    onApiChange: (index: number) => {
      this.callEventHandler(index, "onApiChange");
    }
  };

  public init() {
    window.console.log("YoutubeManager#init");
    // init処理
    const ypContainer = document.querySelectorAll("*[id^=youtube-window-]");
    Array.from(ypContainer).forEach((elm, i) => {
      if (elm.id.endsWith("-player")) return;
      window.console.log(elm);
      window.console.log(elm.firstElementChild!.id);
      const player = new YT.Player(elm.firstElementChild!.id, {
        width: "426",
        height: "240",
        events: {
          onReady: (event: any) => this.eventHandler.onReady(i),
          onStateChange: (event: any) => {
            switch (event.data) {
              case YT.PlayerState.ENDED:
                this.eventHandler.onEnded(i);
                break;
              case YT.PlayerState.PLAYING:
                this.eventHandler.onPlaying(i, event);
                break;
              case YT.PlayerState.PAUSED:
                this.eventHandler.onPaused(i);
                break;
              case YT.PlayerState.BUFFERING:
                this.eventHandler.onBuffering(i);
                break;
              case YT.PlayerState.CUED:
                this.eventHandler.onCued(i);
                break;
              default:
            }
          },
          onPlaybackQualityChange: (suggestedQuality: string) => {
            this.eventHandler.onPlaybackQualityChange(i);
          },
          onPlaybackRateChange: (event: any) => {
            this.eventHandler.onPlaybackRateChange(i);
          },
          onError: (event: any) => {
            this.eventHandler.onError(i, event);
          },
          onApiChange: (event: any) => {
            this.eventHandler.onApiChange(i);
          }
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
      this.playerArr.push(player);
    });
  }
}
