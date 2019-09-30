<template>
  <div>
    <div>{{ windowInfo.key }}</div>
    <input type="number" v-model.number="num" />
    <ctrl-button @click="clickButton">増殖</ctrl-button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import CtrlButton from "@/app/basic/common/components/CtrlButton.vue";
import WindowManager from "@/app/basic/common/window/WindowManager";

@Component({
  components: { CtrlButton }
})
export default class SampleWindow extends Vue {
  @Prop({ type: String, required: true })
  private windowKey!: string;

  private num: number = -1;

  @Watch("num")
  onChangeNum(num: number) {
    this.windowInfo.args = num;
  }

  @Watch("windowInfo.args", { immediate: true })
  onChangeArgs(num: number) {
    this.num = num;
  }

  private get windowInfo() {
    return WindowManager.instance.getWindowInfo<number>(this.windowKey);
  }

  private clickButton() {
    WindowManager.instance.open<number>("sample-window", this.num + 1);
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";
input {
  width: 2em;
}
</style>
