<template>
  <div class="container" ref="window-container">
    <map-mask-info-form
      :windowKey="windowKey"
      v-if="isMounted"
      :isAdd="false"
      initTabTarget="background"
      :name.sync="name"
      :text.sync="text"
      :color.sync="color"
      :tag.sync="tag"
      :otherText.sync="otherText"
      :width.sync="width"
      :height.sync="height"
      :layerId.sync="layerId"
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
import { parseColor } from "@/app/core/utility/ColorUtility";
import { Mixins } from "vue-mixin-decorator";
import { DataReference } from "@/@types/data";
import { SceneObject } from "@/@types/gameObject";
import { Task, TaskResult } from "task";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import WindowVue from "@/app/core/window/WindowVue";
import SocketFacade, {
  permissionCheck
} from "@/app/core/api/app-server/SocketFacade";
import NekostoreCollectionController from "@/app/core/api/app-server/NekostoreCollectionController";
import VueEvent from "@/app/core/decorator/VueEvent";
import GameObjectManager from "@/app/basic/GameObjectManager";
import MapMaskInfoForm from "@/app/basic/object/map-mask/MapMaskInfoForm.vue";

@Component({
  components: {
    MapMaskInfoForm,
    CtrlButton
  }
})
export default class MapMastEditWindow extends Mixins<
  WindowVue<DataReference, never>
>(WindowVue) {
  private docId: string = "";
  private cc: NekostoreCollectionController<
    SceneObject
  > = SocketFacade.instance.sceneObjectCC();

  private name: string = "";
  private tag: string = "";
  private text: string = "";
  private color: string = "";
  private height: number = 1;
  private width: number = 1;
  private isMounted: boolean = false;

  private isProcessed: boolean = false;
  private layerId: string = GameObjectManager.instance.sceneLayerList.filter(
    ml => ml.data!.type === "map-mask"
  )[0].id!;
  private otherText: string = "";

  @LifeCycle
  public async mounted() {
    await this.init();
    this.docId = this.windowInfo.args!.docId;
    const data = (await this.cc!.getData(this.docId))!;

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
      this.text = texture.text;
      this.color = texture.backgroundColor;
    }
    this.name = data.data!.name;
    this.tag = data.data!.tag;
    this.width = data.data!.columns;
    this.height = data.data!.rows;
    this.otherText = data.data!.otherText;
    this.layerId = data.data!.layerId;

    if (this.windowInfo.status === "window") {
      try {
        await this.cc.touchModify(this.docId);
      } catch (err) {
        window.console.warn(err);
        this.isProcessed = true;
        await this.close();
      }
    }
    this.isMounted = true;
  }

  @VueEvent
  private async commit() {
    const data = (await this.cc!.getData(this.docId))!.data!;
    const texture = data.textures[data.textureIndex];
    if (texture.type === "color") {
      texture.text = this.text;
      const colorObj = parseColor(this.color);
      texture.backgroundColor = colorObj.getRGBA();
      texture.fontColor = colorObj.getRGBReverse();
    }
    data.name = this.name;
    data.tag = this.tag;
    data.rows = this.height;
    data.columns = this.width;
    data.otherText = this.otherText;
    data.layerId = this.layerId;
    await this.cc!.update(this.docId, data);
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
      await this.cc!.releaseTouch(this.docId);
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
