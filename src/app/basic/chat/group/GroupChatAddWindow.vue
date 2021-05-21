<template>
  <div class="container" ref="window-container">
    <group-chat-info-form
      :windowKey="windowKey"
      :isAdd="true"
      initTabTarget="basic"
      :name.sync="name"
      :isSystem.sync="isSystem"
      :authorityGroupKey.sync="authorityGroupKey"
      :isSecret.sync="isSecret"
      :outputChatTabKey.sync="outputChatTabKey"
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
import { Task, TaskResult } from "task";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import WindowVue from "@/app/core/window/WindowVue";
import VueEvent from "@/app/core/decorator/VueEvent";
import { GroupChatTabStore } from "@/@types/store-data";
import AddWindowDelegator, {
  AddWindow
} from "@/app/core/window/AddWindowDelegator";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import GroupChatInfoForm from "@/app/basic/chat/group/GroupChatInfoForm.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";

@Component({ components: { GroupChatInfoForm, ButtonArea } })
export default class GroupChatAddWindow
  extends Mixins<WindowVue<GroupChatTabStore, boolean>>(WindowVue)
  implements AddWindow<GroupChatTabStore> {
  private addWindowDelegator = new AddWindowDelegator<
    GroupChatTabStore,
    "name"
  >(
    this,
    SocketFacade.instance.groupChatTabListCC().collectionNameSuffix,
    "name"
  );

  private name: string = "";
  private isSystem: boolean = false;
  private authorityGroupKey: string = "";
  private isSecret: boolean = false;
  private outputChatTabKey: string | null = null;

  @LifeCycle
  public async created() {
    this.authorityGroupKey =
      GameObjectManager.instance.authorityGroupList.find(
        ag => ag.data!.name === "All"
      )?.key || "";
  }

  @LifeCycle
  public async mounted() {
    await this.addWindowDelegator.init();
    this.inputEnter("input:not([type='button'])", this.commit);
  }

  public isCommitAble(): boolean {
    return (
      Boolean(this.name) &&
      Boolean(this.authorityGroupKey) &&
      !this.isDuplicate()
    );
  }

  public isDuplicate(): boolean {
    return this.addWindowDelegator.isDuplicateBasic(this.name);
  }

  @Watch("name")
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

  public setStoreData(data: GroupChatTabStore): void {
    this.name = data.name;
    this.isSystem = data.isSystem;
    this.authorityGroupKey = data.authorityGroupKey;
    this.isSecret = data.isSecret;
    this.outputChatTabKey = data.outputChatTabKey;
  }

  public async getStoreDataList(): Promise<
    DelegateStoreData<GroupChatTabStore>[]
  > {
    return [
      {
        collection: SocketFacade.instance.groupChatTabListCC()
          .collectionNameSuffix,
        data: {
          name: this.name,
          isSystem: this.isSystem,
          authorityGroupKey: this.authorityGroupKey,
          isSecret: this.isSecret,
          outputChatTabKey: this.outputChatTabKey
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

.button-area {
  align-self: center;
}
</style>
