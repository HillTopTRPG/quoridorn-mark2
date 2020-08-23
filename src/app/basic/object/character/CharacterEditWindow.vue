<template>
  <div class="container" ref="window-container">
    <character-info-form
      :windowKey="windowKey"
      v-if="isMounted"
      :isAdd="false"
      initTabTarget="image"
      :name.sync="name"
      :tag.sync="tag"
      :otherTextList.sync="otherTextList"
      :url.sync="url"
      :size.sync="size"
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
import LifeCycle from "../../../core/decorator/LifeCycle";
import TaskProcessor from "../../../core/task/TaskProcessor";
import CharacterInfoForm from "./CharacterInfoForm.vue";
import { MemoStore, SceneObject } from "@/@types/gameObject";
import SocketFacade, {
  permissionCheck
} from "../../../core/api/app-server/SocketFacade";
import NekostoreCollectionController from "../../../core/api/app-server/NekostoreCollectionController";
import VueEvent from "../../../core/decorator/VueEvent";
import { BackgroundSize, Direction } from "@/@types/room";
import WindowVue from "../../../core/window/WindowVue";
import CtrlButton from "../../../core/component/CtrlButton.vue";
import GameObjectManager from "../../GameObjectManager";
import { DataReference } from "@/@types/data";
import { StoreObj, StoreUseData } from "@/@types/store";
import { clone } from "@/app/core/utility/PrimaryDataUtility";

@Component({
  components: {
    CharacterInfoForm,
    CtrlButton
  }
})
export default class CharacterEditWindow extends Mixins<
  WindowVue<DataReference, never>
>(WindowVue) {
  private docId: string = "";
  private cc: NekostoreCollectionController<
    SceneObject
  > = SocketFacade.instance.sceneObjectCC();
  private tag: string = "";
  private url: string = "";
  private name: string = "";
  private isProcessed: boolean = false;
  private otherTextList: StoreUseData<MemoStore>[] = [];
  private size: number = 1;
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
    this.url = data.data!.url;
    this.name = data.data!.name;
    this.size = data.data!.columns;
    this.layerId = data.data!.layerId;

    this.otherTextList = clone(
      GameObjectManager.instance.memoList.filter(
        m => m.ownerType === "scene-object" && m.owner === this.docId
      )
    )!;

    if (this.windowInfo.status === "window") {
      try {
        await this.cc.touchModify([this.docId]);
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
    const data = (await this.cc!.getData(this.docId))!;
    const backgroundInfo = data.data!.textures[data.data!.textureIndex];
    if (backgroundInfo.type === "image") {
      backgroundInfo.imageId = this.imageDocId!;
      backgroundInfo.imageTag = this.imageTag!;
      backgroundInfo.backgroundSize = this.backgroundSize;
      backgroundInfo.direction = this.direction;
    }
    data.data!.tag = this.tag;
    data.data!.url = this.url;
    data.data!.name = this.name;
    data.data!.rows = this.size;
    data.data!.columns = this.size;
    data.data!.layerId = this.layerId;
    await this.cc!.update([this.docId], [data.data!]);

    await GameObjectManager.instance.updateMemoList(
      this.otherTextList,
      "scene-object",
      this.docId
    );

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
      await this.cc!.releaseTouch([this.docId]);
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
