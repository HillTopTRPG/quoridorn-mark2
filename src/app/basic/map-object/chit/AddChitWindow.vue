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
    />
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import WindowVue from "../../../core/window/WindowVue";
import { Mixins } from "vue-mixin-decorator";
import LifeCycle from "../../../core/decorator/LifeCycle";
import VueEvent from "../../../core/decorator/VueEvent";
import TaskProcessor from "../../../core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import { AddObjectInfo } from "@/@types/data";
import { BackgroundSize, Direction } from "@/@types/room";
import LanguageManager from "@/LanguageManager";
import GameObjectManager from "@/app/basic/GameObjectManager";
import ChitInfoForm from "@/app/basic/map-object/chit/ChitInfoForm.vue";

@Component({
  components: {
    ChitInfoForm
  }
})
export default class AddChitWindow extends Mixins<WindowVue<string, never>>(
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
  private layerId: string = GameObjectManager.instance.sceneLayerList.filter(
    ml => ml.data!.type === "character"
  )[0].id!;

  @LifeCycle
  public async mounted() {
    await this.init();
    this.imageTag = LanguageManager.instance.getText("type.character");
    this.isMounted = true;
  }

  @VueEvent
  private dragStart(event: DragEvent) {
    event.dataTransfer!.setData("dropType", "chit");
    event.dataTransfer!.setData("dropWindow", this.key);
  }

  @TaskProcessor("added-object-finished")
  private async addedObjectFinished(
    task: Task<AddObjectInfo, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value!.dropWindow !== this.key) return;
    const point = task.value!.point;
    const matrix = task.value!.matrix;

    const owner = GameObjectManager.instance.mySelfId;
    await GameObjectManager.instance.addSceneObject({
      type: "chit",
      tag: this.tag,
      name: this.name,
      x: point.x,
      y: point.y,
      row: matrix.row,
      column: matrix.column,
      owner,
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
      angle: 0
    });

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
