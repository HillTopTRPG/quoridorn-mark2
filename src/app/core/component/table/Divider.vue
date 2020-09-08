<template>
  <td
    class="divider"
    :class="{ disabled }"
    @dblclick.stop="doubleClick(index)"
    @mouseover="hoverDev(index)"
    @mouseout="hoverDev()"
    @mousedown="moveStart($event, index)"
    @touchstart="moveStart"
    @contextmenu.prevent
  ></td>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";

@Component
export default class Divider extends Mixins<ComponentVue>(ComponentVue) {
  @Prop({ type: Number, required: true })
  private index!: number;

  @Prop({ type: Boolean, required: false, default: false })
  private disabled!: boolean;

  hoverDev(index?: number): void {
    this.$emit("hover", index);
  }

  doubleClick(index: number): void {
    this.$emit("doubleClick", index);
  }

  moveStart(event: MouseEvent | TouchEvent, index: number) {
    this.$emit("moveStart", event, index);
  }
}
</script>

<style scoped lang="scss">
.divider {
  background-color: rgb(183, 186, 188);
  position: relative;
  padding: 0;
  width: 1px;
  min-width: 1px;

  &:not(.disabled) {
    cursor: col-resize;

    &:after {
      position: absolute;
      height: 100%;
      top: 0;
      left: -3px;
      content: "";
      width: 7px;
    }
  }
}
</style>
