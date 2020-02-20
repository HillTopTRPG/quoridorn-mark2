<template>
  <div class="container" ref="window">
    <map-mask-info-form
      :isAdd="true"
      initTabTarget="background"
      :name.sync="name"
      :text.sync="text"
      :color.sync="color"
      :tag.sync="tag"
      :otherText.sync="otherText"
      :width.sync="width"
      :height.sync="height"
      :layerId.sync="layerId"
      @drag-start="dragStart"
    />
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import { parseColor } from "@/app/core/Utility";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import { AddObjectInfo } from "@/@types/data";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import VueEvent from "@/app/core/decorator/VueEvent";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import WindowVue from "@/app/core/window/WindowVue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import LanguageManager from "@/LanguageManager";
import MapMaskInfoForm from "@/app/basic/map-object/map-mask/MapMaskInfoForm.vue";

@Component({
  components: {
    MapMaskInfoForm
  }
})
export default class AddMapMaskWindow extends Mixins<WindowVue<string, never>>(
  WindowVue
) {
  private name: string = LanguageManager.instance.getText("type.map-mask");
  private tag: string = "";
  private text: string = "";
  private color: string = "rgba(255, 0, 0, 1)";
  private height: number = 1;
  private width: number = 1;
  private isMounted: boolean = false;
  private layerId: string = GameObjectManager.instance.sceneLayerList.filter(
    ml => ml.data!.type === "map-mask"
  )[0].id!;
  private otherText: string = "";

  @LifeCycle
  public async mounted() {
    await this.init();
    this.isMounted = true;
  }

  @VueEvent
  private dragStart(event: DragEvent) {
    event.dataTransfer!.setData("dropType", "map-mask");
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
    const colorObj = parseColor(this.color);
    const backgroundColor = colorObj.getRGBA();
    const fontColor = colorObj.getRGBReverse();
    await GameObjectManager.instance.addSceneObject({
      type: "map-mask",
      tag: this.tag,
      name: this.name,
      x: point.x,
      y: point.y,
      row: matrix.row,
      column: matrix.column,
      rows: this.height,
      columns: this.width,
      owner,
      place: "field",
      isHideBorder: false,
      isHideHighlight: false,
      isLock: false,
      otherText: this.otherText,
      layerId: this.layerId,
      textures: [
        {
          type: "color",
          backgroundColor,
          fontColor,
          text: this.text
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
