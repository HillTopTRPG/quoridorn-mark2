<template>
  <div>
    <div class="button-area">
      <ctrl-button @click="playBgm()">送信</ctrl-button>
      <ctrl-button @click="preview" class="margin-left-auto"
        >プレビュー</ctrl-button
      >
    </div>

    <div :id="'youtube-window-' + windowKey" class="unUse">
      <div :id="'youtube-window-' + windowKey + '-player'"></div>
    </div>

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
import WindowVue from "@/app/core/window/WindowVue";

@Component({
  components: { CtrlButton }
})
export default class PlayYoutubeWindow extends WindowVue<string> {}
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
