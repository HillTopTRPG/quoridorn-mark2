<template>
  <div class="container" ref="window-container">
    <simple-tab-component
      :windowKey="windowKey"
      :tabList="tabList"
      v-model="currentTabInfo"
    >
      <!-- タブリストタブ -->
      <div class="tab-container" v-if="currentTabInfo.target === 'tab-list'">
        <div
          class="tab-info tab-all"
          :class="{ 'not-use': !isUseAllTab }"
          @click="isUseAllTab = !isUseAllTab"
        >
          <span class="icon-menu"></span>
          <span v-t="'label.all'"></span>

          <div class="check-box">
            <span v-t="`label.${isUseAllTab ? '' : 'un-'}use`"></span>
            <span :class="`icon-eye${isUseAllTab ? '' : '-blocked'}`"></span>
          </div>
        </div>
        <draggable
          :options="{
            animation: 10,
            handle: dragMode ? '' : '.anonymous'
          }"
          class="draggable-box"
          v-model="filteredChatTabList"
          @start="onSortStart()"
          @end="onSortEnd()"
          @sort="onSortOrderChange()"
        >
          <chat-tab-component
            v-for="tab in filteredChatTabList"
            :key="tab.id"
            :tab="tab"
            :dragMode="dragMode"
            :changeOrderId="changeOrderId"
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
          v-model="dragMode"
          colorStyle="skyblue"
          c-icon="checkmark"
          :c-label="$t('label.sort')"
          n-icon=""
          :n-label="$t('label.sort')"
          @hover="onHoverView"
        />
      </div>

      <!-- その他タブ -->
      <div class="other-block" v-if="currentTabInfo.target === 'other'">
        <table>
          <tr>
            <tr-checkbox-component
              labelName="read-aloud"
              cLabel=""
              nLabel=""
              v-model="useReadAloudLocal"
            />
          </tr>
        </table>
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
import App from "../../../views/App.vue";
import WindowVue from "../../core/window/WindowVue";
import { Getter, Mutation } from "vuex-class";
import GameObjectManager from "../GameObjectManager";
import { StoreUseData } from "../../../@types/store";
import TaskProcessor from "../../core/task/TaskProcessor";
import LifeCycle from "../../core/decorator/LifeCycle";
import SocketFacade, {
  permissionCheck
} from "../../core/api/app-server/SocketFacade";
import TaskManager from "../../core/task/TaskManager";
import { TabInfo, WindowOpenInfo } from "../../../@types/window";
import LanguageManager from "../../../LanguageManager";
import { ChatTabInfo } from "../../../@types/room";
import { DataReference } from "../../../@types/data";
import VueEvent from "../../core/decorator/VueEvent";
import TrCheckboxComponent from "../common/components/TrCheckboxComponent.vue";
import ChatTabComponent from "./tab/ChatTabComponent.vue";
import SimpleTabComponent from "../../core/component/SimpleTabComponent.vue";
import CtrlButton from "../../core/component/CtrlButton.vue";
import SCheck from "../common/components/SCheck.vue";

@Component({
  components: {
    SimpleTabComponent,
    ChatTabComponent,
    TrCheckboxComponent,
    SCheck,
    CtrlButton,
    draggable
  }
})
export default class ChatSettingWindow extends Mixins<WindowVue<void, never>>(
  WindowVue
) {
  @Mutation("setUseReadAloud")
  private setUseReadAloud!: (useReadAloud: boolean) => void;

  @Getter("useReadAloud")
  private useReadAloud!: boolean;

  private chatTabList = GameObjectManager.instance.chatTabList;
  private filteredChatTabList: StoreUseData<ChatTabInfo>[] = [];
  private chatTabListCC = SocketFacade.instance.chatTabListCC();
  private chatPublicInfo = GameObjectManager.instance.chatPublicInfo;

  private dragMode = false;
  private changeOrderId: string = "";
  private orderChangingIdList: string[] = [];
  private dragModeProcessed: boolean = false;
  private useReadAloudLocal: boolean = false;

  private isUseAllTab: boolean = false;

  private tabList: TabInfo[] = [
    { target: "tab-list", text: "" },
    { target: "other", text: "" }
  ];
  private currentTabInfo: TabInfo = this.tabList[0];

  @TaskProcessor("language-change-finished")
  private async languageChangeFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    this.createTabInfoList();
    task.resolve();
  }

  @Watch("useReadAloudLocal")
  private onChangeUseReadAloudLocal() {
    this.setUseReadAloud(this.useReadAloudLocal);
  }

  @LifeCycle
  private async created() {
    this.createTabInfoList();
    this.useReadAloudLocal = this.useReadAloud;
  }

  @LifeCycle
  public async mounted() {
    await this.init();
    this.isUseAllTab = this.chatPublicInfo.isUseAllTab;
    this.currentTabInfo = this.tabList.filter(t => t.target === "tab-list")[0];
  }

  private createTabInfoList() {
    this.tabList.forEach(t => {
      t.text = this.$t(`label.${t.target}`)!.toString();
    });
  }

  @Watch("isUseAllTab")
  private onChangeIsUseAllTab() {
    this.chatPublicInfo.isUseAllTab = this.isUseAllTab;
  }

  @Watch("chatPublicInfo.isUseAllTab")
  private onChangePublicIsUseAllTab() {
    this.isUseAllTab = this.chatPublicInfo.isUseAllTab;
  }

  @Watch("chatTabList", { immediate: true, deep: true })
  private onChangeTabList() {
    this.filteredChatTabList = this.chatTabList.filter(ct =>
      permissionCheck(ct, "view")
    );
  }

  @VueEvent
  private isEditable(tabInfo: StoreUseData<ChatTabInfo>) {
    return permissionCheck(tabInfo, "edit");
  }

  @VueEvent
  private async editTab(tabInfo: StoreUseData<ChatTabInfo>) {
    if (!this.isEditable(tabInfo)) return;

    await TaskManager.instance.ignition<WindowOpenInfo<string>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "chat-tab-edit-window",
        args: tabInfo.id!
      }
    });
  }

  @VueEvent
  private isChmodAble(tabInfo: StoreUseData<ChatTabInfo>) {
    return permissionCheck(tabInfo, "chmod");
  }

  @VueEvent
  private async chmodTab(tabInfo: StoreUseData<ChatTabInfo>) {
    if (!this.isChmodAble(tabInfo)) return;

    await TaskManager.instance.ignition<WindowOpenInfo<DataReference>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "chmod-window",
        args: {
          type: "chat-tab",
          docId: tabInfo.id!
        }
      }
    });
  }

  @VueEvent
  private isDeletable(tabInfo: StoreUseData<ChatTabInfo>) {
    return !tabInfo.data!.isSystem && permissionCheck(tabInfo, "edit");
  }

  @VueEvent
  private async deleteTab(tabInfo: StoreUseData<ChatTabInfo>) {
    if (!this.isDeletable(tabInfo)) return;
    const msg = ChatSettingWindow.getDialogMessage("delete-tab").replace(
      "$1",
      tabInfo.data!.name
    );
    const result = window.confirm(msg);
    if (!result) return;

    try {
      await this.chatTabListCC.deletePackage([tabInfo.id!]);
    } catch (err) {
      // TODO error message.
      return;
    }
  }

  @VueEvent
  private async addTab() {
    await App.openSimpleWindow("chat-tab-add-window");
  }

  @VueEvent
  private getExclusionOwner(exclusionOwner: string) {
    return GameObjectManager.instance.getExclusionOwnerName(exclusionOwner);
  }

  private static getDialogMessage(target: string) {
    const msgTarget = "chat-setting-window.dialog." + target;
    return LanguageManager.instance.getText(msgTarget);
  }

  @VueEvent
  private onHover(messageType: string, isHover: boolean) {
    this.windowInfo.message = isHover
      ? LanguageManager.instance.getText(
          `chat-setting-window.message-list.${messageType}`
        )
      : "";
  }

  @Watch("dragMode")
  private async onChangeDragMode() {
    this.$emit("onChangeDragMode", this.dragMode);

    const idList: string[] = this.filteredChatTabList.map(ct => ct.id!);
    if (this.dragMode) {
      let error: boolean = false;

      try {
        await this.chatTabListCC.touchModify(idList);
      } catch (err) {
        error = true;
        alert("Failure to get sceneAndLayerList's lock.\nPlease try again.");
      }

      if (error) {
        this.dragModeProcessed = true;
        this.dragMode = false;
        this.orderChangingIdList = [];
      } else {
        this.orderChangingIdList = idList;
      }
    } else {
      this.orderChangingIdList = [];
      if (!this.dragModeProcessed) {
        await this.chatTabListCC.releaseTouch(idList);
        this.dragModeProcessed = false;
      }
    }
  }

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing2(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value !== this.windowInfo.key) return;
    if (this.dragMode && !this.dragModeProcessed) {
      const idList: string[] = this.filteredChatTabList.map(ct => ct.id!);
      await this.chatTabListCC.releaseTouch(idList);
      this.dragModeProcessed = false;
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
    this.changeOrderId = "";
  }

  @VueEvent
  private async onSortOrderChange() {
    console.log("onEndOrderChange");
    const idOrderList = this.filteredChatTabList.map(ct => ({
      id: ct.id!,
      order: ct.order,
      target: false
    }));
    const orderList = idOrderList.concat().map(ido => ido.order);
    orderList.sort((o1, o2) => {
      if (o1 < o2) return -1;
      if (o1 > o2) return 1;
      return 0;
    });
    idOrderList.forEach((ido, idx: number) => {
      if (ido.order !== orderList[idx]) ido.target = true;
      ido.order = orderList[idx];
    });

    const idList: string[] = [];
    const dataList: ChatTabInfo[] = [];
    const optionList: any = [];
    this.filteredChatTabList.forEach((obj, idx) => {
      if (!idOrderList[idx].target) return;
      const id = idOrderList[idx].id;
      const order = idOrderList[idx].order;
      const data = this.filteredChatTabList.filter(ct => ct.id === id)[0].data!;
      idList.push(id);
      dataList.push(data);
      optionList.push({
        order,
        continuous: true
      });
    });

    await this.chatTabListCC.update(idList, dataList, optionList);
  }

  @VueEvent
  private onHoverView(isHover: boolean) {
    if (isHover) this.$emit("onMouseHoverView", true);
    else {
      if (this.dragMode) this.$emit("onMouseHoverOrder", true);
      else this.$emit("onMouseHoverView", false);
    }
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

.sort-check {
  position: absolute;
  right: 0;
}
</style>
