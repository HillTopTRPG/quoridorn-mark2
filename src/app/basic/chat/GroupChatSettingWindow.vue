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
            handle: dragModeTab ? '' : '.anonymous'
          }"
          class="draggable-box"
          v-model="filteredGropuChatTabList"
          @start="onSortStart()"
          @end="onSortEnd()"
          @sort="onSortOrderChangeTab()"
        >
          <group-chat-component
            v-for="tab in filteredGropuChatTabList"
            :key="tab.key"
            :tab="tab"
            :dragMode="dragModeTab"
            :changeOrderKey="changeOrderKey"
            @hover="onHover"
          />
        </draggable>
      </div>

      <div class="button-area" v-if="currentTabInfo.target === 'tab-list'">
        <ctrl-button @click="addTab()">
          <span v-t="'button.add'"></span>
        </ctrl-button>
        <s-check
          class="sort-check"
          v-model="dragModeTab"
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
import { Getter, Mutation } from "vuex-class";
import { TabInfo, WindowOpenInfo } from "@/@types/window";
import NekostoreCollectionController from "@/app/core/api/app-server/NekostoreCollectionController";
import { GroupChatTabStore } from "@/@types/store-data";
import {
  errorDialog,
  findRequireByKey,
  questionDialog
} from "@/app/core/utility/Utility";
import LanguageManager from "@/LanguageManager";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import App from "@/views/App.vue";
import SocketFacade, {
  permissionCheck
} from "@/app/core/api/app-server/SocketFacade";
import VueEvent from "@/app/core/decorator/VueEvent";
import TaskManager from "@/app/core/task/TaskManager";
import TrCheckboxComponent from "@/app/basic/common/components/table-item/TrCheckboxComponent.vue";
import WindowVue from "@/app/core/window/WindowVue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import SCheck from "@/app/basic/common/components/SCheck.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import GroupChatComponent from "@/app/basic/chat/group/GroupChatComponent.vue";

@Component({
  components: {
    GroupChatComponent,
    SimpleTabComponent,
    TrCheckboxComponent,
    SCheck,
    CtrlButton,
    draggable
  }
})
export default class GroupChatSettingWindow extends Mixins<
  WindowVue<void, never>
>(WindowVue) {
  @Mutation("setUseReadAloud")
  private setUseReadAloud!: (useReadAloud: boolean) => void;

  @Getter("useReadAloud")
  private useReadAloud!: boolean;

  private groupChatTabList = GameObjectManager.instance.groupChatTabList;
  private filteredGropuChatTabList: StoreData<GroupChatTabStore>[] = [];
  private groupChatTabListCC = SocketFacade.instance.groupChatTabListCC();

  private dragModeTab = false;
  private dragModeTabProcessed: boolean = false;
  private changeOrderKey: string = "";
  private orderChangingKeyList: string[] = [];

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
    this.currentTabInfo = this.tabList.find(t => t.target === "tab-list")!;
  }

  @Watch("currentTabInfo")
  private onChangeCurrentTabInfo() {
    this.dragModeTab = false;
  }

  private createTabInfoList() {
    this.tabList.forEach(t => {
      t.text = this.$t(`label.${t.target}`)!.toString();
    });
  }

  @Watch("groupChatTabList", { immediate: true, deep: true })
  private onChangeTabListImmediateDeep() {
    this.filteredGropuChatTabList = this.groupChatTabList.filter(ct =>
      permissionCheck(ct, "view")
    );
  }

  @VueEvent
  private isEditable(tabInfo: StoreData<GroupChatTabStore>) {
    return permissionCheck(tabInfo, "edit");
  }

  @VueEvent
  private async editTab(tabInfo: StoreData<GroupChatTabStore>) {
    if (!this.isEditable(tabInfo)) return;

    await TaskManager.instance.ignition<WindowOpenInfo<DataReference>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "group-chat-tab-edit-window",
        args: {
          type: tabInfo.collection,
          key: tabInfo.key
        }
      }
    });
  }

  @VueEvent
  private isChmodAble(tabInfo: StoreData<GroupChatTabStore>) {
    return permissionCheck(tabInfo, "chmod");
  }

  @VueEvent
  private async chmodTab(tabInfo: StoreData<GroupChatTabStore>) {
    if (!this.isChmodAble(tabInfo)) return;

    await TaskManager.instance.ignition<WindowOpenInfo<DataReference>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "chmod-window",
        args: {
          type: tabInfo.collection,
          key: tabInfo.key
        }
      }
    });
  }

  @VueEvent
  private isDeletable(tabInfo: StoreData<GroupChatTabStore>) {
    return !tabInfo.data!.isSystem && permissionCheck(tabInfo, "edit");
  }

  @VueEvent
  private async deleteTab(tabInfo: StoreData<GroupChatTabStore>) {
    if (!this.isDeletable(tabInfo)) return;
    const text = this.$t("message.delete-tab")!
      .toString()
      .replace("$1", tabInfo.data!.name);
    const result = await questionDialog({
      title: this.$t("button.delete").toString(),
      text,
      confirmButtonText: this.$t("button.delete").toString(),
      cancelButtonText: this.$t("button.reject").toString()
    });
    if (!result) return;

    try {
      await this.groupChatTabListCC.deletePackage([tabInfo.key]);
    } catch (err) {
      // TODO error message.
      return;
    }
  }

  @VueEvent
  private async addTab() {
    await App.openSimpleWindow("group-chat-tab-add-window");
  }

  @VueEvent
  private getExclusionOwner(exclusionOwner: string) {
    return GameObjectManager.instance.getExclusionOwnerName(exclusionOwner);
  }

  @VueEvent
  private onHover(messageType: string, isHover: boolean) {
    this.windowInfo.message = isHover
      ? this.$t(
          `group-chat-setting-window.message-list.${messageType}`
        )!.toString()
      : "";
  }

  @Watch("dragModeTab")
  private async onChangeDragModeTab() {
    const keyList: string[] = this.filteredGropuChatTabList.map(ct => ct.key);
    if (this.dragModeTab) {
      let error: boolean = false;

      try {
        await this.groupChatTabListCC.touchModify(keyList);
      } catch (err) {
        error = true;
        await errorDialog({
          title: LanguageManager.instance.getText("message.error"),
          text: "Failure to get sceneAndLayerList's lock.\nPlease try again."
        });
      }

      if (error) {
        this.dragModeTabProcessed = true;
        this.dragModeTab = false;
        this.orderChangingKeyList = [];
      } else {
        this.orderChangingKeyList = keyList;
      }
    } else {
      this.orderChangingKeyList = [];
      if (!this.dragModeTabProcessed) {
        await this.groupChatTabListCC.releaseTouch(keyList);
        this.dragModeTabProcessed = false;
      }
    }
  }

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing2(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value !== this.windowInfo.key) return;
    if (this.dragModeTab && !this.dragModeTabProcessed) {
      const keyList: string[] = this.filteredGropuChatTabList.map(ct => ct.key);
      await this.groupChatTabListCC.releaseTouch(keyList);
      this.dragModeTabProcessed = false;
    }
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
  private async onSortOrderChangeTab() {
    await GroupChatSettingWindow.sortUpdate(
      this.filteredGropuChatTabList,
      this.groupChatTabListCC
    );
  }

  private static async sortUpdate<T>(
    dataList: StoreData<T>[],
    cc: NekostoreCollectionController<T>
  ) {
    const keyOrderList = dataList.map(ct => ({
      key: ct.key,
      order: ct.order,
      target: false
    }));
    const orderList = keyOrderList.concat().map(keyo => keyo.order);
    orderList.sort((o1, o2) => {
      if (o1 < o2) return -1;
      if (o1 > o2) return 1;
      return 0;
    });
    keyOrderList.forEach((keyo, index: number) => {
      if (keyo.order !== orderList[index]) keyo.target = true;
      keyo.order = orderList[index];
    });

    const list: (Partial<StoreData<T>> & {
      key: string;
      continuous?: boolean;
    })[] = [];
    dataList.forEach((obj, index) => {
      if (!keyOrderList[index].target) return;
      const key = keyOrderList[index].key;
      const order = keyOrderList[index].order;
      const data = findRequireByKey(dataList, key).data!;
      list.push({
        key,
        order,
        data,
        continuous: true
      });
    });

    await cc.update(list);
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

.tab-container,
.like-container {
  @include flex-box(column, stretch, flex-start);
  flex: 1;
  background-color: white;
  overflow-y: scroll;
  border: solid 1px gray;
}

.draggable-box {
  display: contents;
}

.tab-info,
.like-info {
  @include flex-box(row, flex-start, center);
  position: relative;
  height: 2em;
  min-height: 2em;
  padding: 0 0.3rem;
  border-bottom: 1px dotted var(--uni-color-gray);
  box-sizing: border-box;
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

.sort-check {
  position: absolute;
  right: 0;
}
</style>
