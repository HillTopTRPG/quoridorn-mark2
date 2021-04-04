<template>
  <div class="container" ref="window-container">
    <chat-tab-info-form
      :windowKey="windowKey"
      :isAdd="false"
      initTabTarget="basic"
      :tabName.sync="name"
      :useReadAloud.sync="useReadAloud"
      :readAloudVolume.sync="readAloudVolume"
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
import ChatTabInfoForm from "@/app/basic/chat/tab/ChatTabInfoForm.vue";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import WindowVue from "@/app/core/window/WindowVue";
import VueEvent from "@/app/core/decorator/VueEvent";
import { ChatTabStore } from "@/@types/store-data";
import EditWindowDelegator, {
  EditWindow
} from "@/app/core/window/EditWindowDelegator";

@Component({ components: { ButtonArea, ChatTabInfoForm } })
export default class ChatTabEditWindow
  extends Mixins<WindowVue<DataReference, never>>(WindowVue)
  implements EditWindow<ChatTabStore> {
  private editWindowDelegator = new EditWindowDelegator<ChatTabStore, "name">(
    this,
    "name"
  );

  private name: string = "";
  private useReadAloud: boolean = false;
  private readAloudVolume: number = 1;

  @LifeCycle
  public async mounted() {
    await this.editWindowDelegator.init();
    this.inputEnter("input:not([type='button'])", this.commit);
  }

  public isCommitAble(): boolean {
    return !!this.name && !this.isDuplicate();
  }

  public isDuplicate(): boolean {
    return this.editWindowDelegator.isDuplicateBasic(this.name);
  }

  @Watch("name")
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

  public pullStoreData(data: StoreData<ChatTabStore>): void {
    this.name = data.data!.name;
    this.useReadAloud = data.data!.useReadAloud;
    this.readAloudVolume = data.data!.readAloudVolume;
  }

  public async pushStoreData(data: StoreData<ChatTabStore>): Promise<void> {
    data.data!.name = this.name;
    data.data!.useReadAloud = this.useReadAloud;
    data.data!.readAloudVolume = this.readAloudVolume;
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
