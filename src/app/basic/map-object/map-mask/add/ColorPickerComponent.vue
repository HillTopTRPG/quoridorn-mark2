<template>
  <div class="color-picker-container" @contextmenu.prevent ref="elm">
    <input
      class="color-input"
      type="text"
      :value="localValue"
      @input="localValue = $event.target.value"
      @change="onChange()"
      @keydown.enter.stop
      @keyup.enter.stop
      @keydown.229.stop
      @keyup.229.stop
    />
    <base-input
      class="color-pick"
      type="color"
      :value="localValue"
      @input="localValue = $event.target.value"
    />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import { parseColor, zeroPadding } from "@/app/core/Utility";
import CssManager from "@/app/core/css/CssManager";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import VueEvent from "@/app/core/decorator/VueEvent";
import BaseInput from "@/app/core/component/BaseInput.vue";

@Component({
  components: { BaseInput, CtrlButton }
})
export default class ColorPickerComponent extends Vue {
  @Prop({ type: String, required: true })
  private value!: string;
  private firstValue: string | null = null;

  @Watch("value", { immediate: true })
  private onChangeValue() {
    if (this.firstValue === null) {
      this.firstValue = this.value;
    }
  }

  private get localValue(): string {
    return this.value;
  }

  private set localValue(colorStr: string) {
    this.input(colorStr);
  }

  public input(colorStr: string) {
    this.$emit("input", colorStr);
  }

  @VueEvent
  private onChange() {
    try {
      const colorObj = parseColor(this.localValue);
      setTimeout(() => {
        this.localValue = colorObj.getColorCode();
      });
    } catch (err) {
      window.console.warn(err);
      setTimeout(() => {
        this.localValue = this.firstValue || "";
      });
    }
  }

  @LifeCycle
  private mounted() {}

  private get elm(): HTMLDivElement {
    return this.$refs.elm as HTMLDivElement;
  }
}
</script>

<style scoped lang="scss">
@import "../../../../../assets/common";

.color-picker-container {
  @include flex-box(row, flex-start, center);

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
  }
}
</style>
