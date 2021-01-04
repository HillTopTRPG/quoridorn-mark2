<template>
  <div class="container" ref="window-container">
    <div class="youtube-container-outer" v-if="status === 'window'">
      <div
        class="youtube-container-transform"
        :class="{ isResizing, isWindowMoving }"
      >
        <div :id="youtubeElementKey" class="youtube"></div>
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
      :bgmInfo="cutInInfo"
      :duration="cutInInfo.duration || 0"
      :seek="seek"
      @seekTo="seekTo"
      v-if="cutInInfo"
    />
    <label class="volume" ref="volumeContainer">
      <input type="range" class="input" v-model="volume" min="0" max="100" />
    </label>
    <div class="mute" @click="onChangeMute()">
      <span class="mute-icon icon-volume-high" v-if="!isMute"></span>
      <span class="mute-icon icon-volume-mute2" v-else></span>
    </div>
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
import { getCssPxNum } from "@/app/core/css/Css";
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
export default class PlayYoutubeWindow
  extends Mixins<WindowVue<PlayBgmInfo, never>>(WindowVue)
  implements YoutubeEventHandler {
  @Prop({ type: Boolean, default: false })
  private isIpadTesting!: boolean;

  private cutInInfo: CutInStore | null = null;
  private mediaInfo: MediaStore | null = null;
  private targetKey: string | null = null;
  private volume: number = 0;
  private isWindowMoving = false;

  private maxVolume: number = 0;
  private fadeInTable: number[] = [];
  private fadeOutTable: number[] = [];
  // private isPlay: boolean = false;
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

    // targetKeyかdataはどちらかが設定されてくる
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
    this.cutInInfo = data;

    if (this.isStandByBgm) {
      this.windowInfo.x = -300;
      this.windowInfo.y = -300;
      this.windowInfo.widthPx = 50;
      this.windowInfo.heightPx = 50;
      WindowManager.instance.arrangePoint(this.windowKey);
    }

    await BgmManager.playBgm(
      targetKey || null,
      this.cutInInfo,
      this.windowKey,
      this.windowInfo.status,
      this.youtubeElementKey,
      this
    );
    this.maxVolume = this.cutInInfo.volume;
    this.thumbnailText = `【タイトル】\n${this.cutInInfo.title}\n\n【URL】\n${this.mediaInfo.url}`;
    this.thumbnailData = getYoutubeThunbnail(this.mediaInfo.url);
  }

  private get isStandByBgm(): boolean {
    return (this.targetKey && this.cutInInfo!.isStandBy) as boolean;
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
      if (this.cutInInfo)
        YoutubeManager.instance.destroyed(this.youtubeElementKey);
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
    YoutubeManager.instance.pause(this.youtubeElementKey);

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
      tag: this.cutInInfo!.tag,
      windowKey: this.windowKey
    });
    setTimeout(() => {
      YoutubeManager.instance.play(this.youtubeElementKey);
    });
  }

  private get youtubeElementKey() {
    return `${this.windowKey}-${this.status}-youtube`;
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
    YoutubeManager.instance.destroyed(this.youtubeElementKey);
  }

  public onReady(): void {
    if (this.status !== "window") return;
    if (this.isIpadTesting) console.log("onReady");
    const windowTitle = this.$t(
      `${this.windowInfo.type}.window-title`
    )!.toString();
    setTimeout(() => {
      this.windowInfo.title = `${windowTitle}(${this.cutInInfo!.tag})`;
      this.windowInfo.message = this.cutInInfo!.title;
      if (this.cutInInfo!.fadeIn > 1)
        YoutubeManager.instance.setVolume(this.youtubeElementKey, 0);

      this.playStart();

      // 可視化
      this.windowFrameElm.style.visibility = "visible";

      if (this.isStandByBgm) {
        if (this.isIpadTesting) console.log("isStandByBgm to pause");
        BgmManager.instance.notifyOpenedStandByWindow(
          this.targetKey!,
          this.windowKey
        );
        setTimeout(() => {
          YoutubeManager.instance.seekTo(
            this.youtubeElementKey,
            this.cutInInfo!.start,
            true
          );
          YoutubeManager.instance.pause(this.youtubeElementKey);
        }, 100);
      }
    });
  }

  private playStart() {
    if (this.isIpadTesting) console.log("# playStart");
    if (this.isFirstOnReady) {
      this.onChangeMute();
    }
    // YoutubeManager.instance.mute(this.youtubeElementKey);
    YoutubeManager.instance.loadVideoById(
      this.youtubeElementKey,
      this.cutInInfo!
    );
    YoutubeManager.instance.play(this.youtubeElementKey);
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

    if (this.isFirstOnReady) {
      setTimeout(() => {
        // iPad対応(まだ完全ではない)
        this.onChangeMute();
      });
    }
    this.isFirstOnReady = false;

    this.isPlay = true;
    const updateDB = !this.cutInInfo!.duration;
    this.cutInInfo!.duration = duration;
    if (updateDB && this.targetKey) {
      const cutInDataCC = SocketFacade.instance.cutInDataCC();
      await cutInDataCC.updatePackage([
        { key: this.targetKey!, data: this.cutInInfo! }
      ]);
    }
    // this.isPlay = true;

    this.fadeInTable = [];
    for (let i = 0; i <= this.cutInInfo!.fadeIn; i++) {
      this.fadeInTable.push(this.bgmStart + i / 10);
    }

    this.fadeOutTable = [];
    for (let i = 0; i <= this.cutInInfo!.fadeOut; i++) {
      this.fadeOutTable.push(this.bgmEnd - (this.cutInInfo!.fadeOut - i) / 10);
    }
  }

  private get bgmStart(): number {
    let start = 0;
    const duration = this.cutInInfo!.duration || 0;
    if (this.cutInInfo!.start > 0) {
      start = this.cutInInfo!.start;
    } else if (this.cutInInfo!.start < 0) {
      start = duration + this.cutInInfo!.start;
    }
    if (start > duration) start = duration;
    if (start < 0) start = 0;
    return start;
  }

  private get bgmEnd(): number {
    const duration = this.cutInInfo!.duration || 0;
    let end = duration;
    if (this.cutInInfo!.end > 0) {
      end = this.cutInInfo!.end;
    } else if (this.cutInInfo!.end < 0) {
      end = duration + this.cutInInfo!.end;
    }
    if (end > duration) end = duration;
    if (end < 0) end = 0;
    return end;
  }

  public async timeUpdate(time: number): Promise<void> {
    if (time === undefined) return;
    if (!this.cutInInfo) return;
    let isReturn = false;
    if (!this.isSeekToAfter) {
      if (this.seek > this.bgmEnd) {
        if (this.cutInInfo!.isRepeat) {
          this.seek = this.bgmStart;
          YoutubeManager.instance.seekTo(
            this.youtubeElementKey,
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
    if (this.isIpadTesting) console.log("onEnded");
    if (this.cutInInfo!.isRepeat) {
      this.seek = this.bgmStart;
      YoutubeManager.instance.seekTo(
        this.youtubeElementKey,
        this.bgmStart,
        true
      );
      if (this.cutInInfo!.fadeIn > 1) this.volume = 0;
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
    if (this.isIpadTesting) console.log("onChangeMute", this.isMute);
  }

  private isSeekToBefore: boolean = false;
  private isSeekToAfter: boolean = false;

  @VueEvent
  private seekTo(seek: number, allowSeekAhead: boolean) {
    if (this.isIpadTesting) console.log("seekTo");
    this.isSeekToBefore = seek < this.bgmStart;
    this.isSeekToAfter = this.bgmEnd < seek;
    setTimeout(() => {
      YoutubeManager.instance.seekTo(
        this.youtubeElementKey,
        seek,
        allowSeekAhead
      );
      this.seek = seek;
      if (this.isPlay) {
        this.isSeekChanging = true;
        if (allowSeekAhead) {
          YoutubeManager.instance.play(this.youtubeElementKey);
          this.isSeekChanging = false;
        } else {
          YoutubeManager.instance.pause(this.youtubeElementKey);
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

    if (this.cutInInfo) {
      if (this.status === "window") {
        YoutubeManager.instance.setVolume(this.youtubeElementKey, this.volume);
      } else {
        await TaskManager.instance.ignition<YoutubeVolumeChangeInfo, never>({
          type: "bgm-volume-change",
          owner: "Quoridorn",
          value: {
            tag: this.cutInInfo.tag,
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
    if (!this.cutInInfo || this.cutInInfo.tag !== task.value!.tag) return;
    if (this.status === task.value!.windowStatus) return;
    if (this.volume !== task.value!.volume) this.volume = task.value!.volume;
    task.resolve();
  }

  @Watch("isMounted")
  @Watch("isMute")
  private async onChangeIsMute() {
    if (!this.isMounted) return;
    if (this.isIpadTesting) console.log("onChangeIsMute");

    if (this.cutInInfo) {
      if (this.status === "window") {
        if (this.isMute) YoutubeManager.instance.mute(this.youtubeElementKey);
        else YoutubeManager.instance.unMute(this.youtubeElementKey);
      } else {
        await TaskManager.instance.ignition<YoutubeMuteChangeInfo, never>({
          type: "bgm-mute-change",
          owner: "Quoridorn",
          value: {
            tag: this.cutInInfo.tag,
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
    if (!this.cutInInfo || this.cutInInfo.tag !== task.value!.tag) return;
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
@import "../../../../assets/common";

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
