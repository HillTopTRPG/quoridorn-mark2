<template>
  <div
    class="other-text-frame"
    @mouseover="onMouseOver"
    @mouseleave="onMouseOut"
    @wheel.stop
    ref="elm"
  >
    <other-text-component v-if="rawText != null" v-model="rawText" />
  </div>
</template>

<script lang="ts">
import { Component, Watch, Vue, Prop } from "vue-property-decorator";
import LifeCycle from "../../core/decorator/LifeCycle";
import OtherTextComponent from "./OtherTextComponent.vue";
import { Point } from "address";
import { OtherTextViewInfo } from "@/@types/gameObject";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import { MouseMoveParam } from "@/app/core/task/TaskManager";
import CssManager from "@/app/core/css/CssManager";

@Component({
  components: { OtherTextComponent }
})
export default class OtherTextFrame extends Vue {
  @Prop({ type: Object, default: null })
  private otherTextViewInfo!: OtherTextViewInfo;

  private rawText: string | null = null;
  private docId: string | null = null;
  private isMounted: boolean = false;

  private isHover: boolean = false;
  private isChanged: boolean = false;

  private wheel = 0;
  private translateX = 0;
  private translateY = 0;

  private key = "OtherTextFrame";

  @LifeCycle
  public async mounted() {
    this.isMounted = true;
    this.wheel = CssManager.instance.propMap.wheel;
  }

  @TaskProcessor("action-wheel-finished")
  private async actionWheelFinished(
    task: Task<boolean, never>
  ): Promise<TaskResult<never> | void> {
    setTimeout(() => {
      this.wheel = CssManager.instance.propMap.wheel;
      this.elm.style.transform = `translate(${this.translateX}px, ${this.translateY}px) translateZ(${this.wheel}px)`;
    });
  }

  @Watch("isMounted")
  @Watch("otherTextViewInfo", { deep: true })
  private onChangeInfo() {
    this.rawText = this.otherTextViewInfo.text;
    if (!this.isMounted) return;
    const gridSize = CssManager.instance.propMap.gridSize;
    const info = this.otherTextViewInfo;
    const x = info.point.x + info.columns * gridSize;
    const y = info.point.y;

    const marginColumns = CssManager.instance.propMap.marginColumn;
    const marginRows = CssManager.instance.propMap.marginRow;
    const totalLeftX = CssManager.instance.propMap.totalLeftX;
    const totalLeftY = CssManager.instance.propMap.totalLeftY;
    const marginBorderWidth = CssManager.instance.propMap.marginBorderWidth;

    this.translateX =
      x + marginColumns * gridSize + totalLeftX + marginBorderWidth;
    this.translateY =
      y + marginRows * gridSize + totalLeftY + marginBorderWidth;
    this.elm.style.transform = `translate(${this.translateX}px, ${this.translateY}px) translateZ(${this.wheel}px)`;
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
      await cc.touchModify(docId);
    } catch (err) {
      alert("他の人が操作中のオブジェクトのため、更新に失敗しました。");
      return;
    }
    await cc.update(docId, data);
  }

  private get elm(): HTMLElement {
    return this.$refs.elm as HTMLElement;
  }

  private onMouseOver() {
    this.isHover = true;
  }

  private onMouseOut() {
    this.isHover = false;
    if (!this.isHover) this.$emit("hide");
  }

  @TaskProcessor("other-text-hide-finished")
  private async otherTextHide(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    if (!this.isHover && !this.isChanged) this.$emit("hide");
    this.isChanged = false;
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
@import "../../../assets/common";

.other-text-frame {
  @include inline-flex-box(row, flex-start, flex-start);
  position: fixed;
  overflow: auto;
  left: 0;
  top: 0;
  background-color: white;
  /* JavaScriptで設定されるプロパティ
  transform
  */
}
</style>
