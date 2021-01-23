<template>
  <div class="container" ref="window-container">
    <public-memo-info-form
      :windowKey="windowKey"
      :isAdd="false"
      initTabTarget="basic"
      :name.sync="name"
      :otherTextList.sync="otherTextList"
      :mediaKey.sync="mediaKey"
      :mediaTag.sync="mediaTag"
      :direction.sync="direction"
    />

    <button-area
      :is-commit-able="isCommitAble()"
      commit-text="modify"
      @commit="commit()"
      @rollback="rollback()"
    />
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
import TaskProcessor from "@/app/core/task/TaskProcessor";
import WindowVue from "@/app/core/window/WindowVue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import VueEvent from "@/app/core/decorator/VueEvent";
import { Direction } from "@/@types/store-data-optional";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import EditWindowDelegator, {
  EditWindow
} from "@/app/core/window/EditWindowDelegator";

@Component({ components: { ButtonArea, PublicMemoInfoForm } })
export default class PublicMemoEditWindow
  extends Mixins<WindowVue<DataReference, never>>(WindowVue)
  implements EditWindow<PublicMemoStore> {
  private editWindowDelegator = new EditWindowDelegator<PublicMemoStore>(this);

  private name: string = "";
  private otherTextList: StoreData<MemoStore>[] = [];
  private mediaKey: string | null = null;
  private mediaTag: string | null = null;
  private direction: Direction = "none";

  @LifeCycle
  public async mounted() {
    await this.editWindowDelegator.init();
    this.otherTextList = clone(
      GameObjectManager.instance.memoList.filter(
        m =>
          m.ownerType === "public-memo-list" &&
          m.owner === this.editWindowDelegator.docKey
      )
    )!;
    this.inputEnter("input:not([type='button'])", this.commit);
  }

  public isCommitAble(): boolean {
    return !!this.name;
  }

  @VueEvent
  private async commit() {
    await this.editWindowDelegator.commit();
    await GameObjectManager.instance.updateMemoList(
      this.otherTextList,
      "public-memo-list",
      this.editWindowDelegator.docKey
    );
  }

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing2(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    return await this.editWindowDelegator.windowCloseClosing(task);
  }

  @VueEvent
  private async rollback() {
    await this.editWindowDelegator.rollback();
  }

  public pullStoreData(data: StoreData<PublicMemoStore>): void {
    this.name = data.data!.name;
    this.mediaKey = data.data!.mediaKey;
    this.mediaTag = data.data!.mediaTag;
    this.direction = data.data!.direction;
  }

  public async pushStoreData(data: StoreData<PublicMemoStore>): Promise<void> {
    data.data!.mediaKey = this.mediaKey!;
    data.data!.mediaTag = this.mediaTag!;
    data.data!.direction = this.direction;
    data.data!.name = this.name;
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
