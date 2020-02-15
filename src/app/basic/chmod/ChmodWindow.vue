<template>
  <div class="container" ref="window" v-if="permission">
    <simple-tab-component :tabList="tabList" v-model="currentTabInfo">
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
import LifeCycle from "@/app/core/decorator/LifeCycle";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import WindowVue from "@/app/core/window/WindowVue";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import LanguageManager from "@/LanguageManager";
import { Task, TaskResult } from "task";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { TabInfo } from "@/@types/window";
import PermissionTypeSelect from "@/app/basic/common/components/select/PermissionTypeSelect.vue";
import { Permission } from "@/@types/store";
import PermissionNodeTypeSelect from "@/app/basic/common/components/select/PermissionNodeTypeSelect.vue";
import ChmodRuleEditComponent from "@/app/basic/chmod/ChmodRuleEditComponent.vue";
import { DataReference } from "@/@types/data";
import VueEvent from "@/app/core/decorator/VueEvent";
import SocketFacade, {
  permissionCheck
} from "@/app/core/api/app-server/SocketFacade";
import NekostoreCollectionController from "@/app/core/api/app-server/NekostoreCollectionController";

@Component({
  components: {
    ChmodRuleEditComponent,
    PermissionNodeTypeSelect,
    PermissionTypeSelect,
    SimpleTabComponent,
    CtrlButton
  }
})
export default class ChmodWindow extends Mixins<
  WindowVue<DataReference, never>
>(WindowVue) {
  private isMounted: boolean = false;
  private docId: string = "";
  private isProcessed: boolean = false;
  private permission: Permission | null = null;
  private cc: NekostoreCollectionController<unknown> | null = null;

  private tabList: TabInfo[] = [
    { target: "view", text: "" },
    { target: "edit", text: "" },
    { target: "chmod", text: "" }
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
    const getText = LanguageManager.instance.getText.bind(
      LanguageManager.instance
    );
    this.tabList.forEach(t => {
      t.text = getText(`label.permission-${t.target}`);
    });
  }

  @LifeCycle
  private async mounted() {
    await this.init();

    this.isMounted = true;
    const type = this.windowInfo.args!.type;
    this.docId = this.windowInfo.args!.docId;
    this.cc = SocketFacade.instance.getCC(type);
    const data = (await this.cc!.getData(this.docId))!;
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
      await this.cc.touchModify(this.docId);
    } catch (err) {
      window.console.warn(err);
      this.isProcessed = true;
      await this.close();
    }
  }

  @VueEvent
  private async commit() {
    const data = (await this.cc!.getData(this.docId))!;
    await this.cc!.update(this.docId, data.data!, {
      permission: this.permission || undefined
    });
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
      await this.cc!.releaseTouch(this.docId);
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
    window.console.log(this.permission);
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
