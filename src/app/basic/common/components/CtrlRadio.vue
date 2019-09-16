<template>
  <div>
    <label v-for="(optionInfo, index) in optionInfoList" :key="index">
      <input
        type="radio"
        :name="name"
        :value="optionInfo.value"
        v-model="localValue"
        @keydown.enter.stop
        @keyup.enter.stop
      />
      {{ optionInfo.text }}
    </label>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit } from "vue-property-decorator";

@Component
export default class CtrlRadio extends Vue {
  @Prop({ type: Array, required: true })
  protected optionInfoList!: any[];

  @Prop({ type: String, required: true })
  protected name!: string;

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
}
</script>
