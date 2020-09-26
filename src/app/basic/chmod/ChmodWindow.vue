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
import { Component } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import TaskProcessor from "../../core/task/TaskProcessor";
import LifeCycle from "../../core/decorator/LifeCycle";
import ChmodRuleEditComponent from "./ChmodRuleEditComponent.vue";
import SocketFacade, {
  permissionCheck
} from "../../core/api/app-server/SocketFacade";
import NekostoreCollectionController from "../../core/api/app-server/NekostoreCollectionController";
import VueEvent from "../../core/decorator/VueEvent";
import WindowVue from "../../core/window/WindowVue";
import CtrlButton from "../../core/component/CtrlButton.vue";
import PermissionTypeSelect from "../common/components/select/PermissionTypeSelect.vue";
import { TabInfo } from "@/@types/window";
import { DataReference } from "@/@types/data";
import SimpleTabComponent from "../../core/component/SimpleTabComponent.vue";

@Component({
  components: {
    ChmodRuleEditComponent,
    PermissionTypeSelect,
    SimpleTabComponent,
    CtrlButton
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
