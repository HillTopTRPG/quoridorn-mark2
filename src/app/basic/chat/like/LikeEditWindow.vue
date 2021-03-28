<template>
  <div class="container" ref="window-container">
    <like-info-form
      :windowKey="windowKey"
      :isAdd="false"
      initTabTarget="basic"
      :char.sync="char"
      :isThrowLinkage.sync="isThrowLinkage"
      :linkageResourceKey.sync="linkageResourceKey"
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
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import LikeInfoForm from "@/app/basic/chat/like/LikeInfoForm.vue";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import WindowVue from "@/app/core/window/WindowVue";
import VueEvent from "@/app/core/decorator/VueEvent";
import EditWindowDelegator, {
  EditWindow
} from "@/app/core/window/EditWindowDelegator";
import { LikeStore } from "@/@types/store-data";

@Component({ components: { ButtonArea, LikeInfoForm } })
export default class LikeEditWindow
  extends Mixins<WindowVue<DataReference, never>>(WindowVue)
  implements EditWindow<LikeStore> {
  private editWindowDelegator = new EditWindowDelegator<LikeStore, "char">(
    this,
    "char"
  );

  private char: string = "";
  private isThrowLinkage: boolean = false;
  private linkageResourceKey: string | null = null;

  @LifeCycle
  public async mounted() {
    await this.editWindowDelegator.init();
    this.inputEnter("input:not([type='button'])", this.commit);
  }

  public isCommitAble(): boolean {
    return !!this.char && !this.isDuplicate();
  }

  public isDuplicate(): boolean {
    return this.editWindowDelegator.isDuplicateBasic(this.char);
  }

  @Watch("char")
  private onChangeIsDuplicate() {
    this.windowInfo.message = this.editWindowDelegator.onChangeIsDuplicateBasic();
  }

  @VueEvent
  private async commit() {
    await this.editWindowDelegator.commit();
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

  public pullStoreData(data: StoreData<LikeStore>): void {
    this.char = data.data!.char;
    this.isThrowLinkage = data.data!.isThrowLinkage;
    this.linkageResourceKey = data.data!.linkageResourceKey;
  }

  public async pushStoreData(data: StoreData<LikeStore>): Promise<void> {
    data.data!.char = this.char;
    data.data!.isThrowLinkage = this.isThrowLinkage;
    data.data!.linkageResourceKey = this.linkageResourceKey;
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.container {
  @include flex-box(column, flex-start, center);
  width: 100%;
  height: 100%;
}

.button-area {
  align-self: center;
}
</style>
