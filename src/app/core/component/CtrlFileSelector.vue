<template>
  <label
    class="ctrl-input-file-wrapper"
    :disabled="disabled"
    @contextmenu.prevent
  >
    <input
      type="file"
      class="input"
      :disabled="disabled"
      @change.stop.prevent="fileOnChange"
      multiple
      ref="input"
      @keydown.enter.stop
      @keyup.enter.stop
      @keydown.229.stop
      @keyup.229.stop
    />
    <span class="front-area"><slot /></span>
    <span class="background-area"></span>
  </label>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import VueEvent from "../decorator/VueEvent";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";

@Component({})
export default class CtrlFileSelector extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Boolean, default: false })
  private disabled!: boolean;

  @VueEvent
  public focus() {
    const input: HTMLInputElement = this.$refs.input as HTMLInputElement;
    input.focus();
  }

  @VueEvent
  private fileOnChange(event: any) {
    this.$emit("change", event);
  }
}
</script>

<style scoped lang="scss">
@import "Ctrl";

.ctrl-input-file-wrapper {
  @include ctrl-button();
}
</style>
