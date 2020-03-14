<template>
  <label class="color-picker-container" @contextmenu.prevent ref="elm">
    <input
      :id="id"
      class="input color-input"
      type="text"
      :value="colorCode"
      @input="colorCode = $event.target.value"
      @change="onChange()"
      :disabled="disabled"
      :readonly="readonly"
      @keydown.enter.stop
      @keyup.enter.stop
      @keydown.229.stop
      @keyup.229.stop
    />
    <base-input
      class="color-pick"
      type="color"
      :value="colorCode"
      @change="
        colorCode = $event.target.value;
        onChange();
      "
      :disabled="disabled || readonly"
    />
    <input
      class="input value-alpha"
      v-if="useAlpha"
      type="range"
      min="0"
      max="1"
      step="0.1"
      :value="alpha"
      @input="alpha = $event.target.valueAsNumber"
      :disabled="disabled"
      :readonly="readonly"
      @keydown.enter.stop
      @keyup.enter.stop
      @keydown.229.stop
      @keyup.229.stop
    />
  </label>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { parseColor } from "../Utility";
import LifeCycle from "../decorator/LifeCycle";
import VueEvent from "../decorator/VueEvent";
import BaseInput from "@/app/core/component/BaseInput.vue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";

@Component({
  components: { BaseInput, CtrlButton }
})
export default class ColorPickerComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private value!: string;

  @Prop({ type: String, default: null })
  private id!: string | null;

  @Prop({ type: Boolean, required: true })
  private useAlpha!: boolean;

  @Prop({ type: Boolean, default: false })
  private disabled!: boolean;

  @Prop({ type: Boolean, default: false })
  private readonly!: boolean;

  private firstValue: string | null = null;

  private isMounted: boolean = false;
  private colorCode: string | null = null;
  private alpha: number | null = null;

  @LifeCycle
  private created() {
    this.updateColor();
  }

  @LifeCycle
  private mounted() {
    this.isMounted = true;
  }

  @Watch("value", { immediate: true })
  private onChangeValue() {
    if (this.firstValue === null) {
      this.firstValue = this.value;
    }
    this.updateColor();
  }

  private updateColor() {
    const colorObj = parseColor(this.value);
    this.colorCode = colorObj.getColorCode();
    this.alpha = this.useAlpha ? colorObj.a : 1;
  }

  private get localValue(): string {
    const colorObj = parseColor(this.colorCode!);
    colorObj.a = this.alpha;
    return this.useAlpha ? colorObj.getRGBA() : colorObj.getColorCode();
  }

  private set localValue(colorStr: string) {
    this.input(colorStr);
  }

  @Watch("isMounted")
  @Watch("alpha")
  private onChangeColor() {
    if (!this.isMounted) return;
    this.input(this.localValue);
  }

  public input(colorStr: string) {
    this.$emit("input", colorStr);
  }

  @VueEvent
  private onChange() {
    try {
      this.changeColorCode(this.colorCode!);
    } catch (err) {
      this.changeColorCode(this.firstValue!);
    }
  }

  private changeColorCode(colorCode: string) {
    const colorObj = parseColor(colorCode);
    if (!colorCode.trim().startsWith("rgba")) colorObj.a = this.alpha;
    setTimeout(() => {
      this.colorCode = colorObj.getColorCode();
      if (!colorCode.trim().startsWith("rgba")) this.alpha = colorObj.a;
      this.input(this.localValue);
    });
  }

  private get elm(): HTMLDivElement {
    return this.$refs.elm as HTMLDivElement;
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

input {
  font-size: 1em;
  margin: 0;

  &:disabled,
  &:read-only {
    background-color: lightgray;
  }
}

.color-picker-container {
  @include inline-flex-box(row, flex-start, center, wrap);

  .color-input {
    width: 5em;
    height: 2em;
    font-size: inherit;
    box-sizing: border-box;

    &:read-only {
      outline: none;
    }
  }

  .color-pick {
    width: 2em;
    height: 2em;
    cursor: pointer;
  }

  .value-alpha {
    transform: rotate(180deg);
    transform-origin: center;
    width: 10em;
    cursor: pointer;
  }
}
</style>
