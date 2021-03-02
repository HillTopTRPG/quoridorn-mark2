<template>
  <div class="container" ref="window-container">
    <authority-group-info-form
      :is-system="isSystem"
      :name.sync="name"
      :list.sync="list"
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
import { AuthorityGroupStore } from "@/@types/store-data";
import { findRequireByKey } from "@/app/core/utility/Utility";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import WindowVue from "@/app/core/window/WindowVue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import VueEvent from "@/app/core/decorator/VueEvent";
import EditWindowDelegator, {
  EditWindow
} from "@/app/core/window/EditWindowDelegator";
import AuthorityGroupInfoForm from "@/app/basic/object/authority-group/AuthorityGroupInfoForm.vue";
import { GroupRef } from "@/@types/store-data-optional";

@Component({ components: { AuthorityGroupInfoForm, ButtonArea } })
export default class AuthorityGroupEditWindow
  extends Mixins<WindowVue<DataReference, never>>(WindowVue)
  implements EditWindow<AuthorityGroupStore> {
  private editWindowDelegator = new EditWindowDelegator<AuthorityGroupStore>(
    this
  );

  private name: string = "";
  private isSystem: boolean = false;
  private list: GroupRef[] = [];

  @Watch("list", { deep: true })
  private onChangeList() {
    console.log(JSON.stringify(this.list, null, "  "));
  }

  @LifeCycle
  public async mounted() {
    await this.editWindowDelegator.init();
    this.inputEnter("input:not([type='button'])", this.commit);
  }

  public isCommitAble(): boolean {
    return !this.isDuplicate && !!this.name && this.list.length > 0;
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

  public pullStoreData(data: StoreData<AuthorityGroupStore>): void {
    this.name = data.data!.name;
    this.isSystem = data.data!.isSystem;
    this.list = data.data!.list;
  }

  public async pushStoreData(
    data: StoreData<AuthorityGroupStore>
  ): Promise<void> {
    data.data!.name = this.name;
    data.data!.isSystem = this.isSystem;
    data.data!.list = this.list;
  }

  private get isDuplicate(): boolean {
    return GameObjectManager.instance.authorityGroupList.some(
      ct =>
        ct.data!.name === this.name &&
        ct.key !== this.editWindowDelegator.docKey
    );
  }

  @Watch("isDuplicate")
  private onChangeIsDuplicate() {
    const authorityGroup = findRequireByKey(
      GameObjectManager.instance.authorityGroupList,
      this.editWindowDelegator.docKey
    );
    this.windowInfo.message = this.isDuplicate
      ? this.$t("message.name-duplicate")!.toString()
      : this.$t("message.original")!
          .toString()
          .replace("$1", authorityGroup ? authorityGroup.data!.name : "");
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.container {
  @include flex-box(column, stretch, flex-start);
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
