<template>
  <window-frame :windowInfo="windowInfo">
    <div>Hello world.</div>
    <ctrl-button @click="clickButton">増殖</ctrl-button>
  </window-frame>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { WindowInfo } from "@/@types/window";
import WindowFrame from "@/app/basic/common/window/WindowFrame.vue";
import CtrlButton from "@/app/basic/common/components/CtrlButton.vue";
import WindowManager from "@/app/core/window/WindowManager";

@Component({
  components: { CtrlButton, WindowFrame }
})
export default class TestWindow extends Vue {
  @Prop({ type: Object, required: true })
  private windowInfo!: WindowInfo;

  private clickButton() {
    WindowManager.instance.resistWindowOpenTask("test-window");
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";
</style>
