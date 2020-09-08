<template>
  <ctrl-radio
    :optionInfoList="optionInfoList"
    name="importTypeRadio"
    v-model="localValue"
    :test="test"
  />
</template>

<script lang="ts">
import { Component, Prop, Emit } from "vue-property-decorator";
import CtrlRadio from "../../../../core/component/CtrlRadio.vue";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";
@Component({
  components: { CtrlRadio }
})
export default class ImportTypeRadio extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, default: "1" })
  public value!: string;

  @Prop({ type: Boolean, default: false })
  private test!: boolean;

  @Emit("input")
  public input(value: string | null) {}

  private get localValue(): string | null {
    if (this.test)
      console.log("set '" + this.value + "'", this.constructor.name);
    return this.value || "";
  }

  private set localValue(value: string | null) {
    if (this.test) console.log("return '" + value + "'", this.constructor.name);
    this.input(value);
  }

  private get optionInfoList() {
    return [
      {
        label: "上書き",
        value: "1"
      },
      {
        label: "追加",
        value: "2"
      }
    ];
  }
}
</script>
