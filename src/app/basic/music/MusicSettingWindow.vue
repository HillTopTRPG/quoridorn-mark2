<template>
  <div>
    <div class="button-area">
      <ctrl-button @click="playMusic">送信</ctrl-button>
      <ctrl-button @click="preview">プレビュー</ctrl-button>
    </div>
    <div class="button-area">
      <ctrl-button @click="addMusic">追加</ctrl-button>
      <ctrl-button @click="editMusic">変更</ctrl-button>
      <ctrl-button @click="copyMusic">コピー</ctrl-button>
      <ctrl-button @click="deleteMusic">削除</ctrl-button>
    </div>

    <div>
      <div>{{ windowInfo.key }}</div>
      <input type="number" v-model.number="args" />
      <ctrl-button @click="clickButton">増殖</ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import CtrlButton from "@/app/basic/common/components/CtrlButton.vue";
import WindowManager from "@/app/core/window/WindowManager";
import WindowVue from "@/app/core/window/WindowVue";

@Component({
  components: { CtrlButton }
})
export default class MusicSettingWindow extends WindowVue<number> {
  private clickButton() {
    if (this.args === null) return;
    WindowManager.instance.open<number>("sample-window", this.args + 1);
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";
input {
  width: 2em;
}
</style>
