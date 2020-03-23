<template>
  <div class="container" ref="window-container">
    <chit-info-form
      :windowKey="windowKey"
      v-if="isMounted"
      :isAdd="false"
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
import { DataReference } from "@/@types/data";
import { BackgroundSize, Direction } from "@/@types/room";
import GameObjectManager from "@/app/basic/GameObjectManager";
import SocketFacade, {
  permissionCheck
} from "@/app/core/api/app-server/SocketFacade";
import { SceneObject } from "@/@types/gameObject";
import NekostoreCollectionController from "@/app/core/api/app-server/NekostoreCollectionController";
import VueEvent from "@/app/core/decorator/VueEvent";
import ChitInfoForm from "@/app/basic/object/chit/ChitInfoForm.vue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import WindowVue from "@/app/core/window/WindowVue";

@Component({
  components: {
    ChitInfoForm,
    CtrlButton
  }
})
export default class ChitEditWindow extends Mixins<
  WindowVue<DataReference, never>
>(WindowVue) {
  private docId: string = "";
  private cc: NekostoreCollectionController<
    SceneObject
  > = SocketFacade.instance.sceneObjectCC();
  private tag: string = "";
  private name: string = "";
  private isProcessed: boolean = false;
  private mediaList = GameObjectManager.instance.mediaList;
  private otherText: string = "";
  private height: number = 1;
  private width: number = 1;
  private imageDocId: string | null = null;
  private imageTag: string | null = null;
  private direction: Direction = "none";
  private isMounted: boolean = false;
  private imageSrc: string = "";
  private backgroundSize: BackgroundSize = "contain";
  private layerId: string = GameObjectManager.instance.sceneLayerList.filter(
    ml => ml.data!.type === "character"
  )[0].id!;

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

    const backgroundInfo = data.data!.textures[data.data!.textureIndex];
    if (backgroundInfo.type === "image") {
      this.imageDocId = backgroundInfo.imageId;
      this.imageTag = backgroundInfo.imageTag;
      this.backgroundSize = backgroundInfo.backgroundSize;
      this.direction = backgroundInfo.direction;
    }
    this.tag = data.data!.tag;
    this.name = data.data!.name;
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
    const data = (await this.cc!.getData(this.docId))!;
    const backgroundInfo = data.data!.textures[data.data!.textureIndex];
    if (backgroundInfo.type === "image") {
      backgroundInfo.imageId = this.imageDocId!;
      backgroundInfo.imageTag = this.imageTag!;
      backgroundInfo.backgroundSize = this.backgroundSize;
      backgroundInfo.direction = this.direction;
    }
    data.data!.tag = this.tag;
    data.data!.name = this.name;
    data.data!.rows = this.height;
    data.data!.columns = this.width;
    data.data!.otherText = this.otherText;
    data.data!.layerId = this.layerId;
    await this.cc!.update(this.docId, data.data!);
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
