<template>
  <div
    :id="key"
    class="window"
    :class="{ isSmall: windowInfo.isMinimized }"
    :style="windowStyle"
    @mousedown.left.stop
    @touchstart.stop
  >
    <!-- タイトルバー -->
    <div
      class="window-title"
      :class="{ fix: !windowInfo.declare.resizable }"
      @mousedown.left.stop="leftDown()"
      @touchstart.stop="leftDown()"
      @contextmenu.prevent
    >
      <!-- タイトル文言 -->
      <div class="title-message-area">
        <span>{{ windowInfo.title }}</span>
        <span class="message" v-if="windowInfo.message">{{
          windowInfo.message
        }}</span>
      </div>

      <!-- 閉じるボタン -->
      <span class="title-icon-area" v-if="windowInfo.declare.closable">
        <i
          class="icon-cross window-close"
          @click.left.stop="closeWindow"
          @keydown.space.stop="closeWindow"
          @keydown.enter.stop="closeWindow"
          @keydown.229.stop
          @keyup.229.stop
          :tabindex="0"
        ></i>
      </span>
    </div>

    <!-- コンテンツ -->
    <div
      class="_contents"
      :style="{ fontSize: fontSize + 'px' }"
      @wheel.stop
      @mousedown.stop
    >
      <slot />
    </div>

    <!-- サイズ変更つまみ -->
    <template v-if="windowInfo.declare.resizable">
      <resize-knob side="left-top" @leftDown="leftDown" />
      <resize-knob side="left-bottom" @leftDown="leftDown" />
      <resize-knob side="right-top" @leftDown="leftDown" />
      <resize-knob side="right-bottom" @leftDown="leftDown" />
      <resize-knob side="top" @leftDown="leftDown" />
      <resize-knob side="left" @leftDown="leftDown" />
      <resize-knob side="right" @leftDown="leftDown" />
      <resize-knob side="bottom" @leftDown="leftDown" />
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue, Watch } from "vue-property-decorator";
import { Getter, Mutation } from "vuex-class";
import { WindowInfo } from "@/@types/window";
import { Anchor, Point, Rectangle, Size } from "@/@types/address";
import ResizeKnob from "@/app/basic/common/window/ResizeKnob.vue";
import TaskManager, { MouseMoveParam } from "@/app/core/task/TaskManager";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task } from "@/@types/task";
import { createPoint, createRectangle } from "@/app/core/Coordinate";

@Component({
  components: { ResizeKnob }
})
export default class TestWindow extends Vue {
  @Mutation("setIsMapOverEvent") private setIsMapOverEvent: any;

  @Prop({ type: Object, required: true })
  private windowInfo!: WindowInfo;

  private dragFrom: Point = createPoint(0, 0);
  private diff: Rectangle = createRectangle(0, 0, 0, 0);

  private fontSize: number = 12;
  private standImageSize: string = "192*256";
  private standImageWidth: number = 192;
  private standImageHeight: number = 256;

  private get key(): string {
    return `window-${this.windowInfo.key}`;
  }

  private leftDown(side?: string): void {
    TaskManager.instance.setTaskParam<MouseMoveParam>("mouse-move-finished", {
      key: this.key,
      type: side || ""
    });
    TaskManager.instance.setTaskParam<MouseMoveParam>(
      "mouse-left-up-finished",
      {
        key: this.key,
        type: side || ""
      }
    );
    this.dragFrom = TaskManager.instance.getLastValue<Point>("mouse-move");
  }

  @TaskProcessor("mouse-left-up-finished")
  private async mouseLeftUpFinished(task: Task<Point>): Promise<string | void> {
    this.windowInfo.x += this.diff.x;
    this.windowInfo.y += this.diff.y;
    this.windowInfo.width += this.diff.width;
    this.windowInfo.height += this.diff.height;

    this.diff.x = 0;
    this.diff.y = 0;
    this.diff.width = 0;
    this.diff.height = 0;

    TaskManager.instance.setTaskParam("mouse-move-finished", null);
    TaskManager.instance.setTaskParam("mouse-left-up-finished", null);

    // 登録したタスクに完了通知
    if (task.resolve) task.resolve(task);
  }

  @TaskProcessor("mouse-move-finished")
  private async mouseMoveFinished(
    task: Task<Point>,
    param: MouseMoveParam
  ): Promise<string | void> {
    if (param.key !== this.key) return;
    const point = task.value!;

    // 移動
    if (!param.type) {
      this.diff.x = point.x - this.dragFrom.x;
      this.diff.y = point.y - this.dragFrom.y;
      this.diff.width = 0;
      this.diff.height = 0;

      // 登録したタスクに完了通知
      if (task.resolve) task.resolve(task);
      return;
    }

    // サイズ変更不可なら処理終了
    if (!this.windowInfo.declare.resizable) {
      // 登録したタスクに完了通知
      if (task.resolve) task.resolve(task);
      return;
    }

    this.diff.x = 0;
    this.diff.y = 0;
    this.diff.width = 0;
    this.diff.height = 0;
    if (param.type.indexOf("left") > -1) {
      this.diff.width = this.dragFrom.x - point.x;
      this.diff.x = -this.diff.width;
    }
    if (param.type.indexOf("right") > -1) {
      this.diff.width = point.x - this.dragFrom.x;
    }
    if (param.type.indexOf("top") > -1) {
      this.diff.height = this.dragFrom.y - point.y;
      this.diff.y = -this.diff.height;
    }
    if (param.type.indexOf("bottom") > -1) {
      this.diff.height = point.y - this.dragFrom.y;
    }

    const simulationSize: Size = {
      width: this.windowInfo.width + this.diff.width,
      height: this.windowInfo.height + this.diff.height
    };
    const correctSize: Size = {
      width: 0,
      height: 0
    };
    const minSize = this.windowInfo.declare.minSize;
    if (minSize) {
      if (simulationSize.width < minSize.width)
        correctSize.width = minSize.width - simulationSize.width;
      if (simulationSize.height < minSize.height)
        correctSize.height = minSize.height - simulationSize.height;
    }
    const maxSize = this.windowInfo.declare.maxSize;
    if (maxSize) {
      if (simulationSize.width > maxSize.width)
        correctSize.width = maxSize.width - simulationSize.width;
      if (simulationSize.height > maxSize.height)
        correctSize.height = maxSize.height - simulationSize.height;
    }

    if (param.type.indexOf("left") > -1) this.diff.x -= correctSize.width;
    if (param.type.indexOf("top") > -1) this.diff.y -= correctSize.height;
    this.diff.width += correctSize.width;
    this.diff.height += correctSize.height;

    // 登録したタスクに完了通知
    if (task.resolve) task.resolve(task);
  }

  private get windowStyle(): any {
    return {
      left: `${this.windowInfo.x + this.diff.x}px`,
      top: `${this.windowInfo.y + this.diff.y}px`,
      width: `${this.windowInfo.width + this.diff.width}px`,
      height: `${this.windowInfo.height + this.diff.height}px`
    };
  }

  @Watch("standImageSize", { immediate: true })
  private onChangeStandImageSize(standImageSize: string) {
    const split: string[] = standImageSize.split("*");
    this.standImageWidth = parseInt(split[0]);
    this.standImageHeight = parseInt(split[1]);
  }

  private closeWindow(this: any): void {
    window.console.log(`close window`);
    this.windowInfo.isMinimized = !this.windowInfo.isMinimized;
  }

  private standImageStyle(standImage: any, index: number): any {
    const locate = standImage.locate;
    const mpx: number = (this.standImageWidth * (locate - 1)) / 12;
    return {
      width: `${this.standImageWidth}px`,
      height: `${this.standImageHeight}px`,
      left: `calc((100% - ${this.standImageWidth}px) * ${locate - 1} / 11)`,
      zIndex: index + 2
    };
  }

  @Emit("windowStyle")
  @Watch("windowStyle")
  private onChangeWindowStyle(windowStyle: any) {}

  private addEventForIFrame(this: any): void {
    const elms: HTMLCollection = document.getElementsByTagName("iFrame");
    Array.prototype.slice.call(elms).forEach((iFrameElm: HTMLIFrameElement) => {
      // マウス移動
      const mouseMoveListener = (event: any) => {
        const iFrameRect = iFrameElm.getBoundingClientRect();
        const evtObj = {
          clientX: event.pageX + iFrameRect.left,
          clientY: event.pageY + iFrameRect.top
        };
        document.dispatchEvent(new MouseEvent("mousemove", evtObj));
      };
      // タッチ移動
      const touchMoveListener = (event: any) => {
        const iFrameRect = iFrameElm.getBoundingClientRect();
        const evtObj: any = {
          changedTouches: [
            {
              clientX: event.changedTouches[0]["pageX"] + iFrameRect.left,
              clientY: event.changedTouches[0]["pageY"] + iFrameRect.top
            }
          ]
        };
        document.dispatchEvent(new MouseEvent("touchmove", evtObj));
      };
      // クリック
      const clickListener = (event: any) => {
        const iFrameRect = iFrameElm.getBoundingClientRect();
        const evtObj = {
          clientX: event.pageX + iFrameRect.left,
          clientY: event.pageY + iFrameRect.top,
          button: event.button
        };
        document
          .getElementById("mapBoardFrame")!
          .dispatchEvent(new MouseEvent("click", evtObj));
      };
      // マウス離す
      const mouseUpListener = (event: any) => {
        const iFrameRect = iFrameElm.getBoundingClientRect();
        const evtObj = {
          clientX: event.pageX + iFrameRect.left,
          clientY: event.pageY + iFrameRect.top,
          button: event.button
        };
        if (event.button === 2) {
          this.setIsMapOverEvent(true);
        }
        document
          .getElementById("mapBoardFrame")!
          .dispatchEvent(new MouseEvent("mouseUp", evtObj));
      };
      // コンテキストメニュー防止
      const contextMenuListener = () => {
        return false;
      };
      if (!iFrameElm.onload) {
        try {
          iFrameElm.onload = () => {
            try {
              const bodyElm: HTMLDocument = iFrameElm.contentWindow!.document;
              if (!bodyElm.onmousemove) {
                bodyElm.onmousemove = mouseMoveListener;
              }
              if (!bodyElm.ontouchmove) {
                bodyElm.ontouchmove = touchMoveListener;
              }
              if (!bodyElm.onmouseup) {
                bodyElm.onmouseup = mouseUpListener;
              }
              if (!bodyElm.oncontextmenu) {
                bodyElm.oncontextmenu = contextMenuListener;
              }
              if (!bodyElm.onclick) {
                bodyElm.onclick = clickListener;
              }
              /*
                const aElms = bodyElm.getElementsByTagName('a')
                for (const aElm of aElms) {
                  if (!aElm.onmousemove) { aElm.onmousemove = mouseMoveListener }
                  if (!aElm.ontouchmove) { aElm.ontouchmove = touchMoveListener }
                  if (!aElm.oncontextmenu) { aElm.oncontextmenu = contextMenuListener }
                  if (!aElm.onclick) { aElm.onclick = clickListener }
                }
                */
            } catch (error) {
              /* Nothing */
            }
          };
        } catch (error) {
          /* Nothing */
        }
      }
      if (!iFrameElm.onmousemove) {
        iFrameElm.onmousemove = mouseMoveListener;
      }
      if (!iFrameElm.ontouchmove) {
        iFrameElm.ontouchmove = touchMoveListener;
      }
      if (!iFrameElm.onmouseup) {
        iFrameElm.onmouseup = mouseUpListener;
      }
      if (!iFrameElm.onclick) {
        iFrameElm.onclick = clickListener;
      }
    });
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.window {
  position: fixed;
  display: block;
  padding: 29px 8px 8px 8px;
  overflow: visible;
  min-height: 50px;
  border-radius: 8px 8px 0 0;
  background-color: rgba(255, 255, 255, 0.8);
  box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.6);
  border: solid gray 1px;
  box-sizing: border-box;

  &.isSmall {
    background-color: red;
    width: 200px !important;
    top: calc(100% - 30px) !important;
    left: calc(0% - 0px) !important;
    transition-property: width, top, left;
    transition-delay: 0ms;
    transition-timing-function: linear;
    transition-duration: 200ms;
  }
}
.window img,
.window button {
  white-space: nowrap;
}

._contents {
  position: relative;
  overflow: visible;
  width: 100%;
  height: 100%;
  display: block;
  z-index: 91;
}

.window-title {
  @include flex-box(row, space-between, center);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 1.5rem;
  border-radius: 8px 8px 0 0;
  border-bottom: solid rgba(0, 0, 0, 0.2) 1px;
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
  }

  .fontSizeSlider {
    @include flex-box(row, center, center);
    font-size: 10px;
    color: #444;

    input[type="range"] {
      -webkit-appearance: none;
      appearance: none;
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
        appearance: none;
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

  .window-close {
    display: block;
    padding: 3px;
    font-size: 8px;
    border: 2px solid rgba(0, 0, 0, 0.5);
    color: rgba(0, 0, 0, 0.5);
    transform-origin: right;
    transform: scale(0.8) translateX(0);
    cursor: pointer;
    white-space: nowrap;

    &:hover {
      border-color: black;
      color: black;
    }
  }
}

.knob-left,
.knob-right,
.knob-top,
.knob-bottom,
.knob-left-top,
.knob-left-bottom,
.knob-right-top,
.knob-right-bottom {
  position: absolute;
  z-index: 90;
}

.knob-left,
.knob-right {
  top: 8px;
  width: 10px;
  height: calc(100% - 12px);
}

.knob-top,
.knob-bottom {
  left: 8px;
  height: 10px;
  width: calc(100% - 12px);
}

.knob-left-top,
.knob-left-bottom,
.knob-right-top,
.knob-right-bottom {
  width: 10px;
  height: 10px;
}

.knob-left,
.knob-left-top,
.knob-left-bottom {
  left: -4px;
}
.knob-right,
.knob-right-top,
.knob-right-bottom {
  right: -4px;
}
.knob-top,
.knob-left-top,
.knob-right-top {
  top: -4px;
}
.knob-bottom,
.knob-left-bottom,
.knob-right-bottom {
  bottom: -4px;
}

.knob-left {
  cursor: w-resize;
}
.knob-right {
  cursor: e-resize;
}
.knob-top {
  cursor: n-resize;
}
.knob-bottom {
  cursor: s-resize;
}
.knob-left-top {
  cursor: nw-resize;
}
.knob-left-bottom {
  cursor: sw-resize;
}
.knob-right-top {
  cursor: ne-resize;
  border-radius: 0 8px 0 0;
}
.knob-right-bottom {
  cursor: se-resize;
}

.standImage {
  position: absolute;
  bottom: calc(100% + 1px);

  &:hover {
    outline: solid 1px magenta;
  }
}
</style>
