<template>
  <div class="container" ref="window">
    <div class="youtube-container-outer" v-if="status === 'window'">
      <div class="youtube-container-transform" :class="{ isResizing }">
        <div :id="youtubeElementId" class="youtube"></div>
      </div>
    </div>
    <div v-else>
      <img
        v-img="thumbnailData"
        draggable="false"
        alt="Not Found"
        :title="thumbnailText"
        @click="thumbnailClick"
      />
    </div>
    <seek-bar-component :bgmInfo="bgmInfo" @seekTo="seekTo" />
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import CtrlButton from "@/app/basic/common/components/CtrlButton.vue";
import WindowVue from "@/app/core/window/WindowVue";
import YoutubeManager, {
  YoutubeEventHandler
} from "@/app/basic/music/YoutubeManager";
import BgmManager from "@/app/basic/music/BgmManager";
import WindowFrame from "@/app/core/window/WindowFrame.vue";
import { getUrlParam } from "@/app/core/Utility";
import SeekBarComponent from "@/app/basic/music/SeekBarComponent.vue";

@Component({
  components: { SeekBarComponent, CtrlButton }
})
export default class PlayYoutubeWindow extends WindowVue<string>
  implements YoutubeEventHandler {
  private bgmInfo: BgmInfo | null = null;

  @Watch("windowInfo.args", { immediate: true })
  onChangeBgmInfo() {
    this.bgmInfo = BgmManager.instance.getBgmInfo(this.args);
    window.console.log("playMusic:", this.args);
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

  private thumbnailClick(): void {
    window.open(this.bgmInfo!.url, "_blank");
  }

  private isMounted: boolean = false;
  private viewSizeRatio: number = 1;
  private thumbnailData: string = "";
  private thumbnailText: string = "";

  private mounted() {
    this.isMounted = true;
    if (this.windowInfo.status !== this.status) return;
    const player = YoutubeManager.instance.getPlayerInfo(this.bgmInfo!.tag);
    if (player) return;
    setTimeout(() => {
      YoutubeManager.instance.open(this.youtubeElementId, this.bgmInfo!, this);
    });
  }

  private destroyed() {
    YoutubeManager.instance.destroyed(this.bgmInfo!.tag);
  }

  public onReady(): void {
    window.console.log("youtube ready");
    YoutubeManager.instance.loadVideoById(this.bgmInfo!);
  }

  public onError(error: any): void {
    window.console.error(error);
  }

  public onPaused(): void {
    window.console.log("onPaused");
  }

  public onPlaying(duration: number): void {
    window.console.log("onPlaying", duration);
    this.windowInfo.title = `${this.windowInfo.declare.title}(${
      this.bgmInfo!.tag
    })`;
    this.windowInfo.message = this.bgmInfo!.title;
    this.bgmInfo!.duration = duration;
    this.bgmInfo!.isPlay = true;
  }

  public onReject(): void {
    window.console.log("onReject");
  }

  public timeUpdate(time: number): void {
    this.bgmInfo!.seek = time;
  }

  public onEnded(): void {
    window.console.log("onEnded");
    if (this.bgmInfo!.isLoop) {
      YoutubeManager.instance.seekTo(
        this.bgmInfo!.tag,
        this.bgmInfo!.start,
        true
      );
    }
  }

  private seekTo(seek: number, allowSeekAhead: boolean) {
    YoutubeManager.instance.seekTo(this.bgmInfo!.tag, seek, allowSeekAhead);
    if (allowSeekAhead) {
      YoutubeManager.instance.play(this.bgmInfo!.tag);
    }
  }

  private get windowElm(): HTMLDivElement {
    return this.$refs.window as HTMLDivElement;
  }

  @Watch("isMounted")
  @Watch("windowInfo.width")
  private onChangeWindowWidth() {
    const windowWidth = this.windowInfo.width;
    const playerSize = YoutubeManager.playerElementSize;
    const ratio = windowWidth / playerSize.width;
    this.viewSizeRatio = ratio;
    this.windowInfo.height = ratio * playerSize.height + 16;
    this.windowElm.style.setProperty("--youtube-size-ratio", ratio.toString());
  }

  @Watch("windowInfo.height")
  private onChangeWindowHeight() {
    const windowHeight = this.windowInfo.height;
    const playerSize = YoutubeManager.playerElementSize;
    const ratio = (windowHeight - 16) / playerSize.height;
    this.viewSizeRatio = ratio;
    this.windowInfo.width = ratio * playerSize.width;
    this.windowElm.style.setProperty("--youtube-size-ratio", ratio.toString());
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";
.container {
  width: 100%;
  height: 100%;

  .youtube-container-outer {
    display: block;
    width: 100%;
    height: calc(100% - 16px);
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
}
</style>
