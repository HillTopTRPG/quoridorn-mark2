<template>
  <div class="ctrl-radio">
    <label v-for="optionInfo in optionInfoList" :key="optionInfo.key">
      <input
        type="radio"
        class="input"
        :name="name"
        :value="optionInfo.value"
        v-model="localValue"
        @keydown.enter.stop
        @keyup.enter.stop
        ref="component"
        :disabled="disabled || readonly || optionInfo.disabled"
      />
      {{ optionInfo.text }}
    </label>
  </div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { HtmlOptionInfo } from "@/@types/window";
import VueEvent from "../decorator/VueEvent";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";

@Component
export default class CtrlRadio extends Mixins<ComponentVue>(ComponentVue) {
  @Prop({ type: Array, required: true })
  protected optionInfoList!: HtmlOptionInfo[];

  @Prop({ type: String, required: true })
  protected name!: string;

  @Prop({ type: String, default: "1" })
  public value!: string;

  @Prop({ type: Boolean, default: false })
  public disabled!: boolean;

  @Prop({ type: Boolean, default: false })
  public readonly!: boolean;

  @Prop({ type: Boolean, default: false })
  private test!: boolean;

  @VueEvent
  public input(value: string | null) {
    this.$emit("input", value);
  }

  private get localValue(): string | null {
    if (this.test)
      console.log("set '" + this.value + "'", this.constructor.name);
    return this.value || "";
  }

  private set localValue(value: string | null) {
    if (this.test) console.log("return '" + value + "'", this.constructor.name);
    this.input(value);
  }

  public focus(): void {
    const elm: HTMLElement = this.$refs.component as HTMLElement;
    elm.focus();
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.ctrl-radio {
  @include flex-box(row, flex-start, center);

  label {
    @include flex-box(row, flex-start, center);
    height: 2em;

    &:not(:first-child) {
      margin-left: 0.5rem;
    }
  }
}
</style>
