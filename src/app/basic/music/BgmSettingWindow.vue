<template>
  <div>
    <div class="button-area">
      <ctrl-button @click="playBgm()">送信</ctrl-button>
      <ctrl-button @click="preview" class="margin-left-auto"
        >プレビュー</ctrl-button
      >
    </div>

    <table-component
      :windowInfo="windowInfo"
      :tableIndex="0"
      :status="status"
      :dataList="bgmList"
      @selectLine="selectBgm"
      @doubleClick="playBgm"
      @adjustWidth="adjustWidth"
    >
      <template #contents="{ colDec, data, index }">
        <template v-if="index === 0">{{ data | chatLinkage }}</template>
        <template v-else-if="index === 2">
          <i :class="data | icon"></i>
        </template>
        <template v-else-if="index === 4">{{ data | time }}</template>
        <template v-else-if="index === 5">
          <i class="icon-loop" v-if="data.url && data.isLoop"></i>
          {{ data | isLoop }}
        </template>
        <template v-else-if="index === 6">{{ data | volume }}</template>
        <template v-else-if="index === 7">{{ data | fade }}</template>
        <template v-else>
          {{ data[colDec.target] }}
        </template>
      </template>
    </table-component>

    <div class="button-area">
      <ctrl-button @click="addMusic">追加</ctrl-button>
      <ctrl-button @click="editMusic">変更</ctrl-button>
      <ctrl-button @click="copyMusic">コピー</ctrl-button>
      <ctrl-button @click="deleteMusic">削除</ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit } from "vue-property-decorator";
import CtrlButton from "@/app/basic/common/components/CtrlButton.vue";
import WindowVue from "@/app/core/window/WindowVue";
import TableComponent from "@/app/core/component/table/TableComponent.vue";
import BgmManager from "@/app/basic/music/BgmManager";
import WindowManager from "@/app/core/window/WindowManager";
import TaskManager from "@/app/core/task/TaskManager";
import { WindowOpenInfo } from "@/@types/window";
import YoutubeManager from "@/app/basic/music/YoutubeManager";

@Component({
  components: { TableComponent, CtrlButton },
  filters: {
    chatLinkage: (data: BgmInfo) => (data.chatLinkage > 0 ? "あり" : "なし"),
    icon: (data: BgmInfo) => {
      if (!data.url) return "icon-stop2";
      if (BgmManager.isYoutube(data)) return "icon-youtube2";
      if (BgmManager.isDropbox(data)) return "icon-dropbox";
      return "icon-file-music";
    },
    time: (data: BgmInfo) => {
      if (!data.url) return "-";
      if (data.start && data.end) return `${data.start}〜${data.end}`;
      if (data.start) return `${data.start}〜`;
      if (data.end) return `〜${data.end}`;
      return "All";
    },
    isLoop: (data: BgmInfo) => (data.url && data.isLoop ? "" : "-"),
    volume: (data: BgmInfo) => (data.url ? data.volume * 100 : "-"),
    fade: (data: BgmInfo) => {
      if (!data.url) return "-";
      if (data.fadeIn > 0 && data.fadeOut > 0) return "in/out";
      if (data.fadeIn > 0 && data.fadeOut === 0) return "in";
      if (data.fadeIn === 0 && data.fadeOut > 0) return "out";
      return "-";
    }
  }
})
export default class BgmSettingWindow extends WindowVue<number> {
  private selectedBgmKey: string | null = null;

  private selectBgm(bgmKey: string) {
    this.selectedBgmKey = bgmKey;
  }

  private async playBgm(bgmKey?: string) {
    const useBgmKey = bgmKey || this.selectedBgmKey;
    if (!useBgmKey) return;
    const info = BgmManager.instance.getBgmInfo(useBgmKey);

    if (BgmManager.isYoutube(info)) {
      const youtubeInfo = YoutubeManager.instance.getPlayerInfo(info.tag);
      if (youtubeInfo) {
        const windowKey = youtubeInfo.elementId
          .replace("-youtube", "")
          .replace(/(-window)|(-right-pane)|(-left-pane)/, "");
        const windowInfo = WindowManager.instance.getWindowInfo(windowKey);
        windowInfo.args = useBgmKey;
      } else {
        TaskManager.instance.ignition<WindowOpenInfo<string>>({
          type: "window-open",
          owner: "Quoridorn",
          value: {
            type: "play-youtube-window",
            args: useBgmKey
          }
        });
      }
    }
  }

  @Emit("adjustWidth")
  private adjustWidth(totalWidth: number) {
    if (this.windowInfo.declare.minSize)
      this.windowInfo.declare.minSize.width = totalWidth;
    if (this.windowInfo.declare.maxSize)
      this.windowInfo.declare.maxSize.width = totalWidth;
  }

  private mounted() {
    // mounted
  }

  private preview() {
    window.console.log("preview");
  }

  private addMusic() {
    window.console.log("addMusic");
  }

  private editMusic() {
    window.console.log("editMusic");
  }

  private copyMusic() {
    window.console.log("copyMusic");
  }

  private deleteMusic() {
    window.console.log("deleteMusic");
  }

  private get bgmList(): any[] {
    return BgmManager.instance.bgmList;
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";
.button-area {
  @include flex-box(row, flex-start, center);

  .margin-left-auto {
    margin-left: auto;
  }
}
</style>
