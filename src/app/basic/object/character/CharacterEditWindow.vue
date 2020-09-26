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
      :imageDocKey.sync="imageDocKey"
      :imageTag.sync="imageTag"
      :direction.sync="direction"
      :backgroundSize.sync="backgroundSize"
      :layerKey.sync="layerKey"
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
import { MemoStore, SceneObjectStore } from "@/@types/store-data";
import SocketFacade, {
  permissionCheck
} from "../../../core/api/app-server/SocketFacade";
import NekostoreCollectionController from "../../../core/api/app-server/NekostoreCollectionController";
import VueEvent from "../../../core/decorator/VueEvent";
import WindowVue from "../../../core/window/WindowVue";
import CtrlButton from "../../../core/component/CtrlButton.vue";
import GameObjectManager from "../../GameObjectManager";
import { DataReference } from "@/@types/data";
import { clone } from "@/app/core/utility/PrimaryDataUtility";
import { BackgroundSize, Direction } from "@/@types/store-data-optional";

@Component({
  components: {
    CharacterInfoForm,
    CtrlButton
  }
})
export default class CharacterEditWindow extends Mixins<
  WindowVue<DataReference, never>
>(WindowVue) {
  private docKey: string = "";
  private cc: NekostoreCollectionController<
    SceneObjectStore
  > = SocketFacade.instance.sceneObjectCC();
  private tag: string = "";
  private url: string = "";
  private name: string = "";
  private isProcessed: boolean = false;
  private otherTextList: StoreData<MemoStore>[] = [];
  private size: number = 1;
  private imageDocKey: string | null = null;
  private imageTag: string | null = null;
  private direction: Direction = "none";
  private isMounted: boolean = false;
  private backgroundSize: BackgroundSize = "contain";
  private layerKey: string = GameObjectManager.instance.sceneLayerList.filter(
    ml => ml.data!.type === "character"
  )[0].key;

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

    const backgroundInfo = data.data!.textures[data.data!.textureIndex];
    if (backgroundInfo.type === "image") {
      this.imageDocKey = backgroundInfo.mediaKey;
      this.imageTag = backgroundInfo.mediaTag;
      this.backgroundSize = backgroundInfo.backgroundSize;
      this.direction = backgroundInfo.direction;
    }
    this.tag = data.data!.tag;
    this.url = data.data!.url;
    this.name = data.data!.name;
    this.size = data.data!.columns;
    this.layerKey = data.data!.layerKey;

    this.otherTextList = clone(
      GameObjectManager.instance.memoList.filter(
        m => m.ownerType === "scene-object-list" && m.owner === this.docKey
      )
    )!;

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
    const data = (await this.cc!.findSingle("key", this.docKey))!.data!;
    const backgroundInfo = data.data!.textures[data.data!.textureIndex];
    if (backgroundInfo.type === "image") {
      backgroundInfo.mediaKey = this.imageDocKey!;
      backgroundInfo.mediaTag = this.imageTag!;
      backgroundInfo.backgroundSize = this.backgroundSize;
      backgroundInfo.direction = this.direction;
    }
    data.data!.tag = this.tag;
    data.data!.url = this.url;
    data.data!.name = this.name;
    data.data!.rows = this.size;
    data.data!.columns = this.size;
    data.data!.layerKey = this.layerKey;
    await this.cc!.update([
      {
        key: this.docKey,
        data: data.data!
      }
    ]);

    await GameObjectManager.instance.updateMemoList(
      this.otherTextList,
      "scene-object",
      this.docKey
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
