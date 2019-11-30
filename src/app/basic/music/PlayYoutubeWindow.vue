<template>
  <div class="container" ref="window">
    <div class="youtube-container-outer" v-if="status === 'window'">
      <div class="youtube-container-transform" :class="{ isResizing }">
        <div :id="youtubeElementId" class="youtube"></div>
      </div>
    </div>
    <div class="youtube-container-outer" v-else>
      <img
        v-img="thumbnailData"
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
    <div class="volume" ref="volumeContainer">
      <input type="range" v-model="volume" min="0" max="100" />
    </div>
    <div class="mute" @click="onChangeMute()">
      <span class="icon-volume-high" v-if="!isMute"></span>
      <span class="icon-volume-mute" v-else></span>
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
import SocketFacade from "@/app/core/api/app-server/SocketFacade";

@Component({
  components: { SeekBarComponent, CtrlButton }
})
export default class PlayYoutubeWindow
  extends Mixins<WindowVue<string, never>>(WindowVue)
  implements YoutubeEventHandler {
  private bgmInfo: CutInDeclareInfo | null = null;
  private volume: number = 0;

  private maxVolume: number = 0;
  private fadeInTable: number[] = [];
  private fadeOutTable: number[] = [];
  private isPlay: boolean = false;
  private duration: number = 0;
  private seek: number = 0;
  private isMute: boolean = false;

  @LifeCycle
  public async mounted() {
    await this.init();
    this.volumeContainerElm.style.setProperty(
      "--volume-base-color",
      CssManager.getCss("--uni-color-gray")
    );
    this.volumeContainerElm.style.setProperty(
      "--volume-font-color",
      CssManager.getCss("--uni-color-white")
    );
    this.isMounted = true;
    if (this.windowInfo.status !== this.status) return;
    if (this.status !== "window") return;
    await this.startPlay();
    const player = YoutubeManager.instance.getPlayerInfo(this.bgmInfo!.tag);
    if (player) return;
    setTimeout(() => {
      YoutubeManager.instance.open(this.youtubeElementId, this.bgmInfo!, this);
    });
  }

  @Watch("windowInfo.args", { immediate: true })
  async onChangeCutInDeclareInfo() {
    if (!this.windowInfo.args) {
      if (this.bgmInfo) YoutubeManager.instance.destroyed(this.bgmInfo.tag);
      return;
    }
    if (!this.isMounted) return;
    await this.startPlay();
  }

  private async startPlay() {
    if (this.status !== "window") return;
    const playListCC = SocketFacade.instance.playListCC();
    const playData = await playListCC.getData(this.windowInfo.args!);
    const unsubscribe = await playListCC.setCollectionSnapshot(
      this.key,
      snapshot => {
        snapshot.docs.filter(async doc => {
          if (doc.type === "removed" && doc.ref.id === this.windowInfo.args) {
            await this.close();
            unsubscribe();
          }
        });
      }
    );
    const targetId = playData!.data!.targetId;

    const cutInDataCC = SocketFacade.instance.cutInDataCC();
    const cutInData = await cutInDataCC.getData(targetId);

    this.bgmInfo = cutInData!.data!;
    if (this.bgmInfo!.fadeIn < 2) this.volume = this.bgmInfo!.volume;
    this.maxVolume = this.bgmInfo!.volume;
    if (!this.bgmInfo) return;
    YoutubeManager.instance.loadVideoById(this.bgmInfo);
    let title = `【タイトル】\n${this.bgmInfo.title}`;
    title += `\n\n【URL】\n${this.bgmInfo.url}`;
    this.thumbnailText = title;
    this.thumbnailData = `http://i.ytimg.com/vi/${getUrlParam(
      "v",
      this.bgmInfo.url
    )}/default.jpg`;
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
    YoutubeManager.instance.destroyed(this.bgmInfo!.tag);
  }

  public onReady(): void {
    if (this.status !== "window") return;
    window.console.log("youtube ready");
    const windowTitle = LanguageManager.instance.getText(
      `${this.windowInfo.type}.window-title`
    );
    this.windowInfo.title = `${windowTitle}(${this.bgmInfo!.tag})`;
    this.windowInfo.message = this.bgmInfo!.title;
    YoutubeManager.instance.loadVideoById(this.bgmInfo!);
    if (this.bgmInfo!.fadeIn > 1)
      YoutubeManager.instance.setVolume(this.bgmInfo!.tag, 0);
  }

  public onError(error: any): void {
    window.console.error(error);
  }

  public onPaused(): void {
    window.console.log("onPaused");
    this.isPlay = false;
  }

  public onPlaying(duration: number): void {
    if (this.status !== "window") return;
    this.duration = duration;
    this.isPlay = true;
    window.console.log("onPlaying");

    this.fadeInTable = [];
    for (let i = 0; i <= this.bgmInfo!.fadeIn; i++) {
      this.fadeInTable.push(this.bgmStart + i / 10);
    }

    this.fadeOutTable = [];
    for (let i = 0; i <= this.bgmInfo!.fadeOut; i++) {
      this.fadeOutTable.push(this.bgmEnd - (this.bgmInfo!.fadeOut - i) / 10);
    }
  }

  private get bgmStart(this: any): number {
    let start = 0;
    if (this.bgmInfo.start > 0) {
      start = this.bgmInfo.start;
    } else if (this.bgmInfo.start < 0) {
      start = this.duration + this.bgmInfo.start;
    }
    if (start > this.duration) start = this.duration;
    if (start < 0) start = 0;
    return start;
  }

  private get bgmEnd(this: any): number {
    let end = this.duration;
    if (this.bgmInfo.end > 0) {
      end = this.bgmInfo.end;
    } else if (this.bgmInfo.end < 0) {
      end = this.duration + this.bgmInfo.end;
    }
    if (end > this.duration) end = this.duration;
    if (end < 0) end = 0;
    return end;
  }

  public onReject(): void {
    window.console.log("onReject");
  }

  public async timeUpdate(time: number): Promise<void> {
    if (this.status !== "window") return;
    let isReturn = false;
    if (!this.isSeekToAfter) {
      if (this.seek > this.bgmEnd) {
        if (this.bgmInfo!.isLoop) {
          this.seek = this.bgmStart;
          YoutubeManager.instance.seekTo(
            this.bgmInfo!.tag,
            this.bgmStart,
            true
          );
          this.isSeekToBefore = false;
        } else {
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
    if (this.bgmInfo!.isLoop) {
      this.seek = this.bgmStart;
      YoutubeManager.instance.seekTo(this.bgmInfo!.tag, this.bgmStart, true);
      if (this.bgmInfo!.fadeIn > 1) this.volume = 0;
      this.isSeekToAfter = false;
      this.isSeekToBefore = false;
    }
  }

  @VueEvent
  private onChangeMute() {
    if (this.status !== "window") return;
    this.isMute = !this.isMute;
    if (this.isMute) YoutubeManager.instance.mute(this.bgmInfo!.tag);
    else YoutubeManager.instance.unMute(this.bgmInfo!.tag);
  }

  private isSeekToBefore: boolean = false;
  private isSeekToAfter: boolean = false;
  @VueEvent
  private seekTo(seekStr: string, allowSeekAhead: boolean) {
    if (this.status !== "window") return;
    const seek = parseInt(seekStr, 10);
    this.isSeekToBefore = seek < this.bgmStart;
    this.isSeekToAfter = this.bgmEnd < seek;
    setTimeout(() => {
      YoutubeManager.instance.seekTo(this.bgmInfo!.tag, seek, allowSeekAhead);
      this.seek = seek;
    });
    if (allowSeekAhead) {
      window.console.log("PLAY PLAY PLAY");
      YoutubeManager.instance.play(this.bgmInfo!.tag);
    } else {
      window.console.log("PAUSE PAUSE PAUSE");
      YoutubeManager.instance.pause(this.bgmInfo!.tag);
    }
  }

  private get windowElm(): HTMLDivElement {
    return this.$refs.window as HTMLDivElement;
  }

  private get volumeContainerElm(): HTMLDivElement {
    return this.$refs.volumeContainer as HTMLDivElement;
  }

  @Watch("isMounted")
  @Watch("volume")
  private onChangeVolume() {
    if (!this.isMounted) return;
    if (this.bgmInfo) {
      YoutubeManager.instance.setVolume(this.bgmInfo!.tag, this.volume);
    }
    this.volumeContainerElm.style.setProperty(
      "--volume-per",
      `${this.volume}%`
    );
  }

  @Watch("isMounted")
  @Watch("isMute")
  private onChangeIsPlay() {
    if (!this.isMounted) return;
    this.volumeContainerElm.style.setProperty(
      "--volume-color",
      this.isMute
        ? CssManager.getCss("--uni-color-orange")
        : CssManager.getCss("--uni-color-skyblue")
    );
  }

  @Watch("isMounted")
  @Watch("windowInfo.widthPx")
  private onChangeWindowWidth() {
    const fontSize = getCssPxNum("font-size", this.windowElm);
    const windowWidth = this.windowInfo.widthPx;
    const playerSize = YoutubeManager.playerElementSize;
    const ratio = (windowWidth - fontSize * 2) / playerSize.width;
    this.viewSizeRatio = ratio;
    this.windowInfo.heightPx = ratio * playerSize.height + fontSize * 2;
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
  display: grid;
  grid-template-rows: 1fr 2em;
  grid-template-columns: 1fr 2em;
  width: 100%;
  height: 100%;

  .youtube-container-outer {
    display: block;
    grid-row: 1 / 2;
    grid-column: 1 / 2;
    position: relative;
    overflow: hidden;

    .youtube-container-transform {
      display: block;
      transform: scale(var(--youtube-size-ratio));
      transform-origin: left top;

      &.isResizing {
        pointer-events: none;
      }
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

    > * {
      @include flex-box(row, center, center);
      flex: 1;
      font-size: 1.5em;
    }

    .icon-volume-high {
      background-color: var(--uni-color-skyblue);
    }

    .icon-volume-mute {
      background-color: var(--uni-color-orange);
    }
  }
}
</style>
