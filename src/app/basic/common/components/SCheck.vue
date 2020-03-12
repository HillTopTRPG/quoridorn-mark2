<template>
  <span
    class="simple-check"
    :class="[
      disabled ? 'disabled' : undefined,
      colorStyle,
      !value && !nIcon ? 'transparent' : undefined
    ]"
    :style="{
      width: !cLabel && !nLabel ? '2em' : `auto`,
      padding: !cLabel && !nLabel ? 0 : '0 0.5em'
    }"
    :tabindex="disabled ? undefined : '0'"
    @click="localValue = !localValue"
    @keydown.space.stop="localValue = !localValue"
    @keydown.enter.stop="localValue = !localValue"
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
import TabsComponent from "@/app/basic/common/components/tab-component/TabsComponent.vue";
import ComponentVue from "@/app/core/window/ComponentVue";

@Component({
  components: { TabsComponent }
})
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

  private get localValue(): boolean {
    return this.value;
  }

  private set localValue(value: boolean) {
    this.input(value);
  }

  private input(value: boolean) {
    this.$emit("input", value);
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.simple-check {
  @include flex-box(row, center, center);
  height: 2em;
  border: 1px dotted black;
  border-radius: 1em;
  box-sizing: border-box;
  cursor: pointer;
  background-color: white;

  &.disabled {
    cursor: not-allowed;
    background-color: var(--uni-color-light-gray);
  }

  &.transparent .icon {
    visibility: hidden;
  }

  &:not(.disabled).skyblue {
    @include btn-skyblue();
  }

  &:not(.disabled).pink {
    @include btn-pink();
  }
}
</style>
