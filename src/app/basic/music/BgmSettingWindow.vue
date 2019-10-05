<template>
  <div>
    <div class="button-area">
      <ctrl-button @click="playBgm()">送信</ctrl-button>
      <ctrl-button @click="preview">プレビュー</ctrl-button>
    </div>

    <table-component
      :windowInfo="windowInfo"
      :tableIndex="0"
      :status="status"
      :dataList="bgmList"
      @selectLine="selectBgm"
      @doubleClick="playBgm"
    >
      <template #contents="{ colDec, data, index }">
        <template v-if="index === 0">
          {{ data.chatLinkage > 0 ? "あり" : "なし" }}
        </template>
        <template v-else-if="index === 2">
          <i class="icon-stop2" v-if="!data.url"></i>
          <i class="icon-youtube2" v-else-if="isYoutube(data.url)"></i>
          <i class="icon-dropbox" v-else-if="isDropBox(data.url)"></i>
          <i class="icon-file-music" v-else></i>
        </template>
        <template v-else-if="index === 4">
          {{ data.url ? convertSecond(data.start, data.end) : "-" }}
        </template>
        <template v-else-if="index === 5">
          <i class="icon-loop" v-if="data.url && data.isLoop"></i>
          {{ data.url && data.isLoop ? "" : "-" }}
        </template>
        <template v-else-if="index === 6">
          {{ data.url ? data.volume * 100 : "-" }}
        </template>
        <template v-else-if="index === 7">
          {{ data.url ? fadeStr(data) : "-" }}
        </template>
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
import { Component } from "vue-property-decorator";
import CtrlButton from "@/app/basic/common/components/CtrlButton.vue";
import WindowManager from "@/app/core/window/WindowManager";
import WindowVue from "@/app/core/window/WindowVue";
import TableComponent from "@/app/core/component/table/TableComponent.vue";

@Component({
  components: { TableComponent, CtrlButton }
})
export default class BgmSettingWindow extends WindowVue<number> {
  private selectedBgmKey: string | null = null;

  private selectBgm(bgmKey: string) {
    this.selectedBgmKey = bgmKey;
  }

  private playBgm(bgmKey?: string) {
    const useBgmKey = bgmKey || this.selectedBgmKey;
    window.console.log(useBgmKey);
  }

  private clickButton() {
    if (this.args === null) return;
    WindowManager.instance.open<number>("sample-window", this.args + 1);
  }

  private isYoutube(url: string) {
    return /www\.youtube\.com/.test(url);
  }

  private isDropBox(url: string) {
    return /dropbox/.test(url);
  }

  private get convertSecond(): (start: number, end: number) => string {
    return (start: number, end: number): string => {
      if (start && end) return `${start}〜${end}`;
      if (start) return `${start}〜`;
      if (end) return `〜${end}`;
      return "All";
    };
  }
  private get fadeStr(): (bgmObj: any) => string {
    return (bgmObj: any): string => {
      if (bgmObj.fadeIn > 0 && bgmObj.fadeOut > 0) return "in/out";
      if (bgmObj.fadeIn > 0 && bgmObj.fadeOut === 0) return "in";
      if (bgmObj.fadeIn === 0 && bgmObj.fadeOut > 0) return "out";
      return "-";
    };
  }

  private mounted() {
    window.console.log(this.windowInfo.key, "is mounted.");
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
    const list = [];
    list.push({
      key: "bgm-0",
      isLinkage: true,
      tag: "bgm",
      type: "youtube",
      title: "ECHO",
      url: "https://www.youtube.com/watch?v=nq3YnT0km2o&t=15s",
      time: "8~",
      isLoop: true,
      volume: 0.8,
      fade: "in"
    });
    list.push({
      key: "bgm-1",
      isLinkage: true,
      tag: "bgm",
      type: "youtube",
      title: "ECHO",
      time: "8~",
      isLoop: true,
      volume: 0.8,
      fade: "in"
    });
    list.push({
      key: "bgm-2",
      isLinkage: true,
      tag: "bgm",
      type: "youtube",
      title: "ECHO",
      time: "8~",
      isLoop: true,
      volume: 0.8,
      fade: "in"
    });
    list.push({
      key: "bgm-3",
      isLinkage: true,
      tag: "bgm",
      type: "youtube",
      title: "ECHO",
      time: "8~",
      isLoop: true,
      volume: 0.8,
      fade: "in"
    });
    return list;
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";
input {
  width: 2em;
}
</style>
