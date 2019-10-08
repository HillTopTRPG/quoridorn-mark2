<template>
  <div class="container">
    <div :id="youtubeElementId" class="youtube"></div>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import CtrlButton from "@/app/basic/common/components/CtrlButton.vue";
import WindowVue from "@/app/core/window/WindowVue";
import YoutubeManager, {
  YoutubeEventHandler
} from "@/app/basic/music/YoutubeManager";
import BgmManager from "@/app/basic/music/BgmManager";

@Component({
  components: { CtrlButton }
})
export default class PlayYoutubeWindow extends WindowVue<string>
  implements YoutubeEventHandler {
  private get bgmInfo() {
    return BgmManager.instance.getBgmInfo(this.args!);
  }

  private get youtubeElementId() {
    return `${this.windowKey}-${this.status}-youtube`;
  }

  private mounted() {
    if (this.windowInfo.status !== this.status) return;
    const player = YoutubeManager.instance.getPlayerInfo(this.bgmInfo.tag);
    if (player) return;
    setTimeout(() => {
      YoutubeManager.instance.open(this.youtubeElementId, this.bgmInfo, this);
    });
  }

  private destroyed() {
    YoutubeManager.instance.destroyed(this.bgmInfo.tag);
  }

  public onReady(): void {
    window.console.log("youtube ready");
    YoutubeManager.instance.loadVideoById(this.bgmInfo);
    this.windowInfo.message = this.bgmInfo.tag;
  }

  public onError(error: any): void {
    window.console.error(error);
  }

  public onPaused(): void {
    window.console.log("onPaused");
  }

  public onPlaying(duration: number): void {
    // window.console.log("onPlaying", duration);
  }

  public onReject(): void {
    window.console.log("onReject");
  }

  public timeUpdate(time: number): void {
    // window.console.log("timeUpdate", time);
  }

  public onEnded(): void {
    window.console.log("onEnded");
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";
.container {
  width: 100%;
  height: 100%;

  .youtube {
    width: 100%;
    height: 100%;
  }
}
</style>
