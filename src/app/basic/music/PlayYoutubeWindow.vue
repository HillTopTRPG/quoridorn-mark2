<template>
  <div class="container" ref="window">
    <div class="youtube-container-outer" v-if="status === 'window'">
      <div
        class="youtube-container-transform"
        :class="{ isResizing, isWindowMoving }"
      >
        <div :id="youtubeElementId" class="youtube"></div>
      </div>
    </div>
    <div class="youtube-container-outer" v-else>
      <img
        :src="thumbnailData"
        draggable="false"
        alt="Not Found"
        :title="thumbnailText"
        @click="thumbnailClick"
      />
    </div>
    <seek-bar-component
      :bgmInfo="bgmInfo"
      :duration="duration"
      :seek="seek"
      @seekTo="seekTo"
      v-if="bgmInfo"
    />
    <label class="volume" ref="volumeContainer">
      <input type="range" v-model="volume" min="0" max="100" />
    </label>
    <div class="mute" @click="onChangeMute()">
      <span class="mute-icon icon-volume-high" v-if="!isMute"></span>
      <span class="mute-icon icon-volume-mute2" v-else></span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import WindowVue from "@/app/core/window/WindowVue";
import YoutubeManager, {
  YoutubeEventHandler
} from "@/app/basic/music/YoutubeManager";
import { getUrlParam } from "@/app/core/Utility";
import SeekBarComponent from "@/app/basic/music/SeekBarComponent.vue";
import { Mixins } from "vue-mixin-decorator";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import VueEvent from "@/app/core/decorator/VueEvent";
import LanguageManager from "@/LanguageManager";
import { getCssPxNum } from "@/app/core/Css";
import CssManager from "@/app/core/css/CssManager";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import TaskManager from "@/app/core/task/TaskManager";
import {
  CutInDeclareInfo,
  YoutubeMuteChangeInfo,
  YoutubeVolumeChangeInfo
} from "@/@types/room";
import BgmManager from "@/app/basic/music/BgmManager";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import { PlayBgmInfo } from "window-info";
import { StandByReturnInfo } from "task-info";
import WindowManager from "@/app/core/window/WindowManager";
import { WindowMoveInfo } from "@/@types/window";

@Component({
  components: { SeekBarComponent, CtrlButton }
})
export default class PlayYoutubeWindow
  extends Mixins<WindowVue<PlayBgmInfo, never>>(WindowVue)
  implements YoutubeEventHandler {
  private bgmInfo: CutInDeclareInfo | null = null;
  private targetId: string | null = null;
  private volume: number = 0;
  private isWindowMoving = false;

  private maxVolume: number = 0;
  private fadeInTable: number[] = [];
  private fadeOutTable: number[] = [];
  // private isPlay: boolean = false;
  private duration: number = 0;
  private seek: number = 0;
  private isMute: boolean = false;
  private isFirstOnReady = true;

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

    let { targetId, data } = this.windowInfo.args!;
    this.targetId = targetId;

    if (!data) {
      const cutInDataCC = SocketFacade.instance.cutInDataCC();
      data = (await cutInDataCC.getData(targetId!))!.data!;
    }
    this.bgmInfo = data;

    if (this.isStandByBgm) {
      this.windowInfo.x = -300;
      this.windowInfo.y = -300;
      this.windowInfo.widthPx = 50;
      this.windowInfo.heightPx = 50;
      WindowManager.instance.arrangePoint(this.windowKey);
    }

    await BgmManager.playBgm(
      targetId || null,
      this.bgmInfo,
      this.windowKey,
      this.windowInfo.status,
      this.youtubeElementId,
      this
    );
    this.maxVolume = this.bgmInfo.volume;
    this.thumbnailText = `【タイトル】\n${this.bgmInfo.title}\n\n【URL】\n${this.bgmInfo.url}`;
    this.thumbnailData = `http://i.ytimg.com/vi/${getUrlParam(
      "v",
      this.bgmInfo.url
    )}/default.jpg`;
  }

  private get isStandByBgm(): boolean {
    return (this.targetId && this.bgmInfo!.isStandBy) as boolean;
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
      if (this.bgmInfo)
        YoutubeManager.instance.destroyed(this.youtubeElementId);
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
    YoutubeManager.instance.pause(this.youtubeElementId);

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
    setTimeout(() => {
      YoutubeManager.instance.play(this.youtubeElementId);
    });
  }

  private get youtubeElementId() {
    return `${this.windowKey}-${this.status}-youtube`;
  }

  @VueEvent
  private thumbnailClick(): void {
    window.open(this.bgmInfo!.url, "_blank");
  }

  private isMounted: boolean = false;
  private viewSizeRatio: number = 1;
  private thumbnailData: string = "";
  private thumbnailText: string = "";

  @LifeCycle
  private destroyed() {
    if (this.status !== "window") return;
    YoutubeManager.instance.destroyed(this.youtubeElementId);
  }

  public onReady(): void {
    if (this.status !== "window") return;
    const windowTitle = LanguageManager.instance.getText(
      `${this.windowInfo.type}.window-title`
    );
    setTimeout(() => {
      this.windowInfo.title = `${windowTitle}(${this.bgmInfo!.tag})`;
      this.windowInfo.message = this.bgmInfo!.title;
      if (this.bgmInfo!.fadeIn > 1)
        YoutubeManager.instance.setVolume(this.youtubeElementId, 0);

      this.playStart();
      this.isFirstOnReady = false;

      // 可視化
      this.windowFrameElm.style.visibility = "visible";

      if (this.isStandByBgm) {
        BgmManager.instance.notifyOpenedStandByWindow(
          this.targetId!,
          this.windowKey
        );
        setTimeout(() => {
          YoutubeManager.instance.seekTo(
            this.youtubeElementId,
            this.bgmInfo!.start,
            true
          );
          YoutubeManager.instance.pause(this.youtubeElementId);
        }, 100);
      }
    });
  }

  private playStart() {
    YoutubeManager.instance.loadVideoById(this.youtubeElementId, this.bgmInfo!);
  }

  public onError(error: any): void {
    window.console.error(error);
  }

  public onPaused(): void {
    // this.isPlay = false;
  }

  public async onPlaying(duration: number): Promise<void> {
    if (this.status !== "window") return;
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

  public onReject(): void {
    // nothing
  }

  public async timeUpdate(time: number): Promise<void> {
    if (time === undefined) return;
    if (!this.bgmInfo) return;
    let isReturn = false;
    if (!this.isSeekToAfter) {
      if (this.seek > this.bgmEnd) {
        if (this.bgmInfo!.isRepeat) {
          this.seek = this.bgmStart;
          YoutubeManager.instance.seekTo(
            this.youtubeElementId,
            this.bgmStart,
            true
          );
          this.isSeekToBefore = false;
        } else {
          BgmManager.closeBgm(this.windowInfo.args!);
          await this.close();
          return;
        }
        isReturn = true;
      }
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
    window.console.log("onEnded");
    if (this.bgmInfo!.isRepeat) {
      this.seek = this.bgmStart;
      YoutubeManager.instance.seekTo(
        this.youtubeElementId,
        this.bgmStart,
        true
      );
      if (this.bgmInfo!.fadeIn > 1) this.volume = 0;
      this.isSeekToAfter = false;
      this.isSeekToBefore = false;
    } else {
      BgmManager.closeBgm(this.windowInfo.args!);
      this.close().then();
    }
  }

  @VueEvent
  private onChangeMute() {
    this.isMute = !this.isMute;
    if (this.isMute) YoutubeManager.instance.mute(this.youtubeElementId);
    else YoutubeManager.instance.unMute(this.youtubeElementId);
  }

  private isSeekToBefore: boolean = false;
  private isSeekToAfter: boolean = false;

  @VueEvent
  private seekTo(seek: number, allowSeekAhead: boolean) {
    this.isSeekToBefore = seek < this.bgmStart;
    this.isSeekToAfter = this.bgmEnd < seek;
    setTimeout(() => {
      YoutubeManager.instance.seekTo(
        this.youtubeElementId,
        seek,
        allowSeekAhead
      );
      this.seek = seek;
      if (allowSeekAhead) {
        YoutubeManager.instance.play(this.youtubeElementId);
      } else {
        YoutubeManager.instance.pause(this.youtubeElementId);
      }
    });
  }

  private get windowElm(): HTMLDivElement {
    return this.$refs.window as HTMLDivElement;
  }

  private get volumeContainerElm(): HTMLDivElement {
    return this.$refs.volumeContainer as HTMLDivElement;
  }

  @Watch("isMounted")
  @Watch("volume")
  private async onChangeVolume() {
    if (!this.isMounted) return;
    if (this.bgmInfo) {
      YoutubeManager.instance.setVolume(this.youtubeElementId, this.volume);
      await TaskManager.instance.ignition<YoutubeVolumeChangeInfo, never>({
        type: "youtube-volume-change",
        owner: "Quoridorn",
        value: {
          tag: this.bgmInfo.tag,
          windowStatus: this.status,
          volume: this.volume
        }
      });
    }
    this.volumeContainerElm.style.setProperty(
      "--volume-per",
      `${this.volume}%`
    );
  }

  @TaskProcessor("youtube-volume-change-finished")
  private async youtubeVolumeChange(
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
    this.volumeContainerElm.style.setProperty(
      "--volume-color",
      this.isMute
        ? CssManager.getCss("--uni-color-orange")
        : CssManager.getCss("--uni-color-skyblue")
    );
    if (this.bgmInfo) {
      await TaskManager.instance.ignition<YoutubeMuteChangeInfo, never>({
        type: "youtube-mute-change",
        owner: "Quoridorn",
        value: {
          tag: this.bgmInfo.tag,
          windowStatus: this.status,
          isMute: this.isMute
        }
      });
    }
  }

  @TaskProcessor("youtube-mute-change-finished")
  private async youtubeMuteChange(
    task: Task<YoutubeMuteChangeInfo, never>
  ): Promise<TaskResult<never> | void> {
    if (!this.bgmInfo || this.bgmInfo.tag !== task.value!.tag) return;
    if (this.status === task.value!.windowStatus) return;
    this.isMute = task.value!.isMute;
    task.resolve();
  }

  @Watch("isMounted")
  @Watch("windowInfo.widthPx")
  private onChangeWindowWidth() {
    if (this.status === "window") {
      const fontSize = getCssPxNum("font-size", this.windowElm);
      const windowWidth = this.windowInfo.widthPx;
      const playerSize = YoutubeManager.playerElementSize;
      const ratio = (windowWidth - fontSize * 2) / playerSize.width;
      this.viewSizeRatio = ratio;
      this.windowInfo.heightPx = ratio * playerSize.height + fontSize * 2;
      this.windowElm.style.setProperty(
        "--youtube-size-ratio",
        ratio.toString()
      );
      setTimeout(() => {
        const volumeContainerHeight = this.volumeContainerElm.getBoundingClientRect()
          .height;
        this.windowElm.style.setProperty(
          "--volume-height",
          volumeContainerHeight + "px"
        );
      });
    } else {
      setTimeout(() => {
        this.windowElm.style.setProperty("--volume-height", "90px");
      });
    }
  }

  @Watch("windowInfo.heightPx")
  private onChangeWindowHeight() {
    const fontSize = getCssPxNum("font-size", this.windowElm);
    const windowHeight = this.windowInfo.heightPx;
    const playerSize = YoutubeManager.playerElementSize;
    const ratio = (windowHeight - fontSize * 2) / playerSize.height;
    this.viewSizeRatio = ratio;
    this.windowInfo.widthPx = ratio * playerSize.width + fontSize * 2;
    this.windowElm.style.setProperty("--youtube-size-ratio", ratio.toString());
    setTimeout(() => {
      const volumeContainerHeight = this.volumeContainerElm.getBoundingClientRect()
        .height;
      this.windowElm.style.setProperty(
        "--volume-height",
        volumeContainerHeight + "px"
      );
    });
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.container {
  visibility: inherit;
  display: grid;
  grid-template-rows: 1fr 2em;
  grid-template-columns: 1fr 2em;
  width: 100%;
  height: 100%;
}

.youtube-container-outer {
  display: block;
  grid-row: 1 / 2;
  grid-column: 1 / 2;
  position: relative;
  overflow: hidden;

  img {
    display: block;
  }
}

.youtube-container-transform {
  display: block;
  transform: scale(var(--youtube-size-ratio));
  transform-origin: left top;

  &.isResizing {
    pointer-events: none;
  }
  &.isWindowMoving {
    pointer-events: none;
  }
}

.volume {
  position: relative;
  grid-row: 1 / 2;
  grid-column: 2 / 2;

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
}

.mute {
  @include flex-box(row, stretch, stretch);
  position: relative;
  grid-row: 2 / 2;
  grid-column: 2 / 2;
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
