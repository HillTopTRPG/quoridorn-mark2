<template>
  <div id="right-pane" ref="pane" :class="{ minimized: isMinimized }">
    <!-- コンテンツ -->
    <pane-frame
      v-for="(windowInfo, key) in windowInfoList"
      :key="key"
      v-show="windowInfo.status.indexOf('right-pane') > -1"
      :windowInfo="windowInfo"
      @wheel.stop
    />

    <div class="pane-knob" @click="onClickPaneKnob(!isMinimized)">
      <span
        :class="{
          'icon-arrow-right': !isMinimized,
          'icon-arrow-left': isMinimized
        }"
      ></span>
    </div>
    <resize-knob v-if="!isMinimized" side="left" @leftDown="leftDown" />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { WindowInfo, WindowMoveInfo } from "@/@types/window";
import { Point, Rectangle } from "@/@types/address";
import ResizeKnob from "@/app/basic/common/window/ResizeKnob.vue";
import TaskManager, { MouseMoveParam } from "@/app/core/task/TaskManager";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task } from "@/@types/task";
import { createRectangle, createSize, isContain } from "@/app/core/Coordinate";
import { getCssPxNum } from "@/app/core/Css";
import WindowManager from "@/app/basic/common/window/WindowManager";
import PaneFrame from "@/app/basic/common/pane/PaneFrame.vue";

@Component({
  components: { PaneFrame, ResizeKnob }
})
export default class RightPane extends Vue {
  private windowInfoList: WindowInfo[] = WindowManager.instance.windowInfoList;

  private dragFrom: number = 0;
  private diffX: number = 0;

  private fontSize: number = 12;
  private isMounted: boolean = false;

  private width: number = 50;

  private mounted() {
    this.isMounted = true;
  }

  private get filteredWindowInfoList() {
    return WindowManager.createFilter("right-pane")(this.windowInfoList);
  }

  @TaskProcessor("window-moving-finished")
  private async windowMovingFinished(
    task: Task<WindowMoveInfo>
  ): Promise<string | void> {
    const panePointRectangle = this.getPaneRectangle();
    if (isContain(panePointRectangle, task.value!.mouse)) {
      const key = task.value!.windowKey;
      const windowInfo = WindowManager.instance.getWindowInfo(key);
      // 既に追加されていたら処理しない
      if (windowInfo.status === "right-pane") return;

      windowInfo.status = "window-right-pane";
      this.hoverWindowKey = key;

      let arrangeWidth: number;
      arrangeWidth = Math.max(this.width, this.minWidth);
      arrangeWidth = Math.min(arrangeWidth, this.maxWidth);
      this.diffX = this.width - arrangeWidth;
    } else {
      if (this.hoverWindowKey) {
        const windowInfo = WindowManager.instance.getWindowInfo(
          this.hoverWindowKey
        );
        if (windowInfo.status === "window-right-pane") {
          windowInfo.status = "window";
        }
        this.hoverWindowKey = null;
        this.diffX = 0;
      }
    }
  }

  @TaskProcessor("mouse-move-end-left-finished")
  private async mouseLeftUpFinished(task: Task<Point>): Promise<string | void> {
    this.width -= this.diffX;

    this.diffX = 0;

    if (this.hoverWindowKey) {
      const windowInfo = WindowManager.instance.getWindowInfo(
        this.hoverWindowKey
      );
      windowInfo.status = "right-pane";
      this.hoverWindowKey = null;
    }

    TaskManager.instance.setTaskParam("mouse-moving-finished", null);
    TaskManager.instance.setTaskParam("mouse-move-end-left-finished", null);

    // 登録したタスクに完了通知
    if (task.resolve) task.resolve(task);
  }

  private getPaneRectangle(): Rectangle {
    const top = getCssPxNum("--menu-bar-height", this.appElm);
    const width = getCssPxNum("--right-pane-width", this.appElm);
    const bottom = getCssPxNum("--window-title-height", this.appElm);
    const windowSize = createSize(window.innerWidth, window.innerHeight);
    return createRectangle(
      windowSize.width - width,
      top,
      width,
      windowSize.height - top - bottom
    );
  }

  private isMinimized: boolean = false;
  private hoverWindowKey: string | null = null;

  private onClickPaneKnob(flg: boolean) {
    this.isMinimized = flg;
  }

  private get minWidth() {
    if (!this.filteredWindowInfoList.length) return 50;
    return Math.min(
      ...this.filteredWindowInfoList.map(info =>
        info.declare.minSize ? info.declare.minSize.width : 0
      )
    );
  }

  private get maxWidth() {
    if (!this.filteredWindowInfoList.length) return 50;
    return Math.max(
      ...this.filteredWindowInfoList.map(info =>
        info.declare.maxSize ? info.declare.maxSize.width : 1000
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
    return document.querySelector("#app") as HTMLDivElement;
  }

  private get paneElm(): HTMLDivElement {
    return this.$refs.pane as HTMLDivElement;
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
  padding: 0;
  overflow: visible;
  background-color: var(--theme-color);
  box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.6);
  border: solid gray 1px;
  border-top-width: 0;
  border-right-width: 0;
  box-sizing: border-box;
  top: var(--menu-bar-height);
  width: var(--right-pane-width);
  bottom: var(--window-title-height);
  right: 0;
  font-size: var(--fontSize);
  z-index: 10;

  &.minimized {
    right: calc(var(--right-pane-width) * -1);
  }

  .pane-knob {
    position: absolute;
    @include flex-box(row, center, center);
    height: 100px;
    width: 20px;
    top: 5px;
    right: 100%;
    border-style: solid;
    border-width: 1px;
    border-color: inherit;
    background-color: inherit;
    background-image: linear-gradient(
      -45deg,
      transparent 25%,
      var(--theme-color-accent) 25%,
      var(--theme-color-accent) 50%,
      transparent 50%,
      transparent 75%,
      var(--theme-color-accent) 75%,
      var(--theme-color-accent)
    );
    background-size: 20px 20px;
    background-attachment: local;
    box-sizing: border-box;
    vertical-align: middle;
    cursor: pointer;
    z-index: 2;
    font-size: 14px;

    .icon-arrow-left {
      justify-self: flex-start;
    }

    .icon-arrow-right {
      justify-self: flex-end;
    }
  }
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
