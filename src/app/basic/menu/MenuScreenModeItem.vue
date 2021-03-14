<template>
  <div
    class="item"
    :class="{ disabled: localValue === labelMode }"
    @click="itemOnClick"
  >
    <span v-t="`selection.screen-mode.${labelMode}`"></span>
  </div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";
import VueEvent from "@/app/core/decorator/VueEvent";
import { ModeInfo, ScreenModeType } from "mode";
import TaskManager from "@/app/core/task/TaskManager";

@Component
export default class MenuScreenModeItem extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, default: "" })
  public labelMode!: ScreenModeType;

  @Prop({ type: String, default: "" })
  public value!: ScreenModeType;

  public get localValue(): ScreenModeType {
    return this.value;
  }

  public set localValue(value: ScreenModeType) {
    this.input(value);
  }

  public async input(value: ScreenModeType) {
    this.$emit("input", value);
    await TaskManager.instance.ignition<ModeInfo, never>({
      type: "mode-change",
      owner: "Quoridorn",
      value: { type: "screen-mode", value }
    });
  }

  @VueEvent
  private itemOnClick(event: MouseEvent) {
    if (this.localValue !== this.labelMode) {
      this.localValue = this.labelMode;
      this.$emit("click");
    } else {
      event.preventDefault();
    }
  }
}
</script>
