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

    <div class="button-area">
      <ctrl-button @click="commit()">
        <span v-t="'button.modify'"></span>
      </ctrl-button>
      <ctrl-button @click="rollback()">
        <span v-t="'button.reject'"></span>
      </ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import TaskProcessor from "../../core/task/TaskProcessor";
import LifeCycle from "../../core/decorator/LifeCycle";
import ChmodRuleEditComponent from "./ChmodRuleEditComponent.vue";
import VueEvent from "../../core/decorator/VueEvent";
import WindowVue from "../../core/window/WindowVue";
import CtrlButton from "../../core/component/CtrlButton.vue";
import PermissionTypeSelect from "../common/components/select/PermissionTypeSelect.vue";
import { Permission } from "@/@types/store";
import { TabInfo } from "@/@types/window";
import SimpleTabComponent from "../../core/component/SimpleTabComponent.vue";
import { clone } from "@/app/core/utility/PrimaryDataUtility";

@Component({
  components: {
    ChmodRuleEditComponent,
    PermissionTypeSelect,
    SimpleTabComponent,
    CtrlButton
  }
})
export default class ChmodInputWindow extends Mixins<
  WindowVue<Permission, Permission>
>(WindowVue) {
  private permission: Permission | null = null;

  private tabList: TabInfo[] = [
    { key: "1", target: "view", text: "" },
    { key: "2", target: "edit", text: "" },
    { key: "3", target: "chmod", text: "" }
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
      t.text = this.$t(`label.permission-${t.target}`)!.toString();
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
