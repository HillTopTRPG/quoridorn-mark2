<template>
  <div
    id="text-frame"
    @mouseover="onMouseOver"
    @mouseleave="onMouseOut"
    @wheel.stop
    ref="elm"
  >
    <other-text-component v-if="rawText !== null" v-model="rawText" />
  </div>
</template>

<script lang="ts">
import { Component, Watch, Prop } from "vue-property-decorator";
import { Point, Rectangle, Size } from "address";
import { Task, TaskResult } from "task";
import { Mixins } from "vue-mixin-decorator";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { OtherTextViewInfo } from "@/@types/gameObject";
import {
  createPoint,
  createRectangle,
  createSize
} from "@/app/core/utility/CoordinateUtility";
import ComponentVue from "@/app/core/window/ComponentVue";
import OtherTextComponent from "@/app/basic/other-text/OtherTextComponent.vue";
import CssManager from "@/app/core/css/CssManager";
import { MouseMoveParam } from "@/app/core/task/TaskManager";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import VueEvent from "@/app/core/decorator/VueEvent";

@Component({
  components: { OtherTextComponent }
})
export default class TextFrame extends Mixins<ComponentVue>(ComponentVue) {
  @Prop({ type: Object, default: null })
  private otherTextViewInfo!: OtherTextViewInfo;

  private static DEFAULT_FONT_SIZE = 14;

  private rawText: string | null = null;
  private docId: string | null = null;
  private isMounted: boolean = false;

  private isHover: boolean = false;
  private isChanged: boolean = false;

  private wheel = 0;
  private translateX = 0;
  private translateY = 0;

  private maxSize: Size = createSize(0, 0);

  private fontSize = TextFrame.DEFAULT_FONT_SIZE;

  @LifeCycle
  public async mounted() {
    this.isMounted = true;
    this.wheel = CssManager.instance.propMap.wheel;
  }

  @TaskProcessor("action-wheel-finished")
  private async actionWheelFinished(
    task: Task<boolean, never>
  ): Promise<TaskResult<never> | void> {
    if (this.otherTextViewInfo.isFix) return;
    setTimeout(() => {
      this.wheel = CssManager.instance.propMap.wheel;
      this.elm.style.transform = `translate(${this.translateX}px, ${this.translateY}px) translateZ(${this.wheel}px)`;
    });
  }

  @Watch("isMounted")
  @Watch("otherTextViewInfo", { deep: true })
  private onChangeInfo() {
    const ws = createSize(window.innerWidth, window.innerHeight);

    this.rawText = this.otherTextViewInfo.text;
    if (!this.isMounted) return;
    const gridSize = CssManager.instance.propMap.gridSize;
    const info = this.otherTextViewInfo;
    const x = info.rect.x;
    const y = info.rect.y;

    const marginColumns = CssManager.instance.propMap.marginColumn;
    const marginRows = CssManager.instance.propMap.marginRow;
    const totalLeftX = CssManager.instance.propMap.totalLeftX;
    const totalLeftY = CssManager.instance.propMap.totalLeftY;
    const marginBorderWidth = CssManager.instance.propMap.marginBorderWidth;

    const mapPoint = createPoint(
      totalLeftX + marginBorderWidth,
      totalLeftY + marginBorderWidth
    );

    const translateZ = this.otherTextViewInfo.isFix ? 0 : this.wheel;

    this.translateX = x + info.rect.width;
    this.translateY = y;
    if (!this.otherTextViewInfo.isFix) {
      this.translateX += marginColumns * gridSize + mapPoint.x;
      this.translateY += marginRows * gridSize + mapPoint.y;
    }
    this.maxSize.width = ws.width - this.translateX;
    this.maxSize.height = ws.height - this.translateY;
    this.elm.style.maxWidth = `auto`;
    this.elm.style.maxHeight = `auto`;
    this.elm.style.transform = `translate(${this.translateX}px, ${this.translateY}px) translateZ(${translateZ}px)`;
    this.fontSize = TextFrame.DEFAULT_FONT_SIZE;
    this.elm.style.fontSize = `${this.fontSize}px`;

    setTimeout(() => {
      const rect = this.getRectangle();
      const ratioH = rect.height / ws.height;
      let fontSizeH = TextFrame.DEFAULT_FONT_SIZE;
      let fontSizeW = TextFrame.DEFAULT_FONT_SIZE;
      if (ratioH > 1) {
        fontSizeH = Math.floor(TextFrame.DEFAULT_FONT_SIZE / ratioH);
      }
      if (rect.x + rect.width > ws.width) {
        const useSpace = Math.max(
          this.otherTextViewInfo.rect.x,
          ws.width -
            this.otherTextViewInfo.rect.x -
            this.otherTextViewInfo.rect.width
        );
        this.maxSize.width = useSpace;
        this.elm.style.maxWidth = `${this.maxSize.width}px`;
        const ratioW = rect.width / useSpace;
        if (ratioW > 1) {
          fontSizeW = Math.floor(TextFrame.DEFAULT_FONT_SIZE / ratioW);
        }
      }
      this.fontSize = Math.min(this.fontSize, fontSizeH, fontSizeW);
      this.elm.style.fontSize = `${this.fontSize}px`;

      setTimeout(() => {
        const rect = this.getRectangle();
        if (rect.x + rect.width > ws.width) {
          if (rect.x - this.otherTextViewInfo.rect.width - rect.width > 0) {
            rect.x = rect.x - this.otherTextViewInfo.rect.width - rect.width;
          }
        }
        if (rect.y + rect.height > ws.height)
          rect.y = Math.max(ws.height - rect.height, 0);
        this.maxSize.width = ws.width - rect.x;
        this.maxSize.height = ws.height - rect.y;
        this.elm.style.maxWidth = `${this.maxSize.width}px`;
        this.elm.style.maxHeight = `${this.maxSize.height}px`;
        this.elm.style.transform = `translate(${rect.x}px, ${rect.y}px) translateZ(${translateZ}px)`;
      });
    });
  }

  private getRectangle(): Rectangle {
    const rect = this.elm.getBoundingClientRect();
    return createRectangle(rect.x, rect.y, rect.width, rect.height);
  }

  @Watch("rawText")
  private async onChangeRawText() {
    if (this.docId) {
      if (this.docId !== this.otherTextViewInfo.docId) {
        this.isChanged = true;
      } else {
        await this.updateOtherText();
      }
    }
    this.docId = this.otherTextViewInfo.docId;
  }

  private async updateOtherText() {
    const type = this.otherTextViewInfo.type;
    const docId = this.otherTextViewInfo.docId;
    const cc = SocketFacade.instance.getCC(type);
    const data: any = (await cc.getData(docId))!.data;
    data.otherText = this.rawText;
    try {
      await cc.touchModify([docId]);
    } catch (err) {
      alert("他の人が操作中のオブジェクトのため、更新に失敗しました。");
      return;
    }
    await cc.update([docId], [data]);
  }

  private get elm(): HTMLElement {
    return this.$refs.elm as HTMLElement;
  }

  @VueEvent
  private onMouseOver() {
    this.isHover = true;
  }

  @VueEvent
  private onMouseOut() {
    this.isHover = false;
    if (!this.isHover) this.$emit("hide");
  }

  @TaskProcessor("other-text-hide-finished")
  private async otherTextHide(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    setTimeout(() => {
      if (!this.isHover && !this.isChanged) this.$emit("hide");
      this.isChanged = false;
    });
    task.resolve();
  }

  @TaskProcessor("mouse-moving-finished")
  private async mouseLeftUpFinished(
    task: Task<Point, never>,
    param: MouseMoveParam
  ): Promise<TaskResult<never> | void> {
    if (!param || param.key !== this.otherTextViewInfo.docId) return;
    this.$emit("hide");
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

#text-frame {
  @include inline-flex-box(row, flex-start, flex-start);
  position: fixed;
  overflow: auto;
  left: 0;
  top: 0;
  background-color: white;
  border: 2px solid gray;
  /* JavaScriptで設定されるプロパティ
  transform
  */
}
</style>
