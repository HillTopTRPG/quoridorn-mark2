<template>
  <div class="container" ref="window-container">
    <chit-info-form
      :windowKey="windowKey"
      :isAdd="true"
      initTabTarget="image"
      :name.sync="name"
      :tag.sync="tag"
      :otherTextList.sync="otherTextList"
      :width.sync="width"
      :height.sync="height"
      :mediaKey.sync="mediaKey"
      :mediaTag.sync="mediaTag"
      :direction.sync="direction"
      :backgroundSize.sync="backgroundSize"
      :layerKey.sync="layerKey"
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
import { BackgroundSize, Direction } from "@/@types/store-data-optional";
import TaskManager from "../../../core/task/TaskManager";
import WindowVue from "../../../core/window/WindowVue";
import ChitInfoForm from "./ChitInfoForm.vue";
import GameObjectManager from "../../GameObjectManager";
import LanguageManager from "../../../../LanguageManager";
import { AddObjectInfo } from "@/@types/data";
import VueEvent from "../../../core/decorator/VueEvent";
import SocketFacade from "../../../core/api/app-server/SocketFacade";
import { MemoStore } from "@/@types/store-data";
import { createEmptyStoreUseData } from "@/app/core/utility/Utility";
const uuid = require("uuid");

@Component({ components: { ChitInfoForm } })
export default class ChitAddWindow extends Mixins<WindowVue<string, never>>(
  WindowVue
) {
  private name: string = LanguageManager.instance.getText("type.chit");
  private tag: string = "";
  private otherTextList: StoreData<MemoStore>[] = [
    createEmptyStoreUseData(uuid.v4(), {
      tab: "",
      text: ""
    })
  ];
  private height: number = 1;
  private width: number = 1;
  private mediaKey: string | null = null;
  private mediaTag: string | null = null;
  private direction: Direction = "none";
  private isMounted: boolean = false;
  private backgroundSize: BackgroundSize = "contain";
  private layerKey: string = GameObjectManager.instance.sceneLayerList.find(
    ml => ml.data!.type === "character"
  )!.key;

  @LifeCycle
  public async mounted() {
    await this.init();
    this.mediaTag = this.$t("type.character")!.toString();
    this.isMounted = true;
  }

  @Watch("mediaKey", { immediate: true })
  private onChangeImageDocKey() {
    this.windowInfo.message = this.$t(
      this.mediaKey ? "message.drag-piece" : "message.choose-image"
    )!.toString();
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

    const sceneObjectKey = (
      await SocketFacade.instance.sceneObjectCC().addDirect([
        {
          data: {
            type: "chit",
            tag: this.tag,
            name: this.name,
            x: point.x,
            y: point.y,
            row: matrix.row,
            column: matrix.column,
            actorKey: null,
            columns: this.width,
            rows: this.height,
            place: "field",
            isHideBorder: false,
            isHideHighlight: false,
            isLock: false,
            layerKey: this.layerKey,
            textures: [
              {
                type: "image",
                mediaTag: this.mediaTag!,
                mediaKey: this.mediaKey!,
                direction: this.direction,
                backgroundSize: this.backgroundSize!
              }
            ],
            textureIndex: 0,
            angle: 0,
            url: "",
            subTypeKey: "",
            subTypeValue: "",
            isHideSubType: false
          }
        }
      ])
    )[0];

    await SocketFacade.instance.memoCC().addDirect(
      this.otherTextList.map(data => ({
        ownerType: "scene-object-list",
        owner: sceneObjectKey,
        data: data.data!
      }))
    );

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
