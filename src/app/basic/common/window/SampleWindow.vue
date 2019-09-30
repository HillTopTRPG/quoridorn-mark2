<template>
  <div>
    <div>{{ windowInfo.key }}</div>
    <input type="number" v-model.number="args" />
    <ctrl-button @click="clickButton">増殖</ctrl-button>
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
export default class SampleWindow extends WindowVue<number> {
  private clickButton() {
    WindowManager.instance.open<number>("sample-window", this.args + 1);
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";
input {
  width: 2em;
}
</style>
