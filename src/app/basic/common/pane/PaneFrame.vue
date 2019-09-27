<template>
  <div class="pane-frame" ref="paneFrame">
    <!-- タイトルバー -->
    <div
      class="pane-frame-title"
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

      <!-- 通常化 -->
      <span class="title-icon-area">
        <i
          class="icon-arrow-up-right window-normalize"
          @click.left.stop="normalizeWindow"
          @keydown.space.stop="normalizeWindow"
          @keydown.enter.stop="normalizeWindow"
          @keydown.229.stop
          @keyup.229.stop
          :tabindex="0"
        ></i>
      </span>

      <!-- 閉じる -->
      <span class="title-icon-area">
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
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue, Watch } from "vue-property-decorator";
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
export default class PaneFrame extends Vue {
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
    this.isMounted = true;
  }

  private get key(): string {
    return `right-pane-${this.windowInfo.key}`;
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
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.pane-frame {
  position: relative;
  display: block;
  padding: 29px 8px 8px 8px;
  overflow: visible;
  min-height: 50px;
  /*background-color: rgba(255, 255, 255, 0.8);*/
  box-sizing: border-box;
  border-bottom: 1px solid gray;
  left: var(--windowX);
  top: var(--windowY);
  width: 100%;
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

._contents {
  width: 100%;
  height: 100%;
  z-index: 1;
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

  /*.title-icon-area {*/
  /*justify-self: flex-end;*/
  /*align-self: flex-end;*/
  /*}*/

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
