<template>
  <div>
    <div>Hello world.</div>
    <ctrl-button @click="clickButton">増殖</ctrl-button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import CtrlButton from "@/app/basic/common/components/CtrlButton.vue";
import WindowManager from "@/app/core/window/WindowManager";

@Component({
  components: { CtrlButton }
})
export default class TestWindow extends Vue {
  @Prop({ type: String, required: true })
  private windowKey!: string;

  private clickButton() {
    WindowManager.instance.open<never>({ type: "test-window" });
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";
</style>
