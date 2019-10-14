<template>
  <div>
    <div>{{ windowInfo.key }}</div>
    <input type="number" v-model.number="windowInfo.args" />
    <ctrl-button @click="clickButton">増殖</ctrl-button>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import WindowManager from "@/app/core/window/WindowManager";
import WindowVue from "@/app/core/window/WindowVue";
import { Mixins } from "vue-mixin-decorator";

@Component({
  components: { CtrlButton }
})
export default class SampleWindow extends Mixins<WindowVue<number>>(WindowVue) {
  private clickButton() {
    if (this.windowInfo.args === null) return;
    WindowManager.instance.open<number>({
      type: "sample-window",
      args: this.windowInfo.args! + 1
    });
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";
input {
  width: 2em;
}
</style>
