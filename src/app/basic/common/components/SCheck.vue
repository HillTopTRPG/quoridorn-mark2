<template>
  <span
    class="simple-check"
    :class="[
      value ? 'checked' : undefined,
      disabled ? 'disabled' : undefined,
      readonly ? 'readonly' : undefined,
      colorStyle,
      !value && !nIcon ? 'transparent' : undefined
    ]"
    :style="{
      width: !cLabel && !nLabel ? '2em' : `auto`,
      padding: !cLabel && !nLabel ? 0 : '0 0.5em'
    }"
    :tabindex="disabled || readonly ? undefined : '0'"
    @click="onClick()"
    @keydown.space.stop="onClick()"
    @keydown.enter.stop="onClick()"
    @mouseenter="$emit('hover', true)"
    @mouseleave="$emit('hover', false)"
    @keydown.229.stop
    @keyup.229.stop
  >
    <span v-if="!iconBefore">{{ value ? cLabel : nLabel }}</span>
    <span class="icon" :class="`icon-${value ? cIcon : nIcon || cIcon}`"></span>
    <span v-if="iconBefore">{{ value ? cLabel : nLabel }}</span>
  </span>
</template>

<script lang="ts">
import { Prop } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";

@Component
export default class SCheck extends Mixins<ComponentVue>(ComponentVue) {
  @Prop({ type: Boolean, required: true })
  private value!: boolean;

  @Prop({ type: Boolean, default: false })
  private iconBefore!: boolean;

  @Prop({ type: String, default: "skyblue" })
  private colorStyle!: string;

  @Prop({ type: String, required: true })
  private cIcon!: string;

  @Prop({ type: String, required: true })
  private cLabel!: string;

  @Prop({ type: String, required: true })
  private nIcon!: string;

  @Prop({ type: String, required: true })
  private nLabel!: string;

  @Prop({ type: Boolean, default: false })
  private disabled!: boolean;

  @Prop({ type: Boolean, default: false })
  private readonly!: boolean;

  private get localValue(): boolean {
    return this.value;
  }

  private set localValue(value: boolean) {
    this.input(value);
  }

  private input(value: boolean) {
    this.$emit("input", value);
  }

  private onClick() {
    if (this.disabled || this.readonly) return;
    this.localValue = !this.localValue;
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.simple-check {
  @include inline-flex-box(row, center, center);
  height: 2em;
  border: 1px dotted black;
  border-radius: 1em;
  box-sizing: border-box;
  background-color: white;

  &.transparent .icon {
    visibility: hidden;
  }

  &.skyblue {
    @include btn-skyblue();
  }

  &.pink {
    @include btn-pink();
  }
}
</style>
