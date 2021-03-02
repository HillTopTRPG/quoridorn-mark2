<template>
  <div class="container" ref="window-container">
    <chat-tab-info-form
      :windowKey="windowKey"
      :isAdd="true"
      initTabTarget="basic"
      :tabName.sync="tabName"
      :useReadAloud.sync="useReadAloud"
      :readAloudVolume.sync="readAloudVolume"
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
import ChatTabInfoForm from "@/app/basic/chat/tab/ChatTabInfoForm.vue";
import WindowVue from "@/app/core/window/WindowVue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import VueEvent from "@/app/core/decorator/VueEvent";
import { ChatTabStore } from "@/@types/store-data";
import AddWindowDelegator, {
  AddWindow
} from "@/app/core/window/AddWindowDelegator";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";

@Component({ components: { ButtonArea, ChatTabInfoForm } })
export default class ChatTabAddWindow
  extends Mixins<WindowVue<ChatTabStore, boolean>>(WindowVue)
  implements AddWindow<ChatTabStore> {
  private addWindowDelegator = new AddWindowDelegator<ChatTabStore>(this);

  private chatTabList = GameObjectManager.instance.chatTabList;
  private authorityGroupList = GameObjectManager.instance.authorityGroupList;

  private tabName: string = "";
  private useReadAloud: boolean = false;
  private readAloudVolume: number = 0.5;

  @LifeCycle
  public async mounted() {
    await this.addWindowDelegator.init();
    this.inputEnter("input:not([type='button'])", this.commit);
  }

  public isCommitAble(): boolean {
    return !this.isDuplicate && !!this.tabName;
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

  public setStoreData(data: ChatTabStore): void {
    this.tabName = data.name;
    this.useReadAloud = data.useReadAloud;
    this.readAloudVolume = data.readAloudVolume;
  }

  public async getStoreDataList(): Promise<DelegateStoreData<ChatTabStore>[]> {
    const gameMastersAuthorityGroup = this.authorityGroupList.find(
      ag => ag.data!.isSystem && ag.data!.name === "GameMasters"
    )!;
    const gameMastersPermission: PermissionNode = {
      type: "group",
      key: gameMastersAuthorityGroup.key
    };
    return [
      {
        collection: SocketFacade.instance.chatTabListCC().collectionNameSuffix,
        permission: {
          view: { type: "none", list: [] },
          edit: { type: "allow", list: [gameMastersPermission] },
          chmod: { type: "allow", list: [gameMastersPermission] }
        },
        data: {
          name: this.tabName,
          isSystem: false,
          useReadAloud: this.useReadAloud,
          readAloudVolume: this.readAloudVolume
        }
      }
    ];
  }

  private get isDuplicate(): boolean {
    return this.chatTabList.some(ct => ct.data!.name === this.tabName);
  }

  @Watch("isDuplicate")
  private onChangeIsDuplicate() {
    this.windowInfo.message = this.isDuplicate
      ? this.$t("message.name-duplicate")!.toString()
      : "";
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
