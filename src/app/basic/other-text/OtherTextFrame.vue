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
import { Point } from "@/@types/address";
import { OtherTextViewInfo } from "@/@types/gameObject";
import { getCssPxNum } from "@/app/core/Css";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "@/@types/task";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import { MouseMoveParam } from "@/app/core/task/TaskManager";

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

  private key = "OtherTextFrame";

  @LifeCycle
  public async mounted() {
    this.isMounted = true;
  }

  @Watch("isMounted")
  @Watch("otherTextViewInfo", { deep: true })
  private onChangeInfo() {
    this.rawText = this.otherTextViewInfo.text;
    if (!this.isMounted) return;
    const gridSize = getCssPxNum(
      "--gridSize",
      document.getElementById("gameTable")!
    );
    const info = this.otherTextViewInfo;
    const x = info.point.x + info.columns * gridSize;
    const y = info.point.y;
    this.elm.style.setProperty(`--x`, `${x}px`);
    this.elm.style.setProperty(`--y`, `${y}px`);
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
  left: calc(
    var(--x) + var(--margin-column) * var(--gridSize) + var(--totalLeftX) +
      var(--margin-border-width)
  );
  top: calc(
    var(--y) + var(--margin-row) * var(--gridSize) + var(--totalLeftY) +
      var(--margin-border-width)
  );
  transform: translateZ(var(--wheel, 0));
  background-color: white;
}
</style>
