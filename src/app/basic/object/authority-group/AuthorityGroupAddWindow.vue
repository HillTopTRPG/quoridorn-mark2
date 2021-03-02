<template>
  <div class="container" ref="window-container">
    <authority-group-info-form
      :is-system="false"
      :name.sync="name"
      :list.sync="list"
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
import GameObjectManager from "@/app/basic/GameObjectManager";
import VueEvent from "@/app/core/decorator/VueEvent";
import { AuthorityGroupStore } from "@/@types/store-data";
import AddWindowDelegator, {
  AddWindow
} from "@/app/core/window/AddWindowDelegator";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import AuthorityGroupInfoForm from "@/app/basic/object/authority-group/AuthorityGroupInfoForm.vue";
import { GroupRef } from "@/@types/store-data-optional";

@Component({ components: { AuthorityGroupInfoForm, ButtonArea } })
export default class AuthorityGroupAddWindow
  extends Mixins<WindowVue<AuthorityGroupStore, boolean>>(WindowVue)
  implements AddWindow<AuthorityGroupStore> {
  private addWindowDelegator = new AddWindowDelegator<AuthorityGroupStore>(
    this
  );

  private name: string = "";
  private list: GroupRef[] = [];

  @Watch("list", { deep: true })
  private onChangeList() {
    console.log(JSON.stringify(this.list, null, "  "));
  }

  @LifeCycle
  public async mounted() {
    await this.addWindowDelegator.init();
  }

  public isCommitAble(): boolean {
    return !this.isDuplicate && !!this.name && this.list.length > 0;
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

  public setStoreData(data: AuthorityGroupStore): void {
    this.name = data.name;
    this.list = data.list;
  }

  public async getStoreDataList(): Promise<
    DelegateStoreData<AuthorityGroupStore>[]
  > {
    return [
      {
        collection: SocketFacade.instance.authorityGroupCC()
          .collectionNameSuffix,
        permission: GameObjectManager.PERMISSION_OWNER_CHANGE,
        data: {
          name: this.name,
          isSystem: false,
          list: this.list
        }
      }
    ];
  }

  private get isDuplicate(): boolean {
    return GameObjectManager.instance.authorityGroupList.some(
      ct => ct.data!.name === this.name
    );
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
  @include flex-box(column, stretch, flex-start);
  width: 100%;
  height: 100%;
  overflow-y: scroll;
}
</style>
