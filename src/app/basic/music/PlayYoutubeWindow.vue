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
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import WindowVue from "@/app/core/window/WindowVue";
import YoutubeManager, {
  YoutubeEventHandler
} from "@/app/basic/music/YoutubeManager";
import BgmManager from "@/app/basic/music/BgmManager";
import { getUrlParam } from "@/app/core/Utility";
import SeekBarComponent from "@/app/basic/music/SeekBarComponent.vue";
import { Mixins } from "vue-mixin-decorator";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import VueEvent from "@/app/core/decorator/VueEvent";
import LanguageManager from "@/LanguageManager";

@Component({
  components: { SeekBarComponent, CtrlButton }
})
export default class PlayYoutubeWindow
  extends Mixins<WindowVue<string, never>>(WindowVue)
  implements YoutubeEventHandler {
  private bgmInfo: BgmInfo | null = null;

  @Watch("windowInfo.args", { immediate: true })
  onChangeBgmInfo() {
    if (!this.windowInfo.args) {
      if (this.bgmInfo) YoutubeManager.instance.destroyed(this.bgmInfo.tag);
      return;
    }
    this.bgmInfo = BgmManager.instance.getBgmInfo(this.windowInfo.args);
    window.console.log("playMusic:", this.windowInfo.args);
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
  public async mounted() {
    await this.init();
    this.isMounted = true;
    if (this.windowInfo.status !== this.status) return;
    const player = YoutubeManager.instance.getPlayerInfo(this.bgmInfo!.tag);
    if (player) return;
    setTimeout(() => {
      YoutubeManager.instance.open(this.youtubeElementId, this.bgmInfo!, this);
    });
  }

  @LifeCycle
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
    const windowTitle = LanguageManager.instance.getText(
      `${this.windowInfo.type}.window-title`
    );
    window.console.log("onPlaying", windowTitle);
    this.windowInfo.title = `${windowTitle}(${this.bgmInfo!.tag})`;
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

  @VueEvent
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
  @Watch("windowInfo.widthPx")
  private onChangeWindowWidth() {
    const windowWidth = this.windowInfo.widthPx;
    const playerSize = YoutubeManager.playerElementSize;
    const ratio = windowWidth / playerSize.width;
    this.viewSizeRatio = ratio;
    this.windowInfo.heightPx = ratio * playerSize.height + 16;
    this.windowElm.style.setProperty("--youtube-size-ratio", ratio.toString());
  }

  @Watch("windowInfo.heightPx")
  private onChangeWindowHeight() {
    const windowHeight = this.windowInfo.heightPx;
    const playerSize = YoutubeManager.playerElementSize;
    const ratio = (windowHeight - 16) / playerSize.height;
    this.viewSizeRatio = ratio;
    this.windowInfo.widthPx = ratio * playerSize.width;
    this.windowElm.style.setProperty("--youtube-size-ratio", ratio.toString());
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";
.container {
  display: inline-block;
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
