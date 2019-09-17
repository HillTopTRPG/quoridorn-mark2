<template>
  <div
    :style="windowStyle"
    :id="displayProperty"
    @mousedown.stop
    @mouseup.stop="event => mouseUp(event, 1)"
    @touchcancel.stop="event => mouseUp(event, 2)"
    @touchend.stop="event => mouseUp(event, 3)"
    @touchstart.stop="deckHoverKey(displayProperty)"
    class="window"
    :class="{ isSmall: isSmall }"
  >
    <!-- タイトルバー -->
    <div
      class="window-title"
      :class="{ fix: isFix }"
      @mousedown.left.stop="event => move(event, true)"
      @mouseup.left.stop="event => move(event, false)"
      @touchstart.stop="event => move(event, true, true)"
      @touchend.stop="event => move(event, false, true)"
      @touchcancel.stop="event => move(event, false, true)"
      @contextmenu.prevent
    >
      <!-- タイトル文言 -->
      <div class="title-message-area">
        <span>{{ titleText }}</span>
        <span class="message" v-if="message">{{ message }}</span>
      </div>

      <!-- 閉じるボタン -->
      <span class="title-icon-area" v-if="!isBanClose">
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
    <window-frame-knob name="corner-left-top" @resize="resize" v-if="!isFix" />
    <window-frame-knob
      name="corner-left-bottom"
      @resize="resize"
      v-if="!isFix"
    />
    <window-frame-knob name="corner-right-top" @resize="resize" v-if="!isFix" />
    <window-frame-knob
      name="corner-right-bottom"
      @resize="resize"
      v-if="!isFix"
    />
    <window-frame-knob name="side-top" @resize="resize" v-if="!isFix" />
    <window-frame-knob name="side-left" @resize="resize" v-if="!isFix" />
    <window-frame-knob name="side-right" @resize="resize" v-if="!isFix" />
    <window-frame-knob name="side-bottom" @resize="resize" v-if="!isFix" />
  </div>
</template>

<script lang="ts">
import WindowFrameKnob from "./WindowFrameKnob.vue";

import { Component, Emit, Prop, Vue, Watch } from "vue-property-decorator";
import { Mutation } from "vuex-class";

const windowInfo = require("./window.yaml");

@Component({
  components: { WindowFrameKnob }
})
export default class TestWindow extends Vue {
  @Mutation("setIsMapOverEvent") private setIsMapOverEvent: any;
  @Mutation("setMapMoveObj") private setMapMoveObj: any;
  @Mutation("setIsMapMoving") private setIsMapMoving: any;

  @Prop({ type: String, required: true })
  private titleText!: string;

  @Prop({ type: String, required: true })
  private displayProperty!: string;

  @Prop({ type: String, required: true })
  private align!: string;

  @Prop({ type: String })
  private baseSize!: string | null;

  @Prop({ type: String })
  private fixSize!: string | null;

  @Prop({ type: Boolean, default: false })
  private isBanClose!: boolean;

  @Prop({ type: Boolean, default: false })
  private fontSizeBar!: boolean;

  @Prop({ type: Boolean, default: false })
  private standImageSizeChooser!: boolean;

  @Prop({ type: String })
  private message!: string | null;

  private moveMode: string = "";
  private mouse: any = {
    x: 0,
    y: 0,
    saveX: 0,
    saveY: 0
  };

  public windowFactor: any = {
    l: 0, // left
    r: 0, // right
    t: 0, // top
    b: 0, // bottom
    w: 0, // width
    h: 0, // height
    draggingX: 0,
    draggingY: 0
  };

  private isSmall: boolean = false;

  private fontSize: number = 12;
  private standImageSize: string = "192*256";
  private standImageWidth: number = 192;
  private standImageHeight: number = 256;

  @Watch("standImageSize", { immediate: true })
  private onChangeStandImageSize(standImageSize: string) {
    const split: string[] = standImageSize.split("*");
    this.standImageWidth = parseInt(split[0]);
    this.standImageHeight = parseInt(split[1]);
  }

  private mounted(): void {
    window.console.log("----------");
    window.console.log(windowInfo);
    window.console.log("----------");

    const _ = this;
    document.addEventListener("mousemove", event => {
      _.mouse.x = event.pageX;
      _.mouse.y = event.pageY;
      _.reflesh();
    });
    document.addEventListener("touchmove", event => {
      _.mouse.x = event.changedTouches[0].pageX;
      _.mouse.y = event.changedTouches[0].pageY;
      _.reflesh();
    });
    this.addEventForIFrame();
  }

  private closeWindow(this: any): void {
    window.console.log(`close window`);
    this.isSmall = !this.isSmall;
  }

  private mouseUp(event: any, num: number): void {
    const evtObj = {
      clientX: event.pageX,
      clientY: event.pageY,
      button: event.button
    };
    if (event.button === 2) {
      this.setIsMapOverEvent(true);
    }
    const gameTableElm = document.getElementById("mapBoardFrame");
    const evt = document.createEvent("MouseEvents");
    evt.initMouseEvent(
      "mouseup",
      true,
      true,
      window,
      1,
      event.screenX,
      event.screenY,
      event.clientX,
      event.clientY,
      event.ctrlKey,
      event.altKey,
      event.shiftKey,
      event.metaKey,
      event.buttons,
      gameTableElm
    );
    // gameTableElm!.dispatchEvent(new MouseEvent("mouseUp", evtObj));
    gameTableElm!.dispatchEvent(evt);
  }

  private resize(
    this: any,
    event: any,
    direct: string,
    flg: boolean,
    isTouch: boolean
  ): void {
    if (flg) {
      this.mouse.saveX = isTouch
        ? event.changedTouches[0]["pageX"]
        : event.pageX;
      this.mouse.saveY = isTouch
        ? event.changedTouches[0]["pageY"]
        : event.pageY;
    } else {
      const moveMode = this.moveMode;
      const winFac = this.windowFactor;
      // window.console.log(this.moveMode, winFac.x, winFac.y, winFac.w, winFac.h, winFac.draggingX, winFac.draggingY)
      if (moveMode.indexOf("right") >= 0) {
        winFac.r -= winFac.draggingX;
        winFac.w += winFac.draggingX;
      }
      if (moveMode.indexOf("left") >= 0) {
        winFac.l += winFac.draggingX;
        winFac.w -= winFac.draggingX;
      }
      if (moveMode.indexOf("top") >= 0) {
        winFac.t += winFac.draggingY;
        winFac.h -= winFac.draggingY;
      }
      if (moveMode.indexOf("bottom") >= 0) {
        winFac.b -= winFac.draggingY;
        winFac.h += winFac.draggingY;
      }
      winFac.draggingX = 0;
      winFac.draggingY = 0;
      this.mouseUp(event, 4);
    }
    this.moveMode = flg ? direct : "";
  }

  private reflesh(this: any): void {
    switch (this.moveMode) {
      case "side-top":
      case "side-bottom":
      case "corner-left-top":
      case "corner-left-bottom":
      case "corner-right-top":
      case "corner-right-bottom":
      case "move":
        this.windowFactor.draggingY = this.mouse.y - this.mouse.saveY;
    }
    switch (this.moveMode) {
      case "side-left":
      case "side-right":
      case "corner-left-top":
      case "corner-left-bottom":
      case "corner-right-top":
      case "corner-right-bottom":
      case "move":
        this.windowFactor.draggingX = this.mouse.x - this.mouse.saveX;
    }
  }

  private move(event: any, isStart: boolean, isTouch: boolean): void {
    if (isStart) {
      this.mouse.saveX = isTouch
        ? event.changedTouches[0]["pageX"]
        : event.pageX;
      this.mouse.saveY = isTouch
        ? event.changedTouches[0]["pageY"]
        : event.pageY;
      this.setMapMoveObj(this.displayProperty);
      this.setIsMapMoving(true);
    } else {
      this.setIsMapMoving(false);
      this.windowFactor.r -= this.windowFactor.draggingX;
      this.windowFactor.t += this.windowFactor.draggingY;
      this.windowFactor.l += this.windowFactor.draggingX;
      this.windowFactor.b -= this.windowFactor.draggingY;
      this.windowFactor.draggingX = 0;
      this.windowFactor.draggingY = 0;
      this.mouseUp(event, 5);
    }
    this.moveMode = isStart ? "move" : "";
  }

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
  private get isFix(this: any): boolean {
    return this.fixSize !== undefined;
  }
  private get fixW(this: any): number {
    return !this.isFix ? -1 : parseInt(this.fixSize.split(",")[0].trim(), 10);
  }
  private get fixH(this: any): number {
    return !this.isFix ? -1 : parseInt(this.fixSize.split(",")[1].trim(), 10);
  }
  private get base(this: any): any {
    if (!this.baseSize) {
      return { w: 0, h: 0 };
    }
    return {
      w: parseInt(this.baseSize.split(",")[0].trim(), 10),
      h: parseInt(this.baseSize.split(",")[1].trim(), 10)
    };
  }

  @Emit("windowStyle")
  @Watch("windowStyle")
  private onChangeWindowStyle(windowStyle: any) {}

  private get windowStyle(this: any): any {
    const moveMode = this.moveMode;
    const winFac = this.windowFactor;

    let left = winFac.l;
    let bottom = winFac.b;
    let right = winFac.r;
    let top = winFac.t;
    let height = winFac.h;
    let width = winFac.w;

    if (moveMode.indexOf("top") >= 0 || moveMode === "move") {
      top += winFac.draggingY;
      if (moveMode.indexOf("top") >= 0) {
        height -= winFac.draggingY;
      }
    }

    if (moveMode.indexOf("bottom") >= 0 || moveMode === "move") {
      bottom -= winFac.draggingY;
      if (moveMode.indexOf("bottom") >= 0) {
        height += winFac.draggingY;
      }
    }

    if (moveMode.indexOf("right") >= 0 || moveMode === "move") {
      right -= winFac.draggingX;
      if (moveMode.indexOf("right") >= 0) {
        width += winFac.draggingX;
      }
    }

    if (moveMode.indexOf("left") >= 0 || moveMode === "move") {
      left += winFac.draggingX;
      if (moveMode.indexOf("left") >= 0) {
        width -= winFac.draggingX;
      }
    }

    const obj: any = {
      left: this.align.indexOf("left") >= 0 ? left + "px" : undefined,
      right: this.align.indexOf("right") >= 0 ? right + "px" : undefined,
      top: this.align.indexOf("top") >= 0 ? top + 37 + "px" : undefined,
      bottom: this.align.indexOf("bottom") >= 0 ? bottom + "px" : undefined
    };
    if (
      this.align.indexOf("left") < 0 &&
      this.align.indexOf("right") < 0 &&
      this.align.indexOf("top") < 0 &&
      this.align.indexOf("bottom") < 0
    ) {
      if (this.isFix) {
        // obj.left = `calc((100% - ${this.fixW}px) / 2 + ${left}px)`
        obj.left = `calc(50% - ${this.fixW / 2 - left}px)`;
        obj.top = `calc(50% - ${this.fixH / 2 - top}px)`;
      } else {
        obj.left =
          this.base.w > 0
            ? `calc(50% - ${this.base.w / 2 - left}px)`
            : `calc(${-this.base.w / 2 + left}px)`;
        obj.top =
          this.base.h > 0
            ? `calc(50% - ${this.base.h / 2 - top}px)`
            : `calc(${-this.base.h / 2 + top}px)`;
      }
    }
    if (this.isFix) {
      obj.width = this.fixW + "px";
      obj.height = this.fixH + "px";
    } else {
      obj.width =
        this.base.w > 0
          ? `${this.base.w + width}px`
          : `calc(100% - ${-this.base.w - width + 10}px)`;
      obj.height =
        this.base.h > 0
          ? `${this.base.h + height}px`
          : `calc(100% - ${-this.base.h - height - 10}px)`;
    }
    return obj;
  }
}
</script>

<style scoped lang="scss">
@import "../../../../../assets/common.scss";

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

.side-left,
.side-right,
.side-top,
.side-bottom,
.corner-left-top,
.corner-left-bottom,
.corner-right-top,
.corner-right-bottom {
  position: absolute;
  z-index: 90;
}

.side-left,
.side-right {
  top: 8px;
  width: 10px;
  height: calc(100% - 12px);
}

.side-top,
.side-bottom {
  left: 8px;
  height: 10px;
  width: calc(100% - 12px);
}

.corner-left-top,
.corner-left-bottom,
.corner-right-top,
.corner-right-bottom {
  width: 10px;
  height: 10px;
}

.side-left,
.corner-left-top,
.corner-left-bottom {
  left: -4px;
}
.side-right,
.corner-right-top,
.corner-right-bottom {
  right: -4px;
}
.side-top,
.corner-left-top,
.corner-right-top {
  top: -4px;
}
.side-bottom,
.corner-left-bottom,
.corner-right-bottom {
  bottom: -4px;
}

.side-left {
  cursor: w-resize;
}
.side-right {
  cursor: e-resize;
}
.side-top {
  cursor: n-resize;
}
.side-bottom {
  cursor: s-resize;
}
.corner-left-top {
  cursor: nw-resize;
}
.corner-left-bottom {
  cursor: sw-resize;
}
.corner-right-top {
  cursor: ne-resize;
  border-radius: 0 8px 0 0;
}
.corner-right-bottom {
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
