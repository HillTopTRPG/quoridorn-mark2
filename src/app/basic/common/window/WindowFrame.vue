<template>
  <div
    :id="key"
    :class="{ minimized: windowInfo.isMinimized }"
    @mousedown.left.stop="activeWindow()"
    @touchstart.stop="activeWindow()"
    ref="window"
  >
    <!-- タイトルバー -->
    <div
      class="window-title"
      :class="{ fix: !windowInfo.declare.resizable }"
      @mousedown.left.stop="leftDown($event)"
      @touchstart.stop="leftDown($event)"
      @contextmenu.prevent
    >
      <!-- タイトル文言 -->
      <div class="title-message-area">
        <span>{{ windowInfo.title }}</span>
        <span class="message" v-if="windowInfo.message">{{
          windowInfo.message
        }}</span>
      </div>

      <!-- 文字サイズ変更 -->
      <label
        v-if="windowInfo.declare.fontSizePickable && !windowInfo.isMinimized"
        class="fontSizeSlider"
        @click.prevent
      >
        文字サイズ{{ fontSize }}px
        <input
          type="range"
          min="10"
          max="18"
          v-model="fontSize"
          :tabindex="0"
          @mousedown.stop
          @keydown.enter.stop
          @keyup.enter.stop
          @keydown.229.stop
          @keyup.229.stop
        />
      </label>

      <!-- 最小化 -->
      <span class="title-icon-area" v-if="!windowInfo.isMinimized">
        <i
          class="icon-minus window-minimize"
          @click.left.stop="minimizeWindow"
          @keydown.space.stop="minimizeWindow"
          @keydown.enter.stop="minimizeWindow"
          @keydown.229.stop
          @keyup.229.stop
          :tabindex="0"
        ></i>
      </span>

      <!-- 通常化 -->
      <span class="title-icon-area" v-if="windowInfo.isMinimized">
        <i
          class="icon-arrow-up-left window-normalize"
          @click.left.stop="normalizeWindow"
          @keydown.space.stop="normalizeWindow"
          @keydown.enter.stop="normalizeWindow"
          @keydown.229.stop
          @keyup.229.stop
          :tabindex="0"
        ></i>
      </span>

      <!-- 閉じる -->
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

    <div class="window-title-balloon" v-if="windowInfo.isMinimizeAnimationEnd">
      {{ windowInfo.title }}
    </div>

    <!-- コンテンツ -->
    <component
      :is="windowInfo.type"
      :windowKey="windowInfo.key"
      class="_contents"
      :style="{ fontSize: fontSize + 'px' }"
      @wheel.stop
    />

    <!-- サイズ変更つまみ -->
    <template v-if="windowInfo.declare.resizable && !windowInfo.isMinimized">
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
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { WindowInfo, WindowMoveInfo } from "@/@types/window";
import { Point, Rectangle, Size } from "@/@types/address";
import ResizeKnob from "@/app/basic/common/window/ResizeKnob.vue";
import TaskManager, { MouseMoveParam } from "@/app/core/task/TaskManager";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task } from "@/@types/task";
import { createPoint, createRectangle } from "@/app/core/Coordinate";

@Component({
  components: { ResizeKnob }
})
export default class WindowFrame extends Vue {
  @Prop({ type: Object, required: true })
  private windowInfo!: WindowInfo;

  private dragFrom: Point = createPoint(0, 0);
  private diff: Rectangle = createRectangle(0, 0, 0, 0);

  private fontSize: number = 12;
  private standImageSize: string = "192*256";
  private standImageWidth: number = 192;
  private standImageHeight: number = 256;
  private isMounted: boolean = false;

  private mounted() {
    this.addEventForIFrame();
    this.isMounted = true;
  }

  private get key(): string {
    return this.windowInfo.key;
  }

  private leftDown(event: MouseEvent, side?: string): void {
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
    this.dragFrom = createPoint(event.pageX, event.pageY);
    this.activeWindow();
  }

  private async activeWindow() {
    if (this.windowInfo.isMinimized) return;
    await TaskManager.instance.ignition<string>({
      type: "window-active",
      owner: "Quoridorn",
      value: this.key
    });
  }

  @TaskProcessor("mouse-move-end-left-finished")
  private async mouseLeftUpFinished(
    task: Task<Point>,
    param: MouseMoveParam
  ): Promise<string | void> {
    const point = task.value!;

    this.windowInfo.x += this.diff.x;
    this.windowInfo.y += this.diff.y;
    this.windowInfo.width += this.diff.width;
    this.windowInfo.height += this.diff.height;

    this.diff.x = 0;
    this.diff.y = 0;
    this.diff.width = 0;
    this.diff.height = 0;

    TaskManager.instance.setTaskParam("mouse-moving-finished", null);
    TaskManager.instance.setTaskParam("mouse-move-end-left-finished", null);

    // 登録したタスクに完了通知
    if (task.resolve) task.resolve(task);

    // 移動
    if (param.key === this.key && !param.type) {
      // 画面の移動を発火
      await TaskManager.instance.ignition<Point>({
        type: "window-move-end",
        owner: "Quoridorn",
        value: point
      });
    }
  }

  @TaskProcessor("mouse-moving-finished")
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

      await TaskManager.instance.ignition<WindowMoveInfo>({
        type: "window-moving",
        owner: "Quoridorn",
        value: {
          mouse: point,
          windowKey: this.key
        }
      });
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

  private get windowElm(): HTMLDivElement {
    return this.$refs.window as HTMLDivElement;
  }

  @Watch("standImageSize", { immediate: true })
  private onChangeStandImageSize(standImageSize: string) {
    const split: string[] = standImageSize.split("*");
    this.standImageWidth = parseInt(split[0]);
    this.standImageHeight = parseInt(split[1]);
  }

  private async closeWindow(): Promise<void> {
    await TaskManager.instance.ignition<string>({
      type: "window-close",
      owner: "Quoridorn",
      value: this.key
    });
  }

  private async minimizeWindow(): Promise<void> {
    await TaskManager.instance.ignition({
      type: "window-minimize",
      owner: "Quoridorn",
      value: this.key
    });
  }

  private async normalizeWindow(): Promise<void> {
    await TaskManager.instance.ignition({
      type: "window-normalize",
      owner: "Quoridorn",
      value: this.key
    });
    this.activeWindow();
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

  private addEventForIFrame(): void {
    const elms: HTMLCollection = document.getElementsByTagName("iFrame");
    Array.prototype.slice.call(elms).forEach((iFrameElm: HTMLIFrameElement) => {
      const dispatch = (event: MouseEvent, type: string) => {
        const iFrameRect = iFrameElm.getBoundingClientRect();
        const evtObj = {
          clientX: event.pageX + iFrameRect.left,
          clientY: event.pageY + iFrameRect.top,
          button: event.button
        };
        document.dispatchEvent(new MouseEvent(type, evtObj));
      };
      // マウス移動
      const mouseMoveListener = (event: MouseEvent) => {
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
      const clickListener = (event: MouseEvent) => {
        dispatch(event, "click");
      };
      // マウス離す
      const mouseUpListener = (event: MouseEvent) => {
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
            /* nothing */
          }
        };
      }
      setListener(iFrameElm);
    });
  }

  @Watch("isMounted")
  @Watch("diff.x")
  @Watch("windowInfo.x")
  private onChangeWindowX() {
    if (!this.isMounted) return;
    const x = this.windowInfo.x + this.diff.x;
    this.windowElm.style.setProperty("--windowX", `${x}px`);
  }

  @Watch("isMounted")
  @Watch("diff.y")
  @Watch("windowInfo.y")
  private onChangeWindowY() {
    if (!this.isMounted) return;
    const y = this.windowInfo.y + this.diff.y;
    this.windowElm.style.setProperty("--windowY", `${y}px`);
  }

  @Watch("isMounted")
  @Watch("diff.width")
  @Watch("windowInfo.width")
  private onChangeWindowWidth() {
    if (!this.isMounted) return;
    const width = this.windowInfo.width + this.diff.width;
    this.windowElm.style.setProperty("--windowWidth", `${width}px`);
  }

  @Watch("isMounted")
  @Watch("diff.height")
  @Watch("windowInfo.height")
  private onChangeWindowHeight() {
    if (!this.isMounted) return;
    const height = this.windowInfo.height + this.diff.height;
    this.windowElm.style.setProperty("--windowHeight", `${height}px`);
  }

  @Watch("isMounted")
  @Watch("fontSize")
  private onChangeFontSize() {
    if (!this.isMounted) return;
    this.windowElm.style.setProperty("--windowFontSize", `${this.fontSize}px`);
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
@import "../../../../assets/common";

*[id^="window-"] {
  position: fixed;
  display: block;
  padding: 29px 8px 8px 8px;
  overflow: visible;
  min-height: 50px;
  border-radius: 8px 8px 0 0;
  background-color: var(--theme-color);
  box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.6);
  border: solid gray 1px;
  box-sizing: border-box;
  left: var(--windowX);
  top: var(--windowY);
  width: var(--windowWidth);
  height: var(--windowHeight);
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

.window-title-balloon {
  visibility: hidden;
  display: block;
  position: absolute;
  top: calc(var(--window-title-height) * -1 - 1px);
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

._contents {
  width: 100%;
  height: 100%;
  z-index: 1;
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

  .fontSizeSlider {
    @include flex-box(row, center, center);
    font-size: 10px;
    margin-right: auto;
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

  .title-icon-area i {
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

.standImage {
  position: absolute;
  bottom: calc(100% + 1px);

  &:hover {
    outline: solid 1px magenta;
  }
}
</style>
