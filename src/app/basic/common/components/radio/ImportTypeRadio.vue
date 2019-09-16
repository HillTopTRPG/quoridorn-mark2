<template>
  <ctrl-radio
    :optionInfoList="optionInfoList"
    name="importTypeRadio"
    v-model="localValue"
    :test="test"
  />
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit } from "vue-property-decorator";
import CtrlRadio from "../CtrlRadio.vue";
@Component({
  components: { CtrlRadio }
})
export default class ImportTypeRadio extends Vue {
  @Prop({ type: String, default: "1" })
  public value!: string;

  @Prop({ type: Boolean, default: false })
  private test!: boolean;

  @Emit("input")
  public input(value: string | null) {}

  private get localValue(): string | null {
    if (this.test)
      window.console.log("set '" + this.value + "'", this.constructor.name);
    return this.value || "";
  }

  private set localValue(value: string | null) {
    if (this.test)
      window.console.log("return '" + value + "'", this.constructor.name);
    this.input(value);
  }

  private get optionInfoList() {
    return [
      {
        text: "上書き",
        value: "1"
      },
      {
        text: "追加",
        value: "2"
      }
    ];
  }
}
</script>
