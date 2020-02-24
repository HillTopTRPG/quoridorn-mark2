<template>
  <div
    :id="key"
    class="window-frame"
    :class="{ minimized: windowInfo.isMinimized }"
    @mousedown.left.stop="activeWindow()"
    @touchstart.stop="activeWindow()"
    ref="window-frame"
  >
    <!-- タイトルバー -->
    <div
      class="window-title"
      :class="{ fix: !windowInfo.declare.resizable }"
      @mousedown.left.stop="leftDown"
      @touchstart.stop="leftDown"
      @contextmenu.prevent
    >
      <!-- タイトル文言 -->
      <div class="title-message-area">
        <span v-if="windowInfo.title">{{ windowInfo.title }}</span>
        <span v-else v-t="`${windowInfo.type}.window-title`"></span>
        <span class="message" v-if="windowInfo.message">{{
          windowInfo.message
        }}</span>
      </div>

      <!-- 最小化 -->
      <title-icon
        className="icon-minus"
        @emit="minimizeWindow"
        v-if="windowInfo.declare.minimizable && !windowInfo.isMinimized"
      />

      <!-- 通常化 -->
      <title-icon
        className="icon-arrow-up-left"
        @emit="normalizeWindow"
        v-if="windowInfo.declare.minimizable && windowInfo.isMinimized"
      />

      <!-- 右ペイン格納 -->
      <title-icon
        className="icon-arrow-right"
        @emit="storeRightPane"
        v-if="windowInfo.declare.paneContainable"
      />

      <!-- 閉じる -->
      <title-icon
        className="icon-cross"
        @emit="closeWindow"
        v-if="windowInfo.declare.closable"
      />
    </div>

    <div
      class="window-info-balloon"
      :class="{ fontSizeChangeBan: fontSizeChangeBan }"
    >
      <!-- 文字サイズ変更 -->
      <label class="fontSizeSlider" @click.prevent>
        <input
          type="range"
          class="input"
          min="10"
          max="18"
          v-model="fontSize"
          :tabindex="0"
          @mousedown.stop
          @touchstart.stop
          @keydown.enter.stop
          @keyup.enter.stop
          @keydown.229.stop
          @keyup.229.stop
        />
        {{ fontSize }}px
      </label>
    </div>

    <div
      class="window-title-balloon"
      v-show="windowInfo.isMinimizeAnimationEnd"
    >
      <span v-if="windowInfo.title">{{ windowInfo.title }}</span>
      <span v-else v-t="`${windowInfo.type}.window-title`"></span>
    </div>

    <!-- コンテンツ -->
    <div class="_contents" @wheel.stop>
      <keep-alive>
        <component
          :is="windowInfo.type"
          :windowInfo="windowInfo"
          :status="status"
          :style="{ fontSize: fontSize + 'px' }"
          :isResizing="isResizing"
          v-if="!isMoving || !windowInfo.declare.isMovingRendering"
          @adjustWidth="adjustWidth"
        />
      </keep-alive>
    </div>

    <!-- サイズ変更つまみ -->
    <template
      v-if="
        windowInfo.declare.resizable && !windowInfo.isMinimized && !isMoving
      "
    >
      <resize-knob
        side="left-top"
        @leftDown="leftDown"
        v-if="horizontalArrangeable && verticalArrangeable"
      />
      <resize-knob
        side="left-bottom"
        @leftDown="leftDown"
        v-if="horizontalArrangeable && verticalArrangeable"
      />
      <resize-knob
        side="right-top"
        @leftDown="leftDown"
        v-if="horizontalArrangeable && verticalArrangeable"
      />
      <resize-knob
        side="right-bottom"
        @leftDown="leftDown"
        v-if="horizontalArrangeable && verticalArrangeable"
      />
      <resize-knob
        side="top"
        @leftDown="leftDown"
        :fontSizeChangeBan="fontSizeChangeBan"
        v-if="verticalArrangeable"
      />
      <resize-knob
        side="left"
        @leftDown="leftDown"
        v-if="horizontalArrangeable"
      />
      <resize-knob
        side="right"
        @leftDown="leftDown"
        v-if="horizontalArrangeable"
      />
      <resize-knob
        side="bottom"
        @leftDown="leftDown"
        v-if="verticalArrangeable"
      />
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { WindowInfo, WindowMoveInfo, WindowResizeInfo } from "@/@types/window";
import { Point, Rectangle, Size } from "address";
import ResizeKnob from "./ResizeKnob.vue";
import TaskManager, { MouseMoveParam } from "../task/TaskManager";
import TaskProcessor from "../task/TaskProcessor";
import { Task, TaskResult } from "task";
import {
  createPoint,
  createRectangle,
  createSize,
  getEventPoint,
  getWindowSize
} from "../Coordinate";
import TitleIcon from "./TitleIcon.vue";
import WindowManager from "./WindowManager";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import VueEvent from "@/app/core/decorator/VueEvent";
import { getCssPxNum } from "@/app/core/Css";

@Component({
  components: { TitleIcon, ResizeKnob }
})
export default class WindowFrame extends Vue {
  @Prop({ type: Object, required: true })
  private windowInfo!: WindowInfo<unknown>;
  @Prop({ type: String, required: true })
  private status!: string;

  private dragFrom: Point = createPoint(0, 0);

  protected fontSize: number = 12;
  private standImageSize: string = "192*256";
  private standImageWidth: number = 192;
  private standImageHeight: number = 256;
  private isMounted: boolean = false;
  private isResizing: boolean = false;
  private isMoving: boolean = false;

  @LifeCycle
  private async mounted() {
    WindowFrame.addEventForIFrame(this.windowElm);
    this.isMounted = true;
  }

  @LifeCycle
  private destroyed() {
    // window.console.log(`WindowFrame destroyed: ${this.windowInfo.key}`);
  }

  private get key(): string {
    return this.windowInfo.key;
  }

  private get fontSizeChangeBan(): boolean {
    return (
      this.isMoving ||
      !this.windowInfo.declare.fontSizePickable ||
      this.windowInfo.isMinimized
    );
  }

  @VueEvent
  private get horizontalArrangeable(): boolean {
    const minSize = this.windowInfo.declare.minSize;
    const maxSize = this.windowInfo.declare.maxSize;
    return !(
      minSize &&
      maxSize &&
      minSize.widthEm === maxSize.widthEm &&
      minSize.widthRem === maxSize.widthRem &&
      minSize.widthPx === maxSize.widthPx &&
      minSize.widthScrollBar === maxSize.widthScrollBar
    );
  }

  @VueEvent
  private get verticalArrangeable(): boolean {
    const minSize = this.windowInfo.declare.minSize;
    const maxSize = this.windowInfo.declare.maxSize;
    return !(
      minSize &&
      maxSize &&
      minSize.heightEm === maxSize.heightEm &&
      minSize.heightRem === maxSize.heightRem &&
      minSize.heightPx === maxSize.heightPx &&
      minSize.heightScrollBar === maxSize.heightScrollBar
    );
  }

  @VueEvent
  private async leftDown(
    event: MouseEvent | TouchEvent,
    side?: string
  ): Promise<void> {
    if (this.windowInfo.isMinimized) return;
    TaskManager.instance.setTaskParam<MouseMoveParam>("mouse-moving-finished", {
      key: this.key,
      type: side || ""
    });
    TaskManager.instance.setTaskParam<MouseMoveParam>(
      "mouse-move-end-left-finished",
      {
        key: this.key,
        type: side || ""
      }
    );
    this.isResizing = !!side;
    this.dragFrom = getEventPoint(event);
    await this.activeWindow();
  }

  private async activeWindow() {
    if (this.windowInfo.isMinimized) return;
    await TaskManager.instance.ignition<string, never>({
      type: "window-active",
      owner: "Quoridorn",
      value: this.key
    });
  }

  @TaskProcessor("mouse-move-end-left-finished")
  private async mouseLeftUpFinished(
    task: Task<Point, never>,
    param: MouseMoveParam
  ): Promise<TaskResult<never> | void> {
    const point = task.value!;

    this.windowInfo.x += this.windowInfo.diffRect.x;
    this.windowInfo.y += this.windowInfo.diffRect.y;
    this.windowInfo.widthPx += this.windowInfo.diffRect.width;
    this.windowInfo.heightPx += this.windowInfo.diffRect.height;

    this.windowInfo.diffRect.x = 0;
    this.windowInfo.diffRect.y = 0;
    this.windowInfo.diffRect.width = 0;
    this.windowInfo.diffRect.height = 0;

    this.isResizing = false;

    TaskManager.instance.setTaskParam("mouse-moving-finished", null);
    TaskManager.instance.setTaskParam("mouse-move-end-left-finished", null);

    // 移動
    if (param && !param.type && param.key === this.key) {
      // 画面の移動を発火
      this.isMoving = false;
      await TaskManager.instance.ignition<WindowMoveInfo, never>({
        type: "window-move-end",
        owner: "Quoridorn",
        value: {
          point,
          windowKey: this.windowInfo.key
        }
      });
    }

    task.resolve();
  }

  @TaskProcessor("mouse-moving-finished")
  private async mouseMoveFinished(
    task: Task<Point, never>,
    param: MouseMoveParam
  ): Promise<TaskResult<never> | void> {
    if (param.key !== this.key) return;
    const point = task.value!;

    // 移動
    if (!param.type) {
      this.windowInfo.diffRect.x = point.x - this.dragFrom.x;
      this.windowInfo.diffRect.y = point.y - this.dragFrom.y;
      this.windowInfo.diffRect.width = 0;
      this.windowInfo.diffRect.height = 0;

      this.isMoving = true;

      task.resolve();

      await TaskManager.instance.ignition<WindowMoveInfo, never>({
        type: "window-moving",
        owner: "Quoridorn",
        value: {
          point,
          windowKey: this.key
        }
      });
      return;
    }

    // サイズ変更不可なら処理終了
    if (!this.windowInfo.declare.resizable) {
      task.resolve();
      return;
    }

    this.windowInfo.diffRect.x = 0;
    this.windowInfo.diffRect.y = 0;
    this.windowInfo.diffRect.width = 0;
    this.windowInfo.diffRect.height = 0;
    if (param.type.indexOf("left") > -1) {
      this.windowInfo.diffRect.width = this.dragFrom.x - point.x;
      this.windowInfo.diffRect.x = -this.windowInfo.diffRect.width;
    }
    if (param.type.indexOf("right") > -1) {
      this.windowInfo.diffRect.width = point.x - this.dragFrom.x;
    }
    if (param.type.indexOf("top") > -1) {
      this.windowInfo.diffRect.height = this.dragFrom.y - point.y;
      this.windowInfo.diffRect.y = -this.windowInfo.diffRect.height;
    }
    if (param.type.indexOf("bottom") > -1) {
      this.windowInfo.diffRect.height = point.y - this.dragFrom.y;
    }

    const simulationSize: Size = getWindowSize(this.windowInfo, this.windowElm);
    simulationSize.width += this.windowInfo.diffRect.width;
    simulationSize.height += this.windowInfo.diffRect.height;

    const correctSize: Size = {
      width: 0,
      height: 0
    };
    const minSize = this.windowInfo.declare.minSize;
    if (minSize) {
      if (simulationSize.width < getWindowSize(minSize, this.windowElm).width)
        correctSize.width =
          getWindowSize(minSize, this.windowElm).width - simulationSize.width;
      if (simulationSize.height < getWindowSize(minSize, this.windowElm).height)
        correctSize.height =
          getWindowSize(minSize, this.windowElm).height - simulationSize.height;
    }
    const maxSize = this.windowInfo.declare.maxSize;
    if (maxSize) {
      if (simulationSize.width > getWindowSize(maxSize, this.windowElm).width)
        correctSize.width =
          getWindowSize(maxSize, this.windowElm).width - simulationSize.width;
      if (simulationSize.height > getWindowSize(maxSize, this.windowElm).height)
        correctSize.height =
          getWindowSize(maxSize, this.windowElm).height - simulationSize.height;
    }

    if (param.type.indexOf("left") > -1)
      this.windowInfo.diffRect.x -= correctSize.width;
    if (param.type.indexOf("top") > -1)
      this.windowInfo.diffRect.y -= correctSize.height;
    this.windowInfo.diffRect.width += correctSize.width;
    this.windowInfo.diffRect.height += correctSize.height;

    task.resolve();
  }

  private get windowElm(): HTMLDivElement {
    return this.$refs["window-frame"] as HTMLDivElement;
  }

  @Watch("standImageSize", { immediate: true })
  private onChangeStandImageSize(standImageSize: string) {
    const split: string[] = standImageSize.split("*");
    this.standImageWidth = parseInt(split[0]);
    this.standImageHeight = parseInt(split[1]);
  }

  @VueEvent
  private async closeWindow(): Promise<void> {
    window.console.log("##### CLOSE WINDOW #####");
    await TaskManager.instance.ignition<string, never>({
      type: "window-close",
      owner: "Quoridorn",
      value: this.windowInfo.key
    });
  }

  @VueEvent
  private async storeRightPane(): Promise<void> {
    this.windowInfo.isMinimized = false;
    this.windowInfo.status = "right-pane";
    this.windowInfo.paneOrder = WindowManager.instance.windowInfoList.length;
    await TaskManager.instance.ignition<string, never>({
      type: "pane-relocation",
      owner: "Quoridorn",
      value: this.windowInfo.key
    });
  }

  @VueEvent
  private async minimizeWindow(): Promise<void> {
    await TaskManager.instance.ignition<string, never>({
      type: "window-minimize",
      owner: "Quoridorn",
      value: this.windowInfo.key
    });
  }

  @VueEvent
  private async normalizeWindow(): Promise<void> {
    await TaskManager.instance.ignition<string, never>({
      type: "window-normalize",
      owner: "Quoridorn",
      value: this.windowInfo.key
    });
    await this.activeWindow();
  }

  @VueEvent
  private standImageStyle(standImage: any, index: number): any {
    const locate = standImage.locate;
    return {
      width: `${this.standImageWidth}px`,
      height: `${this.standImageHeight}px`,
      left: `calc((100% - ${this.standImageWidth}px) * ${locate - 1} / 11)`,
      zIndex: index + 2
    };
  }

  public static addEventForIFrame(containerElm: HTMLElement): void {
    const elms: HTMLCollection = containerElm.getElementsByTagName("iFrame");
    Array.prototype.slice.call(elms).forEach((iFrameElm: HTMLIFrameElement) => {
      const dispatch = (event: MouseEvent | TouchEvent, type: string) => {
        const iFrameRect = iFrameElm.getBoundingClientRect();
        const point = getEventPoint(event);
        const evtObj = {
          clientX: point.x + iFrameRect.left,
          clientY: point.y + iFrameRect.top,
          button: "touches" in event ? 0 : event.button
        };
        document.dispatchEvent(new MouseEvent(type, evtObj));
      };
      // マウス移動
      const mouseMoveListener = (event: MouseEvent | TouchEvent) => {
        dispatch(event, "mousemove");
      };
      // タッチ移動
      const touchMoveListener = (event: TouchEvent) => {
        const iFrameRect = iFrameElm.getBoundingClientRect();
        const evtObj: any = {
          changedTouches: [
            {
              clientX: event.changedTouches[0]["pageX"] + iFrameRect.left,
              clientY: event.changedTouches[0]["pageY"] + iFrameRect.top
            }
          ]
        };
        document.dispatchEvent(new TouchEvent("touchmove", evtObj));
      };
      // クリック
      const clickListener = (event: MouseEvent | TouchEvent) => {
        dispatch(event, "click");
      };
      // マウス離す
      const mouseUpListener = (event: MouseEvent | TouchEvent) => {
        dispatch(event, "mouseUp");
      };
      const setListener = (elm: GlobalEventHandlers) => {
        if (!elm) return;
        if (!elm.onmousemove) elm.onmousemove = mouseMoveListener;
        if (!elm.ontouchmove) elm.ontouchmove = touchMoveListener;
        if (!elm.onmouseup) elm.onmouseup = mouseUpListener;
        if (!elm.onclick) elm.onclick = clickListener;
      };
      if (!iFrameElm.onload) {
        iFrameElm.onload = () => {
          try {
            const bodyElm = iFrameElm.contentWindow!.document;
            setListener(bodyElm);
            // コンテキストメニュー防止
            if (!bodyElm.oncontextmenu) bodyElm.oncontextmenu = () => false;
          } catch (error) {
            // window.console.warn(error);
            /* nothing */
          }
        };
      }
      setListener(iFrameElm);
    });
  }

  @VueEvent
  private adjustWidth() {
    const maxSize = this.windowInfo.declare.maxSize;
    if (maxSize && this.windowInfo.widthPx > maxSize.widthPx)
      this.windowInfo.widthPx = maxSize.widthPx;

    const minSize = this.windowInfo.declare.minSize;
    if (minSize && this.windowInfo.widthPx < minSize.widthPx)
      this.windowInfo.widthPx = minSize.widthPx;
  }

  @Watch("isMounted")
  @Watch("windowInfo.diffRect.x")
  @Watch("windowInfo.x")
  @Watch("windowInfo.diffRect.y")
  @Watch("windowInfo.y")
  private onChangeWindowLocation() {
    if (!this.isMounted) return;
    const x = this.windowInfo.x + this.windowInfo.diffRect.x;
    // this.windowElm.style.setProperty("--windowX", `${x}px`);
    const y = this.windowInfo.y + this.windowInfo.diffRect.y;
    // this.windowElm.style.setProperty("--windowY", `${y}px`);
    this.windowElm.style.transform = `translate(${x}px, ${y}px)`;
  }

  @Watch("isMounted")
  @Watch("windowInfo.diffRect.y")
  @Watch("windowInfo.y")
  private onChangeWindowY() {
    if (!this.isMounted) return;
  }

  @Watch("isMounted")
  @Watch("windowInfo.diffRect.width")
  @Watch("windowInfo.widthPx")
  private async onChangeWindowWidth() {
    if (!this.isMounted) return;
    const scrollBarWidth = getCssPxNum("--scroll-bar-width");
    const widthPx = this.windowInfo.widthPx + this.windowInfo.diffRect.width;
    const widthEm = this.windowInfo.widthEm;
    const widthRem = this.windowInfo.widthRem;
    const widthScrollBar = this.windowInfo.widthScrollBar * scrollBarWidth;
    this.windowElm.style.setProperty("--windowWidthPx", `${widthPx}px`);
    this.windowElm.style.setProperty("--windowWidthEm", `${widthEm}em`);
    this.windowElm.style.setProperty("--windowWidthRem", `${widthRem}rem`);
    this.windowElm.style.setProperty(
      "--windowWidthScrollBar",
      `${widthScrollBar}px`
    );
    await TaskManager.instance.ignition<WindowResizeInfo, never>({
      type: "window-resize",
      owner: "Quoridorn",
      value: {
        key: this.key,
        status: this.status
      }
    });
  }

  @Watch("isMounted")
  @Watch("windowInfo.diffRect.height")
  @Watch("windowInfo.heightPx")
  @Watch("windowInfo.heightEm")
  private async onChangeWindowHeight() {
    if (!this.isMounted) return;
    const scrollBarWidth = getCssPxNum("--scroll-bar-width");
    const heightPx = this.windowInfo.heightPx + this.windowInfo.diffRect.height;
    const heightEm = this.windowInfo.heightEm;
    const heightRem = this.windowInfo.heightRem;
    const heightScrollBar = this.windowInfo.heightScrollBar * scrollBarWidth;
    this.windowElm.style.setProperty("--windowHeightPx", `${heightPx}px`);
    this.windowElm.style.setProperty("--windowHeightEm", `${heightEm}em`);
    this.windowElm.style.setProperty("--windowHeightRem", `${heightRem}rem`);
    this.windowElm.style.setProperty(
      "--windowHeightScrollBar",
      `${heightScrollBar}px`
    );
    await TaskManager.instance.ignition<WindowResizeInfo, never>({
      type: "window-resize",
      owner: "Quoridorn",
      value: {
        key: this.key,
        status: this.status
      }
    });
  }

  @Watch("isMounted")
  @Watch("fontSize")
  private async onChangeFontSize() {
    if (!this.isMounted) return;
    this.windowElm.style.setProperty("--windowFontSize", `${this.fontSize}px`);

    await TaskManager.instance.ignition<{ key: string; size: number }, never>({
      type: "window-font-size",
      owner: "Quoridorn",
      value: {
        key: this.windowInfo.key,
        size: this.fontSize
      }
    });
  }

  @Watch("isMounted")
  @Watch("windowInfo.order")
  private onChangeOrder() {
    if (!this.isMounted) return;
    this.windowElm.style.setProperty(
      "--windowOrder",
      this.windowInfo.order.toString()
    );
  }

  @Watch("isMounted")
  @Watch("windowInfo.minimizeIndex")
  private onChangeMinimizeIndex() {
    if (!this.isMounted) return;
    this.windowElm.style.setProperty(
      "--windowMinimizeIndex",
      this.windowInfo.minimizeIndex.toString()
    );
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.window-frame {
  position: fixed;
  visibility: hidden;
  display: block;
  padding: calc(var(--window-padding) + var(--window-title-height))
    var(--window-padding) var(--window-padding) var(--window-padding);
  overflow: visible;
  min-height: 50px;
  border-radius: 8px 8px 0 0;
  background-color: var(--theme-color);
  box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.6);
  border: solid gray 1px;
  box-sizing: border-box;
  left: 0;
  top: 0;
  -webkit-font-smoothing: subpixel-antialiased;
  width: calc(
    var(--windowWidthPx) + var(--windowWidthEm) + var(--windowWidthRem) +
      var(--windowWidthScrollBar) + var(--scroll-bar-width) +
      var(--window-padding) * 2 + 2px
  );
  height: calc(
    var(--windowHeightPx) + var(--windowHeightEm) + var(--windowHeightRem) +
      var(--windowHeightScrollBar) + var(--window-title-height) +
      var(--window-padding) * 2
  );
  font-size: var(--windowFontSize);
  z-index: var(--windowOrder);

  &.minimized {
    width: 100px !important;
    height: var(--window-title-height) !important;
    left: 100%;
    top: 100%;
    transform: translateX(
        calc(
          0px + -100% *
            (var(--windowMinimizeLength) - var(--windowMinimizeIndex))
        )
      )
      translateY(calc(-50%)) translateZ(0) !important;
    transition-property: all;
    transition-delay: 0ms;
    transform-origin: right;
    transition-timing-function: linear;
    transition-duration: 250ms;

    .window-title {
      cursor: default;
      background-color: red;

      &:hover ~ .window-title-balloon {
        visibility: visible;
      }
    }

    ._contents {
      /*visibility: hidden;*/
    }
  }

  img,
  button {
    white-space: nowrap;
  }
}

.window-title-balloon {
  visibility: hidden;
  display: block;
  position: absolute;
  top: calc(var(--window-title-height) * -1 - 1px);
  line-height: var(--window-title-height);
  right: 0.5em;
  padding: 0 0.5em;
  min-width: 5em;
  text-align: left;
  background-color: white;
  border-color: gray;
  border-style: solid;
  border-left-width: 1px;
  border-right-width: 1px;
  border-top-width: 1px;
  border-bottom: 0;
  font-size: 1rem;
}

.window-info-balloon {
  display: block;
  z-index: 2;
  visibility: hidden;
  font-size: 1rem;
  position: absolute;
  top: calc(var(--window-title-height) * -1 - 1px);
  line-height: var(--window-title-height);
  left: 0.5em;
  padding: 0 0.5rem;
  text-align: left;
  background-color: white;
  border-color: gray;
  border-style: solid;
  border-left-width: 1px;
  border-right-width: 1px;
  border-top-width: 1px;
  border-bottom: 0;

  &:hover {
    visibility: visible;
  }

  &.fontSizeChangeBan {
    visibility: hidden !important;
  }

  .fontSizeSlider {
    @include flex-box(row, center, center);
    color: #444;

    input[type="range"] {
      -webkit-appearance: none;
      background-image: linear-gradient(
        to bottom,
        rgb(160, 166, 162) 0%,
        rgb(201, 199, 200) 100%
      );
      height: 0.4em;
      width: 5rem;
      margin: 0;
      border-radius: 0.3em;
      border: 1px solid rgb(167, 167, 167);
      border-top: 1px solid rgb(105, 110, 106);
      box-sizing: border-box;
      cursor: pointer;

      &::-webkit-slider-thumb {
        -webkit-appearance: none;
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

._contents {
  width: 100%;
  height: 100%;
  z-index: 1;
  overflow-x: visible;
  overflow-y: scroll;
}

.window-title {
  @include flex-box(row, flex-end, center);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  background-color: var(--theme-color-accent);
  height: var(--window-title-height);
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
    margin-right: auto;
  }

  &:hover + .window-info-balloon {
    visibility: visible;
  }
}

.standImage {
  position: absolute;
  bottom: calc(100% + 1px);

  &:hover {
    outline: solid 1px magenta;
  }
}
</style>
