<template>
  <div class="container" ref="window-container">
    <simple-tab-component
      :windowKey="windowKey"
      :tabList="tabList"
      v-model="currentTabInfo"
    >
      <!-- タブリストタブ -->
      <div class="tab-container" v-if="currentTabInfo.target === 'tab-list'">
        <draggable
          :options="{
            animation: 10,
            handle: dragMode ? '' : '.anonymous'
          }"
          class="draggable-box"
          v-model="useMemoList"
          @start="onSortStart()"
          @end="onSortEnd()"
        >
          <template v-for="tab in useMemoList">
            <memo-tab-component
              v-if="localPermissionCheck(tab)"
              :key="tab.key"
              :tab="tab"
              :dragMode="dragMode"
              :changeOrderKey="changeOrderKey"
              @hover="onHover"
              @edit="editTab"
              @chmod="chmodTab"
              @delete="deleteTab"
            />
          </template>
        </draggable>
      </div>

      <div class="button-area" v-if="currentTabInfo.target === 'tab-list'">
        <ctrl-button @click="commit()">
          <span v-t="'button.commit'"></span>
        </ctrl-button>
        <ctrl-button @click="rollback()">
          <span v-t="'button.reject'"></span>
        </ctrl-button>
        <ctrl-button @click="addTab()">
          <span v-t="'button.add'"></span>
        </ctrl-button>
        <s-check
          class="sort-check"
          v-model="dragMode"
          colorStyle="skyblue"
          c-icon="checkmark"
          :c-label="$t('label.sort')"
          n-icon=""
          :n-label="$t('label.sort')"
        />
      </div>
    </simple-tab-component>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import draggable from "vuedraggable";
import { Task, TaskResult } from "task";
import { ModeInfo } from "mode";
import { MemoStore } from "@/@types/store-data";
import { TabInfo, WindowOpenInfo } from "@/@types/window";
import MemoTabComponent from "@/app/basic/other-text/MemoTabComponent.vue";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import VueEvent from "@/app/core/decorator/VueEvent";
import { permissionCheck } from "@/app/core/api/app-server/SocketFacade";
import TaskManager from "@/app/core/task/TaskManager";
import TrCheckboxComponent from "@/app/basic/common/components/table-item/TrCheckboxComponent.vue";
import WindowVue from "@/app/core/window/WindowVue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import SCheck from "@/app/basic/common/components/SCheck.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { clone } from "@/app/core/utility/PrimaryDataUtility";
import { createEmptyStoreUseData } from "@/app/core/utility/Utility";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
const uuid = require("uuid");

@Component({
  components: {
    MemoTabComponent,
    SimpleTabComponent,
    TrCheckboxComponent,
    SCheck,
    CtrlButton,
    draggable
  }
})
export default class MemoTabSettingWindow extends Mixins<
  WindowVue<StoreData<MemoStore>[], StoreData<MemoStore>[]>
>(WindowVue) {
  public useMemoList: StoreData<MemoStore>[] = [];

  private dragMode = false;
  private changeOrderKey: string = "";

  private tabList: TabInfo[] = [
    { key: "1", target: "tab-list", text: "", isDisabled: false }
  ];
  private currentTabInfo: TabInfo = this.tabList[0];

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

  @LifeCycle
  public async mounted() {
    await this.init();
    this.useMemoList = clone(this.windowInfo.args!)!;
  }

  private createTabInfoList() {
    this.tabList.forEach(t => {
      t.text = this.$t(`label.${t.target}`)!.toString();
    });
  }

  @VueEvent
  private async editTab(tabInfo: StoreData<MemoStore>) {
    const useMemo = this.useMemoList.find(lv => lv.key === tabInfo.key)!;
    const text = await this.getInputTab(useMemo.data!.tab);
    if (text) {
      useMemo.data!.tab = text;
    }
  }

  @VueEvent
  private async chmodTab(tabInfo: StoreData<MemoStore>) {
    const useMemo = this.useMemoList.find(lv => lv.key === tabInfo.key)!;
    useMemo.permission = (
      await TaskManager.instance.ignition<
        WindowOpenInfo<Permission>,
        Permission
      >({
        type: "window-open",
        owner: "Quoridorn",
        value: {
          type: "chmod-input-window",
          args: useMemo.permission!
        }
      })
    )[0];
  }

  @VueEvent
  private async deleteTab(tabInfo: StoreData<MemoStore>) {
    const index = this.useMemoList.findIndex(lv => lv.key === tabInfo.key);
    this.useMemoList.splice(index, 1);
  }

  private async getInputTab(tab: string): Promise<string | undefined> {
    return (
      await TaskManager.instance.ignition<
        WindowOpenInfo<{ title: string; label: string; text: string }>,
        string
      >({
        type: "window-open",
        owner: "Quoridorn",
        value: {
          type: "simple-text-input-window",
          args: {
            text: tab,
            label: this.$t("label.tab").toString(),
            title: this.$t("label.input-tab").toString()
          }
        }
      })
    )[0];
  }

  @VueEvent
  private async addTab() {
    const text = await this.getInputTab("");
    if (text === undefined) return;
    this.useMemoList.push(
      createEmptyStoreUseData(uuid.v4(), {
        tab: text,
        type: "normal",
        text: ""
      })
    );
  }

  @VueEvent
  private getExclusionOwner(exclusionOwner: string) {
    return GameObjectManager.instance.getExclusionOwnerName(exclusionOwner);
  }

  @VueEvent
  private onHover(messageType: string, isHover: boolean) {
    this.windowInfo.message = isHover
      ? this.$t(`chat-setting-window.message-list.${messageType}`)!.toString()
      : "";
  }

  @VueEvent
  private localPermissionCheck(data: StoreData<MemoStore>) {
    return permissionCheck(data, "view");
  }

  @Watch("dragMode")
  private async onChangeDragMode() {
    this.$emit("onChangeDragMode", this.dragMode);
  }

  @VueEvent
  private async onSortStart() {
    await TaskManager.instance.ignition<ModeInfo, never>({
      type: "mode-change",
      owner: "Quoridorn",
      value: { type: "special-drag", value: "on" as "on" }
    });
  }

  @VueEvent
  private async onSortEnd() {
    await TaskManager.instance.ignition<ModeInfo, never>({
      type: "mode-change",
      owner: "Quoridorn",
      value: { type: "special-drag", value: "off" as "off" }
    });
    this.changeOrderKey = "";
  }

  @VueEvent
  private async commit() {
    await this.finally(this.useMemoList || undefined);
  }

  @VueEvent
  private async rollback() {
    await this.finally();
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.container {
  @include flex-box(column, stretch, flex-start);
  width: 100%;
  height: 100%;
}

.simple-tab-component {
  @include flex-box(column, stretch, flex-start);
  width: 100%;
  height: 100%;
}

.other-block {
  border: solid 1px gray;
  height: 100%;
  box-sizing: border-box;
  padding: 0.2rem;
}

.tab-container {
  @include flex-box(column, stretch, flex-start);
  flex: 1;
  background-color: white;
  overflow-y: scroll;
  border: solid 1px gray;
}

.draggable-box {
  display: contents;
}

.tab-info {
  @include flex-box(row, flex-start, center);
  position: relative;
  height: 2em;
  min-height: 2em;
  padding: 0 0.3rem;
  border-bottom: 1px dotted var(--uni-color-gray);
  box-sizing: border-box;

  &.tab-all {
    @include btn-skyblue();
  }
}

.icon-menu {
  visibility: hidden;
}

.check-box {
  @include flex-box(row, flex-start, center);
  position: absolute;
  right: 0.3rem;
  top: 0;
  bottom: 0;
}
</style>
