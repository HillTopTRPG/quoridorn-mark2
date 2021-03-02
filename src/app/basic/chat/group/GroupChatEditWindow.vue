<template>
  <div class="container" ref="window-container">
    <group-chat-info-form
      :windowKey="windowKey"
      :isAdd="false"
      initTabTarget="basic"
      :name.sync="name"
      :isSystem.sync="isSystem"
      :authorityGroupKey.sync="authorityGroupKey"
      :isSecret.sync="isSecret"
      :outputChatTabKey.sync="outputChatTabKey"
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
import { findRequireByKey } from "@/app/core/utility/Utility";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import WindowVue from "@/app/core/window/WindowVue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import VueEvent from "@/app/core/decorator/VueEvent";
import { GroupChatTabStore } from "@/@types/store-data";
import EditWindowDelegator, {
  EditWindow
} from "@/app/core/window/EditWindowDelegator";
import GroupChatInfoForm from "@/app/basic/chat/group/GroupChatInfoForm.vue";

@Component({ components: { GroupChatInfoForm, ButtonArea } })
export default class GroupChatEditWindow
  extends Mixins<WindowVue<DataReference, never>>(WindowVue)
  implements EditWindow<GroupChatTabStore> {
  private editWindowDelegator = new EditWindowDelegator<GroupChatTabStore>(
    this
  );

  private name: string = "";
  private isSystem: boolean = false;
  private authorityGroupKey: string = "";
  private isSecret: boolean = false;
  private outputChatTabKey: string | null = null;

  @LifeCycle
  public async mounted() {
    await this.editWindowDelegator.init();
    this.inputEnter("input:not([type='button'])", this.commit);
  }

  public isCommitAble(): boolean {
    return !this.isDuplicate && !!this.name;
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

  public pullStoreData(data: StoreData<GroupChatTabStore>): void {
    this.name = data.data!.name;
    this.isSystem = data.data!.isSystem;
    this.authorityGroupKey = data.data!.authorityGroupKey;
    this.isSecret = data.data!.isSecret;
    this.outputChatTabKey = data.data!.outputChatTabKey;
  }

  public async pushStoreData(
    data: StoreData<GroupChatTabStore>
  ): Promise<void> {
    data.data!.name = this.name;
    data.data!.isSystem = this.isSystem;
    data.data!.authorityGroupKey = this.authorityGroupKey;
    data.data!.isSecret = this.isSecret;
    data.data!.outputChatTabKey = this.outputChatTabKey;
  }

  private get isDuplicate(): boolean {
    return GameObjectManager.instance.groupChatTabList.some(
      ct =>
        ct.data!.name === this.name &&
        ct.key !== this.editWindowDelegator.docKey
    );
  }

  @Watch("isDuplicate")
  private onChangeIsDuplicate() {
    if (!this.editWindowDelegator.docKey) return;
    const tab = findRequireByKey(
      GameObjectManager.instance.groupChatTabList,
      this.editWindowDelegator.docKey
    );
    this.windowInfo.message = this.isDuplicate
      ? this.$t("message.name-duplicate")!.toString()
      : this.$t("message.original")!
          .toString()
          .replace("$1", tab.data!.name);
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
