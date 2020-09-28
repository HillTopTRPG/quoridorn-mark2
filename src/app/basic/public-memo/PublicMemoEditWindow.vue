<template>
  <div class="container" ref="window-container">
    <public-memo-info-form
      :windowKey="windowKey"
      v-if="isMounted"
      :isAdd="false"
      initTabTarget="basic"
      :name.sync="name"
      :otherTextList.sync="otherTextList"
      :mediaKey.sync="mediaKey"
      :mediaTag.sync="mediaTag"
      :direction.sync="direction"
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
import { MemoStore, PublicMemoStore } from "@/@types/store-data";
import { clone } from "@/app/core/utility/PrimaryDataUtility";
import PublicMemoInfoForm from "@/app/basic/public-memo/PublicMemoInfoForm.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import SocketFacade, {
  permissionCheck
} from "@/app/core/api/app-server/SocketFacade";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import WindowVue from "@/app/core/window/WindowVue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import NekostoreCollectionController from "@/app/core/api/app-server/NekostoreCollectionController";
import VueEvent from "@/app/core/decorator/VueEvent";
import { Direction } from "@/@types/store-data-optional";

@Component({
  components: {
    PublicMemoInfoForm,
    CtrlButton
  }
})
export default class PublicMemoEditWindow extends Mixins<
  WindowVue<DataReference, never>
>(WindowVue) {
  private docKey: string = "";
  private cc: NekostoreCollectionController<
    PublicMemoStore
  > = SocketFacade.instance.publicMemoListCC();
  private name: string = "";
  private isProcessed: boolean = false;
  private otherTextList: StoreData<MemoStore>[] = [];
  private mediaKey: string | null = null;
  private mediaTag: string | null = null;
  private direction: Direction = "none";
  private isMounted: boolean = false;

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

    this.name = data.data!.name;
    this.mediaKey = data.data!.mediaKey;
    this.mediaTag = data.data!.mediaTag;
    this.direction = data.data!.direction;

    this.otherTextList = clone(
      GameObjectManager.instance.memoList.filter(
        m => m.ownerType === "public-memo" && m.owner === this.docKey
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
    data.data!.mediaKey = this.mediaKey!;
    data.data!.mediaTag = this.mediaTag!;
    data.data!.direction = this.direction;
    data.data!.name = this.name;
    await this.cc!.update([
      {
        key: this.docKey,
        data: data.data!
      }
    ]);

    await GameObjectManager.instance.updateMemoList(
      this.otherTextList,
      "public-memo",
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
@import "../../../assets/common";

.container {
  @include flex-box(column, stretch, flex-start);
  width: 100%;
  height: 100%;
}

.public-memo-info-form {
  flex: 1;
}
</style>
