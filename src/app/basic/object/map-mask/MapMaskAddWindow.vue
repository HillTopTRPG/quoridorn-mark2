<template>
  <div class="container" ref="window-container">
    <map-mask-info-form
      :windowKey="windowKey"
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
      @drag-end="dragEnd"
    />
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import { ModeInfo } from "mode";
import LifeCycle from "../../../core/decorator/LifeCycle";
import TaskProcessor from "../../../core/task/TaskProcessor";
import MapMaskInfoForm from "./MapMaskInfoForm.vue";
import TaskManager from "../../../core/task/TaskManager";
import WindowVue from "../../../core/window/WindowVue";
import GameObjectManager from "../../GameObjectManager";
import LanguageManager from "../../../../LanguageManager";
import { AddObjectInfo } from "@/@types/data";
import VueEvent from "../../../core/decorator/VueEvent";
import { parseColor } from "@/app/core/utility/ColorUtility";
import SocketFacade from "../../../core/api/app-server/SocketFacade";

@Component({ components: { MapMaskInfoForm } })
export default class MapMastAddWindow extends Mixins<WindowVue<string, never>>(
  WindowVue
) {
  private name: string = LanguageManager.instance.getText("type.map-mask");
  private tag: string = "";
  private text: string = "";
  private color: string = "rgba(255, 0, 0, 1)";
  private height: number = 1;
  private width: number = 1;
  private isMounted: boolean = false;
  private layerId: string = GameObjectManager.instance.sceneLayerList.find(
    ml => ml.data!.type === "map-mask"
  )!.id!;
  private otherText: string = "";

  @LifeCycle
  public async mounted() {
    await this.init();
    this.isMounted = true;
    this.windowInfo.message = LanguageManager.instance.getText(
      `${this.windowInfo.type}.message-list.drag-piece`
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
    event.dataTransfer!.setData("dropType", "map-mask");
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

    const colorObj = parseColor(this.color);
    const backgroundColor = colorObj.getRGBA();
    const fontColor = colorObj.getRGBReverse();
    await SocketFacade.instance.sceneObjectCC().addDirect([
      {
        type: "map-mask",
        tag: this.tag,
        name: this.name,
        x: point.x,
        y: point.y,
        row: matrix.row,
        column: matrix.column,
        rows: this.height,
        columns: this.width,
        actorId: null,
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
        angle: 0,
        url: "",
        subTypeId: "",
        subTypeValue: "",
        isHideSubType: false
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
