<template>
  <div class="container" ref="window" v-if="permission">
    <simple-tab-component
      :windowKey="windowKey"
      :tabList="tabList"
      v-model="currentTabInfo"
    >
      <chmod-rule-edit-component
        v-if="currentTabInfo.target === 'view'"
        :key="1"
        :permissionRule="permission.view"
        @update="updatePermission"
      />
      <chmod-rule-edit-component
        v-if="currentTabInfo.target === 'edit'"
        :key="2"
        :permissionRule="permission.edit"
        @update="updatePermission"
      />
      <chmod-rule-edit-component
        v-if="currentTabInfo.target === 'chmod'"
        :key="3"
        :permissionRule="permission.chmod"
        @update="updatePermission"
      />
    </simple-tab-component>

    <button-area
      :is-commit-able="true"
      commit-text="modify"
      @commit="commit()"
      @rollback="rollback()"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import { TabInfo } from "@/@types/window";
import { clone } from "@/app/core/utility/PrimaryDataUtility";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import ChmodRuleEditComponent from "@/app/basic/chmod/ChmodRuleEditComponent.vue";
import WindowVue from "@/app/core/window/WindowVue";
import PermissionTypeSelect from "@/app/basic/common/components/select/PermissionTypeSelect.vue";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import VueEvent from "@/app/core/decorator/VueEvent";

@Component({
  components: {
    ButtonArea,
    ChmodRuleEditComponent,
    PermissionTypeSelect,
    SimpleTabComponent
  }
})
export default class ChmodInputWindow extends Mixins<
  WindowVue<Permission, Permission>
>(WindowVue) {
  private permission: Permission | null = null;

  private tabList: TabInfo[] = [
    { key: "1", target: "view", text: "", isDisabled: false },
    { key: "2", target: "edit", text: "", isDisabled: false },
    { key: "3", target: "chmod", text: "", isDisabled: false }
  ];
  private currentTabInfo: TabInfo | null = this.tabList[0];

  @TaskProcessor("language-change-finished")
  private async languageChangeFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    this.createTabInfoList();
    task.resolve();
  }

  @LifeCycle
  private async created() {
    this.createTabInfoList();
  }

  private createTabInfoList() {
    this.tabList.forEach(t => {
      t.text = this.$t(`selection.permission.${t.target}`)!.toString();
    });
  }

  @LifeCycle
  private async mounted() {
    await this.init();
    this.permission = clone(this.windowInfo.args!)!;
  }

  @VueEvent
  private async commit() {
    await this.finally(this.permission || undefined);
  }

  @VueEvent
  private async rollback() {
    await this.finally();
  }

  @VueEvent
  private async updatePermission() {
    console.log(this.permission);
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.container {
  @include flex-box(column, stretch, center);
  overflow-y: auto;
  height: 100%;

  .simple-tab-component {
    flex: 1;

    > *:not(:first-child) {
      border: 1px solid gray;
      padding: 0.5rem;
      box-sizing: border-box;
    }
  }
}
</style>
