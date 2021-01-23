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
import { Component } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import { TabInfo } from "@/@types/window";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import SocketFacade, {
  permissionCheck
} from "@/app/core/api/app-server/SocketFacade";
import ChmodRuleEditComponent from "@/app/basic/chmod/ChmodRuleEditComponent.vue";
import WindowVue from "@/app/core/window/WindowVue";
import PermissionTypeSelect from "@/app/basic/common/components/select/PermissionTypeSelect.vue";
import NekostoreCollectionController from "@/app/core/api/app-server/NekostoreCollectionController";
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
export default class ChmodWindow extends Mixins<
  WindowVue<DataReference, never>
>(WindowVue) {
  private isMounted: boolean = false;
  private docKey: string = "";
  private isProcessed: boolean = false;
  private permission: Permission | null = null;
  private cc: NekostoreCollectionController<unknown> | null = null;

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

    this.isMounted = true;
    const type = this.windowInfo.args!.type;
    this.docKey = this.windowInfo.args!.key;
    this.cc = SocketFacade.instance.getCC(type);
    const data = (await this.cc!.findSingle("key", this.docKey))!.data!;
    this.permission = data.permission;

    if (this.windowInfo.status === "window") {
      // 排他チェック
      if (data.exclusionOwner) {
        this.isProcessed = true;
        await this.close();
        return;
      }

      // パーミッションチェック
      if (!permissionCheck(data, "chmod")) {
        this.isProcessed = true;
        await this.close();
        return;
      }
    }

    try {
      await this.cc.touchModify([this.docKey]);
    } catch (err) {
      console.warn(err);
      this.isProcessed = true;
      await this.close();
    }
  }

  @VueEvent
  private async commit() {
    await this.cc!.update([
      {
        key: this.docKey,
        permission: this.permission || undefined
      }
    ]);
    this.isProcessed = true;
    await this.close();
  }

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing2(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value !== this.windowInfo.key) return;
    if (!this.isProcessed) {
      this.isProcessed = true;
      await this.rollback();
    }
  }

  @VueEvent
  private async rollback() {
    try {
      await this.cc!.releaseTouch([this.docKey]);
    } catch (err) {
      // nothing
    }
    if (!this.isProcessed) {
      this.isProcessed = true;
      await this.close();
    }
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
