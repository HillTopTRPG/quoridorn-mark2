<template>
  <div class="container" ref="window-container">
    <seek-bar-component
      class="seek-bar-component"
      :bgmInfo="bgmInfo"
      :duration="duration"
      :seek="seek"
      @seekTo="seekTo"
      v-if="bgmInfo"
    />
    <div class="mute" @click="onChangeMute()">
      <span
        class="mute-icon"
        :class="isMute ? 'icon-volume-mute2' : 'icon-volume-high'"
      ></span>
    </div>
    <label class="volume" ref="volumeContainer">
      <input type="range" class="input" v-model="volume" min="0" max="100" />
    </label>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import { StandByReturnInfo } from "task-info";
import TaskProcessor from "../../../core/task/TaskProcessor";
import LifeCycle from "../../../core/decorator/LifeCycle";
import { WindowMoveInfo } from "@/@types/window";
import SeekBarComponent from "./SeekBarComponent.vue";
import SocketFacade from "../../../core/api/app-server/SocketFacade";
import WindowManager from "../../../core/window/WindowManager";
import VueEvent from "../../../core/decorator/VueEvent";
import TaskManager from "../../../core/task/TaskManager";
import WindowVue from "../../../core/window/WindowVue";
import CtrlButton from "../../../core/component/CtrlButton.vue";
import CssManager from "../../../core/css/CssManager";
import GameObjectManager from "../../GameObjectManager";
import BgmManager from "./BgmManager";
import YoutubeManager, {
  getYoutubeThunbnail,
  YoutubeEventHandler
} from "./YoutubeManager";
import {
  PlayBgmInfo,
  YoutubeMuteChangeInfo,
  YoutubeVolumeChangeInfo
} from "@/@types/room";
import { CutInStore, MediaStore } from "@/@types/store-data";

@Component({
  components: { SeekBarComponent, CtrlButton }
})
export default class PlayBgmFileWindow
  extends Mixins<WindowVue<PlayBgmInfo, never>>(WindowVue)
  implements YoutubeEventHandler {
  @Prop({ type: Boolean, default: false })
  private isIpadTesting!: boolean;

  private bgmInfo: CutInStore | null = null;
  private mediaInfo: MediaStore | null = null;
  private targetKey: string | null = null;
  private volume: number = 0;
  private isWindowMoving = false;

  private jukeboxAudio: any = null;
  private isLoop: boolean = false;

  private maxVolume: number = 0;
  private fadeInTable: number[] = [];
  private fadeOutTable: number[] = [];
  // private isPlay: boolean = false;
  private duration: number = 0;
  private seek: number = 0;
  private isMute: boolean = false;
  private isFirstOnReady = true;
  private isPlay: boolean = false;
  private isSeekChanging: boolean = false;

  @TaskProcessor("window-moving-finished")
  private async windowMovingFinished(
    task: Task<WindowMoveInfo, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value!.windowKey !== this.windowKey) return;
    this.isWindowMoving = true;
    task.resolve();
  }

  @TaskProcessor("window-move-end-finished")
  private async windowMoveEndFinished(
    task: Task<WindowMoveInfo, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value!.windowKey !== this.windowKey) return;
    this.isWindowMoving = false;
    task.resolve();
  }

  @LifeCycle
  public async mounted() {
    await this.init();
    this.windowFrameElm.style.visibility = "hidden";
    this.volumeContainerElm.style.setProperty(
      "--volume-base-color",
      CssManager.getCss("--uni-color-gray")
    );
    this.volumeContainerElm.style.setProperty(
      "--volume-font-color",
      CssManager.getCss("--uni-color-white")
    );
    this.isMounted = true;

    let { targetKey, data } = this.windowInfo.args!;
    this.targetKey = targetKey;

    if (!data) {
      const cutInDataCC = SocketFacade.instance.cutInDataCC();
      data = (await cutInDataCC.findSingle("key", targetKey!))!.data!.data!;
    }
    const mediaCC = SocketFacade.instance.mediaCC();
    const mediaInfo = await mediaCC.findSingle("key", data.bgmKey);
    if (!mediaInfo) {
      await this.close();
      return;
    }
    this.mediaInfo = mediaInfo.data!.data!;
    this.bgmInfo = data;

    if (this.isStandByBgm) {
      this.windowInfo.x = -300;
      this.windowInfo.y = -300;
      this.windowInfo.widthPx = 50;
      this.windowInfo.heightPx = 50;
      WindowManager.instance.arrangePoint(this.windowKey);
    }

    if (this.status === "window") {
      this.jukeboxAudio = new Audio();
      this.jukeboxAudio.autoplay = true;
      this.jukeboxAudio.loop = this.bgmInfo.isRepeat;
      this.jukeboxAudio.addEventListener("timeupdate", async () => {
        if (!this.jukeboxAudio) return;
        await this.timeUpdate(this.jukeboxAudio.currentTime);
      });
      this.jukeboxAudio.addEventListener("emptied", () =>
        console.log("emptied")
      );
      this.jukeboxAudio.addEventListener("stalled", () =>
        console.log("stalled")
      );
      this.jukeboxAudio.addEventListener("abort", () => console.log("abort"));
      this.jukeboxAudio.addEventListener("error", () => console.log("error"));
      this.jukeboxAudio.addEventListener("ended", async () => {
        await this.close();
      });
      this.jukeboxAudio.addEventListener("canplay", this.onReady);
      this.jukeboxAudio.addEventListener("loadedmetadata", async () => {
        await this.onPlaying(this.jukeboxAudio.duration);
      });
      this.jukeboxAudio.src = this.mediaInfo.url;
    } else {
      this.volume = this.bgmInfo.volume;
    }

    await BgmManager.playBgm(
      targetKey || null,
      this.bgmInfo,
      this.windowKey,
      this.windowInfo.status,
      this.bgmFileElementKey,
      this
    );
    this.maxVolume = this.bgmInfo.volume;
    this.thumbnailText = `【タイトル】\n${this.bgmInfo.title}\n\n【URL】\n${this.mediaInfo.url}`;
    this.thumbnailData = getYoutubeThunbnail(this.mediaInfo.url);
  }

  private get isStandByBgm(): boolean {
    return (this.targetKey && this.bgmInfo!.isStandBy) as boolean;
  }

  public setVolume(volume: number) {
    this.volume = volume;
  }

  public setIsMute(isMute: boolean) {
    this.isMute = isMute;
  }

  @Watch("windowInfo.args", { immediate: true })
  async onChangeCutInDeclareInfo() {
    if (!this.windowInfo.args) {
      if (this.bgmInfo) {
        this.jukeboxAudio.pause();
        this.jukeboxAudio = null;
      }
      return;
    }
    if (!this.isMounted) return;
  }

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing2(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value !== this.windowInfo.key) return;
    if ("window" !== this.windowInfo.status) return;
    this.jukeboxAudio.pause();
    this.jukeboxAudio = null;

    BgmManager.closeBgm(this.windowInfo.args!);
  }

  @TaskProcessor("stand-by-return-finished")
  private async standByReturnFinished(
    task: Task<StandByReturnInfo, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value!.windowKey !== this.windowKey) return;
    this.windowInfo.widthPx = this.windowInfo.declare.size.widthPx;
    this.windowInfo.heightPx = this.windowInfo.declare.size.heightPx;
    WindowManager.instance.arrangePoint(this.windowKey, true);
    GameObjectManager.instance.playingBgmList.push({
      targetKey: this.targetKey,
      tag: this.bgmInfo!.tag,
      windowKey: this.windowKey
    });
    setTimeout(() => {
      YoutubeManager.instance.play(this.bgmFileElementKey);
    });
  }

  private get bgmFileElementKey() {
    return `${this.windowKey}-${this.status}-bgm-file`;
  }

  @VueEvent
  private thumbnailClick(): void {
    window.open(this.mediaInfo!.url, "_blank");
  }

  private isMounted: boolean = false;
  private viewSizeRatio: number = 1;
  private thumbnailData: string = "";
  private thumbnailText: string = "";

  @LifeCycle
  private destroyed() {
    if (this.status !== "window") return;
    YoutubeManager.instance.destroyed(this.bgmFileElementKey);
  }

  public onReady(): void {
    if (this.status !== "window") return;
    if (this.isIpadTesting) console.log("onReady");
    const windowTitle = this.$t(
      `${this.windowInfo.type}.window-title`
    )!.toString();
    setTimeout(() => {
      this.windowInfo.title = `${this.bgmInfo!.tag}`;
      this.windowInfo.message = this.bgmInfo!.title;
      if (this.bgmInfo!.fadeIn > 1) this.jukeboxAudio.volume = 0;

      // 可視化
      this.windowFrameElm.style.visibility = "visible";

      if (this.isStandByBgm) {
        if (this.isIpadTesting) console.log("isStandByBgm to pause");
        BgmManager.instance.notifyOpenedStandByWindow(
          this.targetKey!,
          this.windowKey
        );
        setTimeout(() => {
          this.jukeboxAudio.pause();
        }, 100);
      }
    });
  }

  public onError(error: any): void {
    console.error(error);
  }

  public onPaused(): void {
    if (this.isIpadTesting) console.log("onPaused");
    if (!this.isSeekChanging) {
      this.isPlay = false;
    }
  }

  public async onPlaying(duration: number): Promise<void> {
    if (this.status !== "window") return;
    if (this.isIpadTesting) console.log("onPlaying");
    // if (this.isFirstOnReady) {
    //   setTimeout(() => {
    //     // iPad対応(まだ完全ではない)
    //     this.onChangeMute();
    //   });
    // }
    // this.isFirstOnReady = false;

    this.isPlay = true;
    if (!this.duration) this.duration = duration;
    // this.isPlay = true;

    this.fadeInTable = [];
    for (let i = 0; i <= this.bgmInfo!.fadeIn; i++) {
      this.fadeInTable.push(this.bgmStart + i / 10);
    }

    this.fadeOutTable = [];
    for (let i = 0; i <= this.bgmInfo!.fadeOut; i++) {
      this.fadeOutTable.push(this.bgmEnd - (this.bgmInfo!.fadeOut - i) / 10);
    }

    if (this.isFirstOnReady) {
      this.jukeboxAudio.currentTime = this.bgmStart;
    }
    this.isFirstOnReady = false;
  }

  private get bgmStart(): number {
    let start = 0;
    if (this.bgmInfo!.start > 0) {
      start = this.bgmInfo!.start;
    } else if (this.bgmInfo!.start < 0) {
      start = this.duration + this.bgmInfo!.start;
    }
    if (start > this.duration) start = this.duration;
    if (start < 0) start = 0;
    return start;
  }

  private get bgmEnd(): number {
    let end = this.duration;
    if (this.bgmInfo!.end > 0) {
      end = this.bgmInfo!.end;
    } else if (this.bgmInfo!.end < 0) {
      end = this.duration + this.bgmInfo!.end;
    }
    if (end > this.duration) end = this.duration;
    if (end < 0) end = 0;
    return end;
  }

  public async timeUpdate(time: number): Promise<void> {
    if (time === undefined) return;
    if (!this.bgmInfo) return;
    let isReturn = false;
    if (!this.isSeekToAfter && this.seek > this.bgmEnd) {
      if (this.bgmInfo!.isRepeat) {
        this.seek = this.bgmStart;
        this.jukeboxAudio.currentTime = this.seek;
        this.isSeekToBefore = false;
      } else {
        BgmManager.closeBgm(this.windowInfo.args!);
        await this.close();
        return;
      }
      isReturn = true;
    }
    if (!isReturn) {
      this.seek = time;
    }

    if (
      !this.isSeekToBefore &&
      this.fadeInTable.length > 2 &&
      this.fadeInTable[0] <= time &&
      time < this.fadeInTable[this.fadeInTable.length - 1]
    ) {
      const toIndex = this.fadeInTable.findIndex(fadeIn => fadeIn > time);
      this.volume = (this.maxVolume / this.fadeInTable.length) * toIndex;
      return;
    }
    if (
      this.fadeOutTable.length > 2 &&
      this.fadeOutTable[0] <= time &&
      time < this.fadeOutTable[this.fadeOutTable.length - 1]
    ) {
      const toIndex = this.fadeOutTable.findIndex(fadeOut => fadeOut > time);
      this.volume =
        this.maxVolume - (this.maxVolume / this.fadeOutTable.length) * toIndex;
      return;
    }
  }

  public onEnded(): void {
    if (this.status !== "window") return;
    if (this.isIpadTesting) console.log("onEnded");
    if (this.bgmInfo!.isRepeat) {
      this.seek = this.bgmStart;
      YoutubeManager.instance.seekTo(
        this.bgmFileElementKey,
        this.bgmStart,
        true
      );
      if (this.bgmInfo!.fadeIn > 1) this.volume = 0;
      this.isSeekToAfter = false;
      this.isSeekToBefore = false;
    } else {
      BgmManager.closeBgm(this.windowInfo.args!);
      this.isPlay = false;
      this.close().then();
    }
  }

  @VueEvent
  private onChangeMute() {
    this.isMute = !this.isMute;
    console.warn("onChangeMute");
    if (this.isIpadTesting) console.log("onChangeMute", this.isMute);
  }

  private isSeekToBefore: boolean = false;
  private isSeekToAfter: boolean = false;

  @VueEvent
  private seekTo(seek: number, allowSeekAhead: boolean) {
    if (this.isIpadTesting) console.log("seekTo");
    this.isSeekToBefore = seek < this.bgmStart;
    this.isSeekToAfter = this.bgmEnd < seek;
    setTimeout(async () => {
      this.seek = seek;
      this.jukeboxAudio.currentTime = seek;
      if (this.isPlay) {
        this.isSeekChanging = true;
        if (allowSeekAhead) {
          await this.jukeboxAudio.play();
          this.isSeekChanging = false;
        } else {
          await this.jukeboxAudio.pause();
        }
      }
    });
  }

  private get windowElm(): HTMLDivElement {
    return this.$refs["window-container"] as HTMLDivElement;
  }

  private get volumeContainerElm(): HTMLDivElement {
    return this.$refs.volumeContainer as HTMLDivElement;
  }

  @Watch("isMounted")
  @Watch("volume")
  private async onChangeVolume() {
    if (!this.isMounted) return;
    if (this.isIpadTesting) console.log("onChangeVolume");

    if (this.bgmInfo) {
      if (this.status === "window") {
        this.jukeboxAudio.volume = this.volume / 100;
      } else {
        await TaskManager.instance.ignition<YoutubeVolumeChangeInfo, never>({
          type: "bgm-volume-change",
          owner: "Quoridorn",
          value: {
            tag: this.bgmInfo.tag,
            windowStatus: this.status,
            volume: this.volume
          }
        });
      }
    }
    this.volumeContainerElm.style.setProperty(
      "--volume-per",
      `${this.volume}%`
    );
    this.isMute = false;
  }

  @TaskProcessor("bgm-volume-change-finished")
  private async bgmVolumeChangeFinished(
    task: Task<YoutubeVolumeChangeInfo, never>
  ): Promise<TaskResult<never> | void> {
    if (!this.bgmInfo || this.bgmInfo.tag !== task.value!.tag) return;
    if (this.status === task.value!.windowStatus) return;
    if (this.volume !== task.value!.volume) this.volume = task.value!.volume;
    task.resolve();
  }

  @Watch("isMounted")
  @Watch("isMute")
  private async onChangeIsPlay() {
    if (!this.isMounted) return;
    if (this.isIpadTesting) console.log("onChangeIsMute");

    if (this.bgmInfo) {
      if (this.status === "window") {
        this.jukeboxAudio.muted = this.isMute;
      } else {
        await TaskManager.instance.ignition<YoutubeMuteChangeInfo, never>({
          type: "bgm-mute-change",
          owner: "Quoridorn",
          value: {
            tag: this.bgmInfo.tag,
            windowStatus: this.status,
            isMute: this.isMute
          }
        });
      }
    }

    const useCss = this.isMute ? "--uni-color-orange" : "--uni-color-skyblue";
    this.volumeContainerElm.style.setProperty(
      "--volume-color",
      CssManager.getCss(useCss)
    );
  }

  @TaskProcessor("bgm-mute-change-finished")
  private async bgmMuteChangeFinished(
    task: Task<YoutubeMuteChangeInfo, never>
  ): Promise<TaskResult<never> | void> {
    if (!this.bgmInfo || this.bgmInfo.tag !== task.value!.tag) return;
    if (this.status === task.value!.windowStatus) return;
    this.isMute = task.value!.isMute;
    task.resolve();
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.container {
  @include flex-box(row, flex-start, stretch);
  visibility: inherit;
  width: 100%;
  height: 100%;
}

.seek-bar-component {
  flex: 1;
  height: 2em;
  font-size: 12px;
}

.volume {
  position: relative;
  width: 5em;

  input {
    width: 5em;
    font-size: 12px;
  }
  /*
  input[type="range"] {
    position: absolute;
    left: 0;
    top: 0;
    -webkit-appearance: none;
    width: var(--volume-height);
    font-size: 12px;
    height: 2em;
    padding: 0;
    margin: 0;
    transform: rotate(-90deg) translateX(calc(-100% + 2em));
    transform-origin: 1em 1em;
    outline: none;
    cursor: pointer;
    background: linear-gradient(
      to right,
      var(--volume-color) 0%,
      var(--volume-color) var(--volume-per),
      var(--volume-base-color) var(--volume-per),
      var(--volume-base-color) 100%
    );
  }
  input[type="range"]::-webkit-slider-runnable-track {
    background: rgba(0, 0, 0, 0);
    box-sizing: border-box;
  }
  input[type="range"]::-webkit-slider-thumb {
    position: relative;
    -webkit-appearance: none;
    cursor: pointer;
    box-sizing: border-box;
    width: 2em;
    height: 2em;
    border: none;
    background-color: var(--uni-color-black);
  }
  */
}

.mute {
  @include flex-box(row, stretch, stretch);
  position: relative;
  width: 2em;
  height: 2em;
  cursor: pointer;
}
.mute-icon {
  @include flex-box(row, center, center);
  flex: 1;
  font-size: 1.5em;
}

.icon-volume-high {
  background-color: var(--uni-color-skyblue);
}

.icon-volume-mute2 {
  background-color: var(--uni-color-orange);
}
</style>
