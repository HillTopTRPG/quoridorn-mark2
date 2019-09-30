<template>
  <div id="right-pane" ref="pane" :class="{ minimized: isMinimized }">
    <!-- コンテンツ -->
    <div class="v-scroll" @wheel.stop="onWheel" :class="{ isAnimationY }">
      <pane-frame
        v-for="(windowInfo, key) in windowInfoList"
        :key="key"
        v-show="windowInfo.status.indexOf('right-pane') > -1"
        :windowInfo="windowInfo"
      />
    </div>

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
import { PaneMoveInfo, WindowInfo, WindowMoveInfo } from "@/@types/window";
import { Point } from "@/@types/address";
import ResizeKnob from "../window/ResizeKnob.vue";
import TaskManager, { MouseMoveParam } from "../task/TaskManager";
import TaskProcessor from "../task/TaskProcessor";
import { Task } from "@/@types/task";
import {
  createPoint,
  getPaneHeight,
  getRightPaneRectangle,
  isContain
} from "../Coordinate";
import WindowManager from "../window/WindowManager";
import PaneFrame from "./PaneFrame.vue";

@Component({
  components: { PaneFrame, ResizeKnob }
})
export default class RightPane extends Vue {
  private windowInfoList: WindowInfo<unknown>[] =
    WindowManager.instance.windowInfoList;

  private dragFrom: number = 0;
  private diffX: number = 0;

  private fontSize: number = 12;
  private isMounted: boolean = false;

  private width: number = 50;

  private isMinimized: boolean = false;
  private hoverWindowKey: string | null = null;

  private isAnimationY: boolean = false;

  private mounted() {
    this.isMounted = true;
  }

  /**
   * マウス左ボタン押下イベント処理
   */
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

  /**
   * マウス左ドラッグ中移動イベント処理
   * @param task
   * @param param
   */
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

  /**
   * マウス左ボタンドラッグ終了イベント処理
   * @param task
   */
  @TaskProcessor("mouse-move-end-left-finished")
  private async mouseLeftUpFinished(task: Task<Point>): Promise<string | void> {
    const point: Point = task.value!;
    const paneRectangle = getRightPaneRectangle();

    // ペイン上のマウスの相対位置
    const mouseOnPane = createPoint(
      point.x - paneRectangle.x,
      point.y - paneRectangle.y
    );
    this.width -= this.diffX;
    this.diffX = 0;

    if (this.hoverWindowKey) {
      const windowInfo = WindowManager.instance.getWindowInfo(
        this.hoverWindowKey
      );
      windowInfo.status = "right-pane";
      setTimeout(() => {
        this.arrangePaneOrder(mouseOnPane, this.hoverWindowKey!, false);
      });
      this.hoverWindowKey = null;
    }

    TaskManager.instance.setTaskParam("mouse-moving-finished", null);
    TaskManager.instance.setTaskParam("mouse-move-end-left-finished", null);

    // 登録したタスクに完了通知
    if (task.resolve) task.resolve(task);
  }

  /**
   * 子画面移動イベント
   */
  @TaskProcessor("window-moving-finished")
  private async windowMovingFinished(
    task: Task<WindowMoveInfo>
  ): Promise<string | void> {
    const point: Point = task.value!.mouse!;
    const paneRectangle = getRightPaneRectangle();
    this.isAnimationY = true;

    // ペイン上のマウスの相対位置
    const mouseOnPane = createPoint(
      point.x - paneRectangle.x,
      point.y - paneRectangle.y
    );

    const key = task.value!.windowKey;
    if (isContain(paneRectangle, point)) {
      // ペインに含まれている場合
      const windowInfo = WindowManager.instance.getWindowInfo(key);
      // 既に追加されていたら処理しない
      if (windowInfo.status.startsWith("right-pane")) return;

      windowInfo.status = "window-right-pane";
      this.hoverWindowKey = key;

      // ペインの幅をコンテンツの最小幅、最大幅に合わせて調整
      let arrangeWidth: number;
      arrangeWidth = Math.max(this.width, this.minWidth);
      arrangeWidth = Math.min(arrangeWidth, this.maxWidth);
      this.diffX = this.width - arrangeWidth;
    } else {
      // ペインに含まれない場合
      if (this.hoverWindowKey) {
        // 一度ペインへの追加の保留として処理されていた場合
        const windowInfo = WindowManager.instance.getWindowInfo(
          this.hoverWindowKey
        );
        windowInfo.status = "window";
        this.hoverWindowKey = null;
        this.diffX = 0;
      }
    }
    this.arrangePaneOrder(mouseOnPane, key, false);
  }

  /**
   * ペイン内ペインフレーム移動イベント処理
   */
  @TaskProcessor("right-pane-frame-moving-finished")
  private async rightPaneFrameMovingFinished(
    task: Task<PaneMoveInfo>
  ): Promise<string | void> {
    const point = task.value!.point;
    const windowKey = task.value!.windowKey;
    const windowInfo = WindowManager.instance.getWindowInfo(windowKey);
    const paneRectangle = getRightPaneRectangle();
    this.isAnimationY = true;

    // ペイン上のマウスの相対位置
    const mouseOnPane = createPoint(
      point.x - paneRectangle.x,
      point.y - paneRectangle.y
    );

    windowInfo.status = "right-pane-moving";
    this.arrangePaneOrder(mouseOnPane, windowKey, false);

    // 登録したタスクに完了通知
    if (task.resolve) task.resolve(task);
  }

  private get filteredWindowInfoList() {
    return WindowManager.createFilter("right-pane")(this.windowInfoList);
  }

  /**
   * ペイン内配置再計算イベント処理
   */
  @TaskProcessor("pane-relocation-finished")
  private async paneRelocationFinished(
    task: Task<string>
  ): Promise<string | void> {
    const windowKey = task.value!;
    this.arrangeY();

    // ペインの幅をコンテンツの最小幅、最大幅に合わせて調整
    let arrangeWidth: number;
    arrangeWidth = Math.max(this.width, this.minWidth);
    arrangeWidth = Math.min(arrangeWidth, this.maxWidth);
    this.width = arrangeWidth;

    await TaskManager.instance.ignition<string>({
      type: "window-active",
      owner: "Quoridorn",
      value: windowKey
    });
  }

  @TaskProcessor("window-minimize-finished")
  @TaskProcessor("window-close-finished")
  private async closeWindow(task: Task<string>): Promise<string | void> {
    this.isAnimationY = false;
    setTimeout(() => {
      this.arrangeY(task.value!);

      // ペインの幅をコンテンツの最小幅、最大幅に合わせて調整
      let arrangeWidth: number;
      arrangeWidth = Math.max(this.width, this.minWidth);
      arrangeWidth = Math.min(arrangeWidth, this.maxWidth);
      this.width = arrangeWidth;
    });
  }

  private arrangePaneOrder(mouseOnPane: Point, key: string, isBlock: boolean) {
    const windowInfo = WindowManager.instance.getWindowInfo(key);
    let order = -1;
    const sortedList = this.filteredWindowInfoList.sort((info1, info2) => {
      if (info1.paneOrder < info2.paneOrder) return -1;
      if (info1.paneOrder > info2.paneOrder) return 1;
      return 0;
    });
    let arrangeOrderMode: boolean = false;
    sortedList.forEach((info, i) => {
      if (arrangeOrderMode) {
        info.paneOrder = i + 1;
        return;
      } else {
        info.paneOrder = i;
      }

      // マウスカーソルが要素より上にある場合
      if (mouseOnPane.y < info.paneY) {
        order = i;
        info.paneOrder = i + 1;
        arrangeOrderMode = true;
        return;
      }

      // マウスカーソルが要素より下にある場合
      const paneHeight = getPaneHeight(info.key);
      if (info.paneY + paneHeight < mouseOnPane.y) {
        order = i + 1;
        return;
      }

      // マウスカーソルが要素の中にある場合
      if (
        info.paneY <= mouseOnPane.y &&
        mouseOnPane.y <= info.paneY + paneHeight
      ) {
        if (isBlock) {
          order = i;
          info.paneOrder++;
        } else {
          if (mouseOnPane.y < info.paneY + paneHeight / 2) {
            order = i;
            info.paneOrder++;
          } else {
            order = i + 1;
          }
        }
        arrangeOrderMode = true;
      }
    });

    if (order === -1) order = 0;
    if (windowInfo) windowInfo.paneOrder = order;

    this.arrangeY();
  }

  /**
   * paneOrderの整理後に呼ぶことで、ペイン内の各子画面の座標を最適化する処理
   */
  private arrangeY(deleteKey?: string) {
    let y: number = 0;
    this.filteredWindowInfoList
      .sort((info1, info2) => {
        if (info1.paneOrder < info2.paneOrder) return -1;
        if (info1.paneOrder > info2.paneOrder) return 1;
        return 0;
      })
      .forEach((info, index) => {
        info.paneY = y;
        info.paneOrder = index;
        if (info.key !== deleteKey) y += getPaneHeight(info.key);
      });
  }

  /**
   * ペインの格納／表示の切り替え
   */
  private onClickPaneKnob(flg: boolean) {
    this.isMinimized = flg;
  }

  /**
   * ペインの最小幅の算出
   */
  private get minWidth() {
    if (!this.filteredWindowInfoList.length) return 50;
    return Math.min(
      ...this.filteredWindowInfoList.map(info =>
        info.declare.minSize ? info.declare.minSize.width : 0
      )
    );
  }

  /**
   * ペインの最大幅の算出
   */
  private get maxWidth() {
    if (!this.filteredWindowInfoList.length) return 50;
    return Math.max(
      ...this.filteredWindowInfoList.map(info =>
        info.declare.maxSize ? info.declare.maxSize.width : 1000
      )
    );
  }

  @Watch("isMounted")
  @Watch("diffX")
  @Watch("width")
  private onChangeWindowWidth() {
    if (!this.isMounted) return;
    const width = this.width - this.diffX;
    const appElm = document.querySelector("#app") as HTMLDivElement;
    appElm.style.setProperty("--right-pane-width", `${width}px`);
  }

  private get paneElm(): HTMLDivElement {
    return this.$refs.pane as HTMLDivElement;
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
@import "../../../assets/common";

#right-pane {
  position: fixed;
  padding: 0;
  overflow-x: visible;
  background-color: var(--theme-color);
  box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.6);
  border: solid gray 1px;
  border-top-width: 0;
  border-right-width: 0;
  box-sizing: border-box;
  top: var(--menu-bar-height);
  width: calc(var(--right-pane-width) + var(--scroll-bar-width) + 1px);
  bottom: var(--window-title-height);
  right: 0;
  font-size: var(--fontSize);
  z-index: 10;
  transition-property: right;
  transition-delay: 0ms;
  transition-timing-function: linear;
  transition-duration: 200ms;

  &.minimized {
    right: calc(var(--right-pane-width) * -1 - var(--scroll-bar-width) - 1px);
  }

  .isAnimationY .pane-frame {
    transition-property: top;
    transition-delay: 0ms;
    transition-timing-function: linear;
    transition-duration: 200ms;
  }

  .v-scroll {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    right: 0;
    overflow-y: scroll;
    scroll-snap-type: y mandatory;
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
    background-image: radial-gradient(
        circle,
        var(--theme-color-accent) 30%,
        transparent 31%
      ),
      radial-gradient(circle, var(--theme-color-accent) 30%, transparent 31%);
    background-position: 0 0, 7px 7px;
    background-size: 15px 15px;
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
