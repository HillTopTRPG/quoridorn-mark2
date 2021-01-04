<template>
  <div class="container" ref="window-container">
    <img
      :src="thumbnailData"
      draggable="false"
      alt="Not Found"
      :title="thumbnailText"
      ref="image"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import { WindowMoveInfo } from "@/@types/window";
import { PlayBgmInfo } from "@/@types/room";
import { CutInStore, MediaStore } from "@/@types/store-data";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import WindowVue from "@/app/core/window/WindowVue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import { getImageSize } from "@/app/core/utility/FileUtility";
import { Size } from "@/@types/store-data-optional";

@Component({
  components: { CtrlButton }
})
export default class ImageViewWindow extends Mixins<
  WindowVue<PlayBgmInfo, never>
>(WindowVue) {
  @Prop({ type: Boolean, default: false })
  private isIpadTesting!: boolean;

  private cutInInfo: CutInStore | null = null;
  private mediaInfo: MediaStore | null = null;
  private imageSize: Size | null = null;
  private targetKey: string | null = null;
  private isWindowMoving = false;

  @TaskProcessor("window-moving-finished")
  private async windowMovingFinished(
    task: Task<WindowMoveInfo, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value!.windowKey !== this.windowKey) return;
    this.isWindowMoving = true;
    task.resolve();
  }

  @TaskProcessor("window-move-end-finished")
  private async windowMoveEndFinished(
    task: Task<WindowMoveInfo, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value!.windowKey !== this.windowKey) return;
    this.isWindowMoving = false;
    task.resolve();
  }

  @LifeCycle
  public async mounted() {
    await this.init();

    // targetKeyかdataはどちらかが設定されてくる
    let { targetKey, data } = this.windowInfo.args!;
    this.targetKey = targetKey;

    if (!data) {
      const cutInDataCC = SocketFacade.instance.cutInDataCC();
      data = (await cutInDataCC.findSingle("key", targetKey!))!.data!.data!;
    }
    const mediaCC = SocketFacade.instance.mediaCC();
    const mediaInfo = await mediaCC.findSingle("key", data.imageKey);
    if (!mediaInfo) {
      await this.close();
      return;
    }

    this.cutInInfo = data;
    this.mediaInfo = mediaInfo.data!.data!;

    // 初期サイズ調整
    this.imageSize = await getImageSize(this.mediaInfo!.url);
    const fitEdge = this.cutInInfo.fitEdge;
    if (fitEdge === "width") {
      const preferenceWidth = this.cutInInfo.imageWidth;
      this.imageSize!.height *= preferenceWidth / this.imageSize!.width;
      this.imageSize!.width = preferenceWidth;
    } else if (fitEdge === "height") {
      const preferenceHeight = this.cutInInfo.imageHeight;
      this.imageSize!.width *= preferenceHeight / this.imageSize!.height;
      this.imageSize!.height = preferenceHeight;
    }
    this.windowInfo.widthPx = this.imageSize!.width;
    this.windowInfo.heightPx = this.imageSize!.height;

    // タイトルバー文言設定
    const windowTitle = this.$t(
      `${this.windowInfo.type}.window-title`
    )!.toString();
    this.windowInfo.title = `${windowTitle}(${this.cutInInfo!.tag})`;
    this.windowInfo.message = this.cutInInfo!.title;

    // 画像表示向き設定
    let direction = "";
    if (this.cutInInfo.direction === "horizontal") direction = "scale(-1, 1)";
    if (this.cutInInfo.direction === "vertical") direction = "scale(1, -1)";
    if (this.cutInInfo.direction === "180") direction = "rotate(180deg)";
    (this.$refs.image as HTMLImageElement).style.setProperty(
      `--image-direction`,
      direction
    );

    this.thumbnailText = `【${this.cutInInfo.tag}】${this.cutInInfo.title}`;
    this.thumbnailData = this.mediaInfo.url;

    this.isMounted = true;
  }

  private isMounted: boolean = false;
  private viewSizeRatio: number = 1;
  private thumbnailData: string = "";
  private thumbnailText: string = "";

  @Watch("isMounted")
  @Watch("windowInfo.widthPx")
  private onChangeWindowWidth() {
    const windowWidth = this.windowInfo.widthPx;
    if (!this.imageSize) return;
    const ratio = windowWidth / this.imageSize.width;
    this.viewSizeRatio = ratio;
    this.windowInfo.heightPx = ratio * this.imageSize.height;
  }

  @Watch("windowInfo.heightPx")
  private onChangeWindowHeight() {
    const windowHeight = this.windowInfo.heightPx;
    if (!this.imageSize) return;
    const ratio = windowHeight / this.imageSize.height;
    this.viewSizeRatio = ratio;
    this.windowInfo.widthPx = ratio * this.imageSize.width;
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.container {
  @include flex-box(row, stretch, stretch);
  visibility: inherit;
  width: 100%;
  height: 100%;
}

img {
  display: block;
  width: 100%;
  height: 100%;
  transform: var(--image-direction);
  background-size: 100%;
}
</style>
