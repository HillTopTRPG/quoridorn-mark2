<template>
  <div class="container" ref="window-container">
    <chit-info-form
      :windowKey="windowKey"
      :isAdd="true"
      initTabTarget="image"
      :name.sync="name"
      :tag.sync="tag"
      :otherText.sync="otherText"
      :width.sync="width"
      :height.sync="height"
      :imageDocId.sync="imageDocId"
      :imageTag.sync="imageTag"
      :direction.sync="direction"
      :backgroundSize.sync="backgroundSize"
      :layerId.sync="layerId"
      @drag-start="dragStart"
      @drag-end="dragEnd"
    />
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import { AddObjectInfo } from "@/@types/data";
import { BackgroundSize, Direction } from "@/@types/room";
import LanguageManager from "@/LanguageManager";
import GameObjectManager from "@/app/basic/GameObjectManager";
import ChitInfoForm from "@/app/basic/object/chit/ChitInfoForm.vue";
import WindowVue from "@/app/core/window/WindowVue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import VueEvent from "@/app/core/decorator/VueEvent";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import TaskManager from "@/app/core/task/TaskManager";
import { ModeInfo } from "mode";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";

@Component({
  components: {
    ChitInfoForm
  }
})
export default class ChitAddWindow extends Mixins<WindowVue<string, never>>(
  WindowVue
) {
  private name: string = LanguageManager.instance.getText("type.chit");
  private tag: string = "";
  private otherText: string = "";
  private height: number = 1;
  private width: number = 1;
  private imageDocId: string | null = null;
  private imageTag: string | null = null;
  private direction: Direction = "none";
  private isMounted: boolean = false;
  private backgroundSize: BackgroundSize = "contain";
  private layerId: string = GameObjectManager.instance.sceneLayerList.find(
    ml => ml.data!.type === "character"
  )!.id!;

  @LifeCycle
  public async mounted() {
    await this.init();
    this.imageTag = LanguageManager.instance.getText("type.character");
    this.isMounted = true;
  }

  @Watch("imageDocId", { immediate: true })
  private onChangeImageDocId() {
    this.windowInfo.message = LanguageManager.instance.getText(
      `${this.windowInfo.type}.message-list.${
        this.imageDocId ? "drag-piece" : "choose-image"
      }`
    );
  }

  @VueEvent
  private async dragStart(event: DragEvent) {
    await TaskManager.instance.ignition<ModeInfo, never>({
      type: "mode-change",
      owner: "Quoridorn",
      value: {
        type: "drop-piece",
        value: "on" as "on"
      }
    });
    event.dataTransfer!.setData("dropType", "chit");
    event.dataTransfer!.setData("dropWindow", this.key);
  }

  @VueEvent
  private async dragEnd() {
    await TaskManager.instance.ignition<ModeInfo, never>({
      type: "mode-change",
      owner: "Quoridorn",
      value: {
        type: "drop-piece",
        value: "off" as "off"
      }
    });
  }

  @TaskProcessor("added-object-finished")
  private async addedObjectFinished(
    task: Task<AddObjectInfo, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value!.dropWindow !== this.key) return;
    const point = task.value!.point;
    const matrix = task.value!.matrix;

    await SocketFacade.instance.sceneObjectCC().addDirect([
      {
        type: "chit",
        tag: this.tag,
        name: this.name,
        x: point.x,
        y: point.y,
        row: matrix.row,
        column: matrix.column,
        actorId: null,
        columns: this.width,
        rows: this.height,
        place: "field",
        isHideBorder: false,
        isHideHighlight: false,
        isLock: false,
        otherText: this.otherText,
        layerId: this.layerId,
        textures: [
          {
            type: "image",
            imageTag: this.imageTag!,
            imageId: this.imageDocId!,
            direction: this.direction,
            backgroundSize: this.backgroundSize!
          }
        ],
        textureIndex: 0,
        angle: 0,
        url: "",
        subType: "",
        pips: 0,
        faceNum: 0
      }
    ]);

    task.resolve();
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.container {
  display: grid;
  grid-template-rows: 12em 1fr;
  grid-template-columns: 12em 1fr;
  width: 100%;
  height: 100%;
}
</style>
