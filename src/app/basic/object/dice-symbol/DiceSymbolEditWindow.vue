<template>
  <div class="container" ref="window-container">
    <dice-symbol-info-form
      :windowKey="windowKey"
      v-if="isMounted"
      :isAdd="false"
      initTabTarget="background"
      :name.sync="name"
      :color.sync="color"
      :tag.sync="tag"
      :size.sync="size"
      :layerKey.sync="layerKey"
      :diceTypeKey.sync="diceTypeKey"
      :pips.sync="pips"
    />

    <div class="button-area">
      <ctrl-button @click="commit()">
        <span v-t="'button.modify'"></span>
      </ctrl-button>
      <ctrl-button @click="rollback()">
        <span v-t="'button.reject'"></span>
      </ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import LifeCycle from "../../../core/decorator/LifeCycle";
import TaskProcessor from "../../../core/task/TaskProcessor";
import { SceneObject } from "@/@types/gameObject";
import SocketFacade, {
  permissionCheck
} from "../../../core/api/app-server/SocketFacade";
import NekostoreCollectionController from "../../../core/api/app-server/NekostoreCollectionController";
import VueEvent from "../../../core/decorator/VueEvent";
import { parseColor } from "@/app/core/utility/ColorUtility";
import WindowVue from "../../../core/window/WindowVue";
import CtrlButton from "../../../core/component/CtrlButton.vue";
import GameObjectManager from "../../GameObjectManager";
import { DataReference } from "@/@types/data";
import DiceSymbolInfoForm from "@/app/basic/object/dice-symbol/DiceSymbolInfoForm.vue";

@Component({ components: { DiceSymbolInfoForm, CtrlButton } })
export default class DiceSymbolEditWindow extends Mixins<
  WindowVue<DataReference, never>
>(WindowVue) {
  private diceTypeList = GameObjectManager.instance.diceTypeList;
  private diceAndPipsList = GameObjectManager.instance.diceAndPipsList;

  private docKey: string = "";
  private cc: NekostoreCollectionController<
    SceneObject
  > = SocketFacade.instance.sceneObjectCC();

  private name: string = "";
  private tag: string = "";
  private color: string = "rgba(255, 255, 255, 1)";
  private size: number = 1;
  private isMounted: boolean = false;

  private isProcessed: boolean = false;
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
  }

  @LifeCycle
  public async mounted() {
    await this.init();
    this.docKey = this.windowInfo.args!.key;
    const data = (await this.cc!.findSingle("key", this.docKey))!.data!;

    if (this.windowInfo.status === "window") {
      // 排他チェック
      if (data.exclusionOwner) {
        this.isProcessed = true;
        await this.close();
        return;
      }

      // パーミッションチェック
      if (!permissionCheck(data, "edit")) {
        this.isProcessed = true;
        await this.close();
        return;
      }
    }

    const texture = data.data!.textures[data.data!.textureIndex];
    if (texture.type === "color") {
      this.color = texture.backgroundColor;
    }
    this.name = data.data!.name;
    this.tag = data.data!.tag;
    this.size = data.data!.columns;
    this.layerKey = data.data!.layerKey;
    this.diceTypeKey = data.data!.subTypeKey;
    this.pips = data.data!.subTypeValue;

    if (this.windowInfo.status === "window") {
      try {
        await this.cc.touchModify([this.docKey]);
      } catch (err) {
        console.warn(err);
        this.isProcessed = true;
        await this.close();
      }
    }
    this.isMounted = true;
  }

  @VueEvent
  private async commit() {
    const data = (await this.cc!.findSingle("key", this.docKey))!.data!.data!;
    const texture = data.textures[data.textureIndex];
    if (texture.type === "color") {
      const colorObj = parseColor(this.color);
      texture.backgroundColor = colorObj.getRGBA();
      texture.fontColor = colorObj.getRGBReverse();
    }
    data.name = this.name;
    data.tag = this.tag;
    data.rows = this.size;
    data.columns = this.size;
    data.layerKey = this.layerKey;
    data.subTypeKey = this.diceTypeKey;
    data.subTypeValue = this.pips;
    await this.cc!.update([
      {
        key: this.docKey,
        data: data
      }
    ]);
    this.isProcessed = true;
    await this.close();
  }

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing2(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value !== this.windowInfo.key) return;
    if (!this.isProcessed) {
      this.isProcessed = true;
      await this.rollback();
    }
  }

  @VueEvent
  private async rollback() {
    try {
      await this.cc!.releaseTouch([this.docKey]);
    } catch (err) {
      // nothing
    }
    if (!this.isProcessed) {
      this.isProcessed = true;
      await this.close();
    }
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.container {
  display: grid;
  grid-template-rows: 12em 1fr calc(2em + 0.5rem);
  grid-template-columns: 12em 1fr;
  width: 100%;
  height: 100%;
}

.button-area {
  grid-row: 3 / 4;
  grid-column: 1 / 3;
}
</style>
