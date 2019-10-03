<template>
  <td
    class="divider"
    @dblclick.stop="doubleClick(index)"
    @mouseover="hoverDev(index)"
    @mouseout="hoverDev()"
    @mousedown.stop="moveStart($event, index)"
    @touchstart.stop="moveStart"
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

  @Prop({ type: String, required: true })
  private tableKey!: string;

  @Emit("hover")
  hoverDev(index: number): void {}

  @Emit("doubleClick")
  doubleClick(index: number): void {}

  @Emit("moveStart")
  moveStart(event: MouseEvent | TouchEvent, index: number) {
    TaskManager.instance.setTaskParam<MouseMoveParam>("mouse-moving-finished", {
      key: this.tableKey,
      type: `div-${this.index}`
    });
    TaskManager.instance.setTaskParam<MouseMoveParam>(
      "mouse-move-end-left-finished",
      {
        key: this.tableKey,
        type: `div-${this.index}`
      }
    );
  }
}
</script>

<style scoped lang="scss">
.divider {
  background-color: rgb(183, 186, 188);
  cursor: col-resize;
  position: relative;
  width: 1px;

  &:after {
    position: absolute;
    height: 100%;
    top: 0;
    left: -3px;
    content: "";
    width: 7px;
  }
}
</style>
