<template>
  <div>
    <div class="button-area">
      <ctrl-button @click="playMusic">送信</ctrl-button>
      <ctrl-button @click="preview">プレビュー</ctrl-button>
    </div>

    <table-component
      :windowInfo="windowInfo"
      :tableIndex="0"
      :status="status"
      :dataList="bgmList"
    />

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
  private clickButton() {
    if (this.args === null) return;
    WindowManager.instance.open<number>("sample-window", this.args + 1);
  }

  private mounted() {
    window.console.log(this.windowInfo.key, "is mounted.");
  }
  private playMusic() {
    window.console.log("playMusic");
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
      isLinkage: true,
      tag: "bgm",
      type: "youtube",
      title: "ECHO",
      time: "8~",
      isRepeat: true,
      volume: 80,
      fade: "in"
    });
    list.push({
      isLinkage: true,
      tag: "bgm",
      type: "youtube",
      title: "ECHO",
      time: "8~",
      isRepeat: true,
      volume: 80,
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
