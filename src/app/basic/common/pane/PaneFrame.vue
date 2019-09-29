<template>
  <div class="pane-frame" ref="paneFrame" :id="key">
    <!-- タイトルバー -->
    <div
      class="pane-frame-title"
      :class="{ fix: !windowInfo.declare.resizable }"
      @mousedown.left="leftDown"
      @contextmenu.prevent
    >
      <!-- タイトル文言 -->
      <div class="title-message-area">
        <span>{{ windowInfo.title }}</span>
        <span class="message" v-if="windowInfo.message">{{
          windowInfo.message
        }}</span>
      </div>

      <!-- 通常化 -->
      <title-icon className="icon-arrow-down-left" @emit="normalizeWindow" />

      <!-- 閉じる -->
      <title-icon className="icon-cross" @emit="closeWindow" />
    </div>

    <!-- コンテンツ -->
    <component
      :is="windowInfo.type"
      :windowKey="windowInfo.key"
      v-show="!windowInfo.status.startsWith('window-')"
      class="_contents"
      @wheel.stop
    />

    <div v-if="windowInfo.status.endsWith('-window')" class="removing"></div>
    <div
      v-if="
        windowInfo.status.startsWith('window-') ||
          windowInfo.status.endsWith('moving')
      "
      class="inserting"
    ></div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { PaneMoveInfo, WindowInfo } from "@/@types/window";
import ResizeKnob from "@/app/basic/common/window/ResizeKnob.vue";
import TaskManager, { MouseMoveParam } from "@/app/core/task/TaskManager";
import {
  calcWindowPosition,
  createPoint,
  createRectangle
} from "@/app/core/Coordinate";
import { getCssPxNum } from "@/app/core/Css";
import { Point, Rectangle } from "@/@types/address";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task } from "@/@types/task";
import TitleIcon from "@/app/basic/common/window/TitleIcon.vue";

@Component({
  components: { TitleIcon, ResizeKnob }
})
export default class PaneFrame extends Vue {
  @Prop({ type: Object, required: true })
  private windowInfo!: WindowInfo;

  private isMounted: boolean = false;
  private dragFrom: Point = createPoint(0, 0);
  private diff: Point = createPoint(0, 0);
  private paneRectangle: Rectangle = createRectangle(0, 0, 0, 0);

  private mounted() {
    this.isMounted = true;
  }
  private get key(): string {
    return `right-pane-${this.windowInfo.key}`;
  }

  /**
   * マウス左ボタン押下イベント処理
   */
  private leftDown(event: MouseEvent) {
    TaskManager.instance.setTaskParam<MouseMoveParam>("mouse-moving-finished", {
      key: this.key,
      type: null
    });
    TaskManager.instance.setTaskParam<MouseMoveParam>(
      "mouse-move-end-left-finished",
      {
        key: this.key,
        type: null
      }
    );
    this.dragFrom = createPoint(event.pageX, event.pageY);
    this.paneRectangle = this.paneElm.getBoundingClientRect() as Rectangle;
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
    if (param.key !== this.key) return;
    const point = task.value!;

    // 移動
    this.diff.x = point.x - this.dragFrom.x;
    this.diff.y = point.y - this.dragFrom.y;

    const newPoint = createPoint(
      point.x - (this.dragFrom.x - this.paneRectangle.x),
      point.y - (this.dragFrom.y - this.paneRectangle.y)
    );

    const isRight = this.windowInfo.status.indexOf("right") > -1;
    const isLeft = this.windowInfo.status.indexOf("left") > -1;
    this.windowInfo.x = newPoint.x;
    this.windowInfo.y = newPoint.y;

    if (isRight && point.x < this.paneRectangle.x) {
      // 範囲外に出たので除外中にする
      this.windowInfo.status = "right-pane-window";
      await TaskManager.instance.ignition<string>({
        type: "pane-relocation",
        owner: "Quoridorn",
        value: this.windowInfo.key
      });
    } else if (
      isLeft &&
      point.x > this.paneRectangle.x + this.paneRectangle.width
    ) {
      // 範囲外に出たので除外中にする
      this.windowInfo.status = "left-pane-window";
      await TaskManager.instance.ignition<string>({
        type: "pane-relocation",
        owner: "Quoridorn",
        value: this.windowInfo.key
      });
    } else {
      // 範囲内
      await TaskManager.instance.ignition<PaneMoveInfo>({
        type: isRight ? "right-pane-frame-moving" : "left-pane-frame-moving",
        owner: "Quoridorn",
        value: {
          point: newPoint,
          windowKey: this.windowInfo.key
        }
      });
    }

    // 登録したタスクに完了通知
    if (task.resolve) task.resolve(task);
  }

  /**
   * マウス左ボタンドラッグ終了イベント処理
   * @param task
   * @param param
   */
  @TaskProcessor("mouse-move-end-left-finished")
  private async mouseMoveEndLeftFinished(
    task: Task<Point>,
    param: MouseMoveParam
  ): Promise<string | void> {
    if (param && param.key === this.key) {
      const point = task.value!;

      this.windowInfo.x = point.x - (this.dragFrom.x - this.paneRectangle.x);
      this.windowInfo.y = point.y - (this.dragFrom.y - this.paneRectangle.y);

      this.dragFrom.x = 0;
      this.dragFrom.y = 0;
      this.diff.x = 0;
      this.diff.y = 0;

      // 移動によって子画面化の予備軍だった場合は子画面化する
      if (this.windowInfo.status.endsWith("-window")) {
        this.windowInfo.status = "window";
        await TaskManager.instance.ignition<string>({
          type: "pane-relocation",
          owner: "Quoridorn",
          value: this.windowInfo.key
        });
      }

      // 移動によって子画面化の予備軍だった場合は子画面化する
      if (this.windowInfo.status.endsWith("moving")) {
        const isRight = this.windowInfo.status.indexOf("right") > -1;
        this.windowInfo.status = isRight ? "right-pane" : "left-pane";
        setTimeout(async () => {
          await TaskManager.instance.ignition<string>({
            type: "pane-relocation",
            owner: "Quoridorn",
            value: this.windowInfo.key
          });
        });
      }
    }

    TaskManager.instance.setTaskParam("mouse-moving-finished", null);
    TaskManager.instance.setTaskParam("mouse-move-end-left-finished", null);

    // 登録したタスクに完了通知
    if (task.resolve) task.resolve(task);
  }

  /**
   * 閉じるイベント
   */
  private async closeWindow(): Promise<void> {
    await TaskManager.instance.ignition<string>({
      type: "window-close",
      owner: "Quoridorn",
      value: this.key
    });
  }

  /**
   * 子画面化イベント
   */
  private async normalizeWindow() {
    // 現在のサイズのまま、初期配置場所に設置しなおす
    const point = calcWindowPosition(
      this.windowInfo.declare.position,
      this.windowInfo,
      getCssPxNum("--menu-bar-height")
    );
    this.windowInfo.x = point.x;
    this.windowInfo.y = point.y;

    this.windowInfo.status = "window";
    await TaskManager.instance.ignition<string>({
      type: "pane-relocation",
      owner: "Quoridorn",
      value: this.windowInfo.key
    });
  }

  private get paneElm(): HTMLDivElement {
    return this.$refs.paneFrame as HTMLDivElement;
  }

  @Watch("isMounted")
  @Watch("windowInfo.paneY")
  private onChangeWindowY() {
    if (!this.isMounted) return;
    const y = this.windowInfo.paneY;
    this.paneElm.style.setProperty("--paneY", `${y}px`);
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.pane-frame {
  position: absolute;
  display: block;
  padding-top: calc(var(--window-title-height) - 1px);
  overflow: visible;
  /*background-color: rgba(255, 255, 255, 0.8);*/
  box-sizing: border-box;
  border-bottom: 1px solid gray;
  left: 0;
  top: var(--paneY);
  width: 100%;
  font-size: var(--windowFontSize);
  z-index: var(--windowOrder);

  &.minimized {
    width: 100px !important;
    height: var(--window-title-height) !important;
    top: calc(100% - var(--window-title-height)) !important;
    left: calc(
      100% - 100px * (var(--windowMinimizeLength) - var(--windowMinimizeIndex))
    ) !important;
    transition-property: width, height, top, left;
    transition-delay: 0ms;
    transition-timing-function: linear;
    transition-duration: 200ms;

    .window-title {
      cursor: default;
      background-color: red;

      &:hover + .window-title-balloon {
        visibility: visible;
      }
    }

    ._contents {
      visibility: hidden;
    }
  }

  img,
  button {
    white-space: nowrap;
  }
}

._contents {
  width: 100%;
  height: 100%;
  z-index: 1;
  padding: var(--window-padding);
  box-sizing: border-box;
}

.pane-frame-title {
  @include flex-box(row, flex-end, center);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: var(--window-title-height);
  background-color: var(--theme-color-accent);
  border-bottom: solid gray 1px;
  cursor: move;
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
  padding: 0 0.5em;
  box-sizing: border-box;

  &.fix {
    background: linear-gradient(
      rgba(170, 233, 203, 0.8),
      rgba(142, 226, 186, 0.8)
    );
  }

  > div {
    > span:not(:first-child) {
      margin-left: 0.5em;
      padding: 0 0.5em;
      font-style: italic;
      text-underline: #444444;
      border-radius: 0.3em;
      background-color: white;
    }
  }

  .title-message-area {
    overflow-x: hidden;
    text-overflow: ellipsis;
    margin-right: auto;
  }

  .fontSizeSlider {
    @include flex-box(row, center, center);
    font-size: 10px;
    color: #444;

    input[type="range"] {
      -webkit-appearance: none;
      background-image: linear-gradient(
        to bottom,
        rgb(160, 166, 162) 0%,
        rgb(201, 199, 200) 100%
      );
      height: 0.4em;
      width: 100%;
      border-radius: 0.3em;
      border: 1px solid rgb(167, 167, 167);
      border-top: 1px solid rgb(105, 110, 106);
      box-sizing: border-box;

      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        cursor: pointer;
        position: relative;
        width: 1em;
        height: 1em;
        display: block;
        background-image: linear-gradient(
          to bottom,
          rgb(242, 248, 246) 0%,
          rgb(242, 248, 246) 50%,
          rgb(230, 240, 239) 51%,
          rgb(230, 240, 239) 100%
        );
        border-radius: 50%;
        -webkit-border-radius: 50%;
        border: 1px solid rgb(167, 167, 167);
      }
    }
  }
}

.inserting,
.removing {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  border-bottom: solid gray 1px;
  background-size: 20px 20px;
  background-attachment: fixed;
  z-index: 2;
}

.inserting {
  background-image: linear-gradient(
    -45deg,
    rgba(255, 255, 0, 0.4) 25%,
    rgba(0, 255, 255, 0.4) 25%,
    rgba(0, 255, 255, 0.4) 50%,
    rgba(255, 255, 0, 0.4) 50%,
    rgba(255, 255, 0, 0.4) 75%,
    rgba(0, 255, 255, 0.4) 75%,
    rgba(0, 255, 255, 0.4)
  );
}

.removing {
  background-image: linear-gradient(
    -45deg,
    rgba(255, 255, 0, 0.4) 25%,
    rgba(255, 0, 255, 0.4) 25%,
    rgba(255, 0, 255, 0.4) 50%,
    rgba(255, 255, 0, 0.4) 50%,
    rgba(255, 255, 0, 0.4) 75%,
    rgba(255, 0, 255, 0.4) 75%,
    rgba(255, 0, 255, 0.4)
  );
}
</style>
