<template>
  <label
    class="ctrl-button"
    :class="classes"
    :disabled="disabled"
    @contextmenu.prevent
  >
    <input
      type="button"
      :class="{ input: focusable }"
      :tabindex="focusable ? 0 : -1"
      ref="button"
      :disabled="disabled"
      @click.left.stop.prevent="buttonOnClickLeft"
      @click.right.stop.prevent="buttonOnClickRight"
      @dblclick.stop
      @keydown.enter.stop
      @keyup.enter.stop
      @keydown.229.stop
      @keyup.229.stop
    />
    <span class="front-area">
      <slot />
    </span>
    <span class="background-area"></span>
  </label>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import VueEvent from "@/app/core/decorator/VueEvent";

@Component
export default class CtrlButton extends Mixins<ComponentVue>(ComponentVue) {
  @Prop({ type: Boolean, default: false })
  private disabled!: boolean;

  @Prop({ type: Boolean, default: true })
  private focusable!: boolean;

  @Prop({ type: String, default: "" })
  private classes!: string;

  @VueEvent
  private buttonOnClickLeft(event: any) {
    this.$emit("click", event);
  }

  @VueEvent
  private buttonOnClickRight(event: any) {
    this.$emit("click-right", event);
  }

  @VueEvent
  public focus(): void {
    const button: HTMLInputElement = this.$refs.button as HTMLInputElement;
    button.focus();
  }
}
</script>

<style scoped lang="scss">
@import "Ctrl";

.ctrl-button {
  @include ctrl-button();
}
</style>
