<template>
  <component class="range-component" v-bind:is="tag">
    <input
      :id="elmId"
      type="number"
      class="raw-input"
      :min="min"
      :max="max"
      :step="step"
      :style="{ width: rawWidth + 'em' }"
      :disabled="disabled"
      :readonly="readonly"
      :tabindex="disabled || readonly ? -1 : 0"
      :value="localValue"
      @input="localValue = $event.target.valueAsNumber"
      @keydown.enter.prevent.stop
      @keyup.enter.prevent.stop
      @keydown.229.prevent.stop
      @keyup.229.prevent.stop
    />
    <input
      type="range"
      class="slider-input"
      :min="min"
      :max="max"
      :step="step"
      :style="{ width: sliderWidth + 'em' }"
      :disabled="disabled || readonly"
      :tabindex="disabled || readonly ? -1 : 0"
      :value="localValue"
      @input="localValue = $event.target.valueAsNumber"
      @keydown.enter.prevent.stop
      @keyup.enter.prevent.stop
      @keydown.229.prevent.stop
      @keyup.229.prevent.stop
    />
  </component>
</template>

<script lang="ts">
import { Prop } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";
import ComponentVue from "../../../core/window/ComponentVue";

@Component
export default class RangeComponent extends Mixins<ComponentVue>(ComponentVue) {
  @Prop({ type: String, default: "div" })
  private tag!: string;

  @Prop({ type: String, default: null })
  public elmId!: string | null;

  @Prop({ type: Number, default: 3 })
  private rawWidth!: number;

  @Prop({ type: Number, default: 10 })
  private sliderWidth!: number;

  @Prop({ type: Number, default: null })
  private min!: number | null;

  @Prop({ type: Number, default: 1 })
  private step!: number;

  @Prop({ type: Number, default: null })
  private max!: number | null;

  @Prop({ type: Number, required: true })
  private value!: number;

  @Prop({ type: Boolean, default: false })
  private disabled!: boolean;

  @Prop({ type: Boolean, default: false })
  private readonly!: boolean;

  private input(value: number) {
    this.$emit("input", value);
  }

  public get localValue(): number {
    return this.value;
  }
  public set localValue(value: number) {
    this.input(value);
  }
}
</script>

<style scoped lang="scss">
.range-component {
  display: contents;
}

input {
  height: 2em;
  margin: 0;
  font-size: inherit;
  vertical-align: middle;
  box-sizing: border-box;

  &:disabled,
  &:read-only {
    background-color: lightgray;
  }
}
</style>
