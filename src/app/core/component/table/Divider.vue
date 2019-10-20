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
import { Component, Emit, Prop, Vue } from "vue-property-decorator";
import { Action } from "vuex-class";
import TaskManager, { MouseMoveParam } from "@/app/core/task/TaskManager";

@Component
export default class Divider extends Vue {
  @Prop({ type: Number, required: true })
  private index!: number;

  @Prop({ type: Boolean, required: false, default: false })
  private disabled!: boolean;

  @Emit("hover")
  hoverDev(index: number): void {}

  @Emit("doubleClick")
  doubleClick(index: number): void {}

  @Emit("moveStart")
  moveStart(event: MouseEvent | TouchEvent, index: number) {}
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
