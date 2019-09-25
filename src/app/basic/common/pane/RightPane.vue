<template>
  <div id="right-pane" ref="pane">
    <!-- コンテンツ
    <component
      :is="windowInfo.type"
      :windowKey="windowInfo.key"
      class="_contents"
      :style="{ fontSize: fontSize + 'px' }"
      @wheel.stop
    />
    -->
    <resize-knob side="left" @leftDown="leftDown" />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { WindowInfo } from "@/@types/window";
import { Point, Rectangle } from "@/@types/address";
import ResizeKnob from "@/app/basic/common/window/ResizeKnob.vue";
import TaskManager, { MouseMoveParam } from "@/app/core/task/TaskManager";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task } from "@/@types/task";
import { createRectangle, createSize, isContain } from "@/app/core/Coordinate";
import { getCssPxNum } from "@/app/core/Css";

@Component({
  components: { ResizeKnob }
})
export default class RightPane extends Vue {
  private windowInfoList: WindowInfo[] = [];

  private dragFrom: number = 0;
  private diffX: number = 0;

  private fontSize: number = 12;
  private isMounted: boolean = false;

  private top: number = 2;
  private width: number = 100;
  private bottom: number = 50;

  private mounted() {
    this.isMounted = true;
  }

  @TaskProcessor("window-moving-finished")
  private async onWindowMoving(task: Task<Point>): Promise<string | void> {
    const panePointRectangle = this.getPaneRectangle();
    if (isContain(panePointRectangle, task.value!)) {
      window.console.log("含まれてます！！");
    }
  }

  private getPaneRectangle(): Rectangle {
    const top = getCssPxNum("--right-pane-top", this.appElm);
    const width = getCssPxNum("--right-pane-width", this.appElm);
    const bottom = getCssPxNum("--right-pane-bottom", this.appElm);
    const windowSize = createSize(window.innerWidth, window.innerHeight);
    return createRectangle(
      windowSize.width - width,
      top,
      width,
      windowSize.height - top - bottom
    );
  }

  private get minWidth() {
    if (!this.windowInfoList.length) return 20;
    return Math.min(
      ...this.windowInfoList.map(info =>
        info.declare.minSize ? info.declare.minSize.width : 0
      )
    );
  }

  private get maxWidth() {
    if (!this.windowInfoList.length) return 1000;
    return Math.max(
      ...this.windowInfoList.map(info =>
        info.declare.minSize ? info.declare.minSize.width : 1000
      )
    );
  }

  private leftDown(event: MouseEvent, side: string): void {
    TaskManager.instance.setTaskParam<MouseMoveParam>("mouse-moving-finished", {
      key: "right-pane",
      type: side
    });
    TaskManager.instance.setTaskParam<MouseMoveParam>(
      "mouse-move-end-left-finished",
      {
        key: "right-pane",
        type: side
      }
    );
    this.dragFrom = event.pageX;
  }

  @TaskProcessor("mouse-move-end-left-finished")
  private async mouseLeftUpFinished(task: Task<Point>): Promise<string | void> {
    this.width -= this.diffX;

    this.diffX = 0;

    TaskManager.instance.setTaskParam("mouse-moving-finished", null);
    TaskManager.instance.setTaskParam("mouse-move-end-left-finished", null);

    // 登録したタスクに完了通知
    if (task.resolve) task.resolve(task);
  }

  @TaskProcessor("mouse-moving-finished")
  private async mouseMoveFinished(
    task: Task<Point>,
    param: MouseMoveParam
  ): Promise<string | void> {
    if (param.key !== "right-pane") return;
    const point = task.value!;

    let diff = point.x - this.dragFrom;
    let simulationWidth = this.width - diff;
    let w = simulationWidth;
    w = Math.min(w, this.maxWidth);
    w = Math.max(w, this.minWidth);
    this.diffX = diff - (w - simulationWidth);

    // 登録したタスクに完了通知
    if (task.resolve) task.resolve(task);
  }

  private get appElm(): HTMLDivElement {
    return document.querySelector("#app");
  }

  private get paneElm(): HTMLDivElement {
    return this.$refs.pane as HTMLDivElement;
  }

  @Watch("isMounted")
  @Watch("top")
  private onChangeTop() {
    if (!this.isMounted) return;
    this.appElm.style.setProperty("--right-pane-top", `${this.top}em`);
  }

  @Watch("isMounted")
  @Watch("diffX")
  @Watch("width")
  private onChangeWindowWidth() {
    if (!this.isMounted) return;
    const width = this.width - this.diffX;
    this.appElm.style.setProperty("--right-pane-width", `${width}px`);
  }

  @Watch("isMounted")
  @Watch("bottom")
  private onChangeWindowHeight() {
    if (!this.isMounted) return;
    this.appElm.style.setProperty("--right-pane-bottom", `${this.bottom}px`);
  }

  @Watch("isMounted")
  @Watch("fontSize")
  private onChangeFontSize() {
    if (!this.isMounted) return;
    this.paneElm.style.setProperty("--fontSize", `${this.fontSize}px`);
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

#right-pane {
  position: fixed;
  display: block;
  padding: 8px 8px 8px 8px;
  overflow: visible;
  background-color: rgba(255, 255, 255, 0.8);
  box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.6);
  border: solid gray 1px;
  border-right-width: 0;
  box-sizing: border-box;
  /*left: var(--x);*/
  top: var(--right-pane-top);
  width: var(--right-pane-width);
  bottom: var(--right-pane-bottom);
  right: 0;
  /*font-size: var(--fontSize);*/
  z-index: 10;
}

._contents {
  position: relative;
  overflow: visible;
  width: 100%;
  height: 100%;
  display: block;
  z-index: 91;
}
</style>
