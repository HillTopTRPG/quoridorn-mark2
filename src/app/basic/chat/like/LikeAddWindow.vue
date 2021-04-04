<template>
  <div class="container" ref="window-container">
    <like-info-form
      :windowKey="windowKey"
      :isAdd="true"
      initTabTarget="basic"
      :char.sync="char"
      :isThrowLinkage.sync="isThrowLinkage"
      :linkageResourceKey.sync="linkageResourceKey"
    />

    <button-area
      :is-commit-able="isCommitAble()"
      commit-text="add"
      @commit="commit()"
      @rollback="rollback()"
    />
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import LikeInfoForm from "@/app/basic/chat/like/LikeInfoForm.vue";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import { LikeStore } from "@/@types/store-data";
import WindowVue from "@/app/core/window/WindowVue";
import AddWindowDelegator, {
  AddWindow
} from "@/app/core/window/AddWindowDelegator";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import VueEvent from "@/app/core/decorator/VueEvent";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";

@Component({ components: { ButtonArea, LikeInfoForm } })
export default class LikeAddWindow
  extends Mixins<WindowVue<LikeStore, boolean>>(WindowVue)
  implements AddWindow<LikeStore> {
  private addWindowDelegator = new AddWindowDelegator<LikeStore, "char">(
    this,
    SocketFacade.instance.likeListCC().collectionNameSuffix,
    "char"
  );

  private char: string = "";
  private isThrowLinkage: boolean = true;
  private linkageResourceKey: string | null = null;

  @LifeCycle
  public async mounted() {
    await this.addWindowDelegator.init();
    this.inputEnter("input:not([type='button'])", this.commit);
  }

  public isCommitAble(): boolean {
    return !!this.char && !this.isDuplicate();
  }

  public isDuplicate(): boolean {
    return this.addWindowDelegator.isDuplicateBasic(this.char);
  }

  @Watch("char")
  private onChangeIsDuplicate() {
    this.windowInfo.message = this.addWindowDelegator.onChangeIsDuplicateBasic();
  }

  @VueEvent
  private async commit() {
    await this.addWindowDelegator.commit();
  }

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing2(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    return await this.addWindowDelegator.windowCloseClosing(task);
  }

  @VueEvent
  private async rollback() {
    await this.addWindowDelegator.rollback();
  }

  public setStoreData(data: LikeStore): void {
    this.char = data.char;
    this.isThrowLinkage = data.isThrowLinkage;
    this.linkageResourceKey = data.linkageResourceKey;
  }

  public async getStoreDataList(): Promise<DelegateStoreData<LikeStore>[]> {
    return [
      {
        collection: SocketFacade.instance.likeListCC().collectionNameSuffix,
        ownerType: null,
        owner: null,
        data: {
          char: this.char,
          isThrowLinkage: this.isThrowLinkage,
          linkageResourceKey: this.linkageResourceKey
        }
      }
    ];
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
</style>
