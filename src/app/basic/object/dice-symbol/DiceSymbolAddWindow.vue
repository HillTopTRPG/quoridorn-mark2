<template>
  <div class="container" ref="window-container">
    <dice-symbol-info-form
      :windowKey="windowKey"
      :isAdd="true"
      initTabTarget="background"
      :name.sync="name"
      :color.sync="color"
      :tag.sync="tag"
      :size.sync="size"
      :layerKey.sync="layerKey"
      :diceTypeKey.sync="diceTypeKey"
      :pips.sync="pips"
      @drag-start="dragStart"
      @drag-end="dragEnd"
    />
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import { ModeInfo } from "mode";
import LifeCycle from "../../../core/decorator/LifeCycle";
import TaskProcessor from "../../../core/task/TaskProcessor";
import TaskManager from "../../../core/task/TaskManager";
import WindowVue from "../../../core/window/WindowVue";
import GameObjectManager from "../../GameObjectManager";
import { AddObjectInfo } from "@/@types/data";
import VueEvent from "../../../core/decorator/VueEvent";
import { parseColor } from "@/app/core/utility/ColorUtility";
import SocketFacade from "../../../core/api/app-server/SocketFacade";
import DiceSymbolInfoForm from "@/app/basic/object/dice-symbol/DiceSymbolInfoForm.vue";

@Component({ components: { DiceSymbolInfoForm } })
export default class DiceSymbolAddWindow extends Mixins<
  WindowVue<string, never>
>(WindowVue) {
  private diceTypeList = GameObjectManager.instance.diceTypeList;
  private diceAndPipsList = GameObjectManager.instance.diceAndPipsList;

  private name: string = "";
  private tag: string = "";
  private color: string = "rgba(255, 255, 255, 1)";
  private size: number = 1;
  private isMounted: boolean = false;
  private layerKey: string = GameObjectManager.instance.sceneLayerList.find(
    ml => ml.data!.type === "dice-symbol"
  )!.key;
  private diceTypeKey: string = "";
  private pips: string = "1";

  @LifeCycle
  private created() {
    const diceType =
      this.diceTypeList.find(dt => dt.data!.faceNum === "6") ||
      this.diceTypeList[0];
    this.diceTypeKey = diceType.key;
    const pipsList = this.diceAndPipsList
      .filter(dap => dap.data!.diceTypeKey === this.diceTypeKey)
      .map(dap => dap.data!.pips);
    this.pips = pipsList.find(p => p === "1") || pipsList[0];

    console.log({
      faceNum: diceType.data!.faceNum,
      subType: diceType.data!.subType,
      pips: pipsList
    });
  }

  @Watch("diceTypeKey")
  private onChangeDiceTypeKey() {
    console.log("diceTypeKey", this.diceTypeKey);
  }

  @LifeCycle
  public async mounted() {
    await this.init();
    this.isMounted = true;
    this.windowInfo.message = this.$t("message.drag-piece")!.toString();
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
        data: {
          type: "dice-symbol",
          tag: this.tag,
          name: this.name,
          x: point.x,
          y: point.y,
          row: matrix.row,
          column: matrix.column,
          rows: this.size,
          columns: this.size,
          actorKey: null,
          place: "field",
          isHideBorder: false,
          isHideHighlight: false,
          isLock: false,
          layerKey: this.layerKey,
          textures: [
            {
              type: "color",
              backgroundColor,
              fontColor,
              text: ""
            }
          ],
          textureIndex: 0,
          angle: 0,
          url: "",
          subTypeKey: this.diceTypeKey,
          subTypeValue: this.pips,
          isHideSubType: false
        }
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
