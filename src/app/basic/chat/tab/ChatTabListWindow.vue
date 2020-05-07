<template>
  <div class="container" ref="window-container">
    <div class="tab-container">
      <!--
      @drop.prevent.stop
      @dragenter.prevent.stop
      @dragleave.prevent.stop
      -->
      <div
        class="tab-info tab-all"
        :class="{ 'not-use': !isUseAllTab }"
        @click="isUseAllTab = !isUseAllTab"
      >
        <span class="icon-menu drag-mark"></span>
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
        <div
          v-for="tab in filteredChatTabList"
          :key="tab.id"
          class="tab-info"
          :class="{
            locked: tab.exclusionOwner,
            changeOrder: changeOrderId === tab.id,
            dragMode
          }"
          :style="{
            '--msg-locked': `'${$t('label.editing')}(${getExclusionOwner(
              tab.exclusionOwner
            )})'`
          }"
          @onMouseDown="changeOrderId = tab.id"
          @onMouseUp="changeOrderId = ''"
        >
          <span class="icon-menu drag-mark"></span>
          <span>{{ tab.data.name }}</span>

          <div class="icon-box">
            <s-button
              icon="pencil"
              :disabled="!isEditable(tab)"
              @hover="value => onHover('edit', value)"
              @click="editTab(tab)"
            />
            <s-button
              icon="user-tie"
              :disabled="!isChmodAble(tab)"
              @hover="value => onHover('chmod', value)"
              @click="chmodTab(tab)"
            />
            <s-button
              icon="bin"
              :disabled="!isDeletable(tab)"
              @hover="value => onHover('delete', value)"
              @click="deleteTab(tab)"
            />
          </div>
        </div>
      </draggable>
    </div>

    <div class="button-area">
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
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import draggable from "vuedraggable";
import SButton from "@/app/basic/common/components/SButton.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import SocketFacade, {
  permissionCheck
} from "@/app/core/api/app-server/SocketFacade";
import { ChatTabInfo } from "@/@types/room";
import VueEvent from "@/app/core/decorator/VueEvent";
import { StoreUseData } from "@/@types/store";
import TaskManager from "@/app/core/task/TaskManager";
import WindowVue from "@/app/core/window/WindowVue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { WindowOpenInfo } from "@/@types/window";
import LanguageManager from "@/LanguageManager";
import { DataReference } from "@/@types/data";
import SCheck from "@/app/basic/common/components/SCheck.vue";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import { ModeInfo } from "mode";

@Component({
  components: { SCheck, SButton, CtrlButton, draggable }
})
export default class ChatTabListWindow extends Mixins<WindowVue<void, never>>(
  WindowVue
) {
  private chatTabList = GameObjectManager.instance.chatTabList;
  private filteredChatTabList: StoreUseData<ChatTabInfo>[] = [];
  private chatTabListCC = SocketFacade.instance.chatTabListCC();
  private chatPublicInfo = GameObjectManager.instance.chatPublicInfo;

  private dragMode = false;
  private changeOrderId: string = "";
  private orderChangingIdList: string[] = [];
  private dragModeProcessed: boolean = false;

  private isUseAllTab: boolean = false;

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

  @LifeCycle
  public async mounted() {
    await this.init();
    this.isUseAllTab = this.chatPublicInfo.isUseAllTab;
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
    const msg = ChatTabListWindow.getDialogMessage("delete-tab").replace(
      "$1",
      tabInfo.data!.name
    );
    const result = window.confirm(msg);
    if (!result) return;

    try {
      await this.chatTabListCC.touchModify([tabInfo.id!]);
    } catch (err) {
      // TODO error message.
      return;
    }
    await this.chatTabListCC.delete([tabInfo.id!]);
  }

  @VueEvent
  private async addTab() {
    await TaskManager.instance.ignition<WindowOpenInfo<void>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "chat-tab-add-window"
      }
    });
  }

  @VueEvent
  private getExclusionOwner(exclusionOwner: string) {
    return GameObjectManager.instance.getExclusionOwnerName(exclusionOwner);
  }

  private static getDialogMessage(target: string) {
    const msgTarget = "chat-tab-list-window.dialog." + target;
    return LanguageManager.instance.getText(msgTarget);
  }

  @VueEvent
  private onHover(messageType: string, isHover: boolean) {
    this.windowInfo.message = isHover
      ? LanguageManager.instance.getText(
          `chat-tab-list-window.message-list.${messageType}`
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
    window.console.log("onEndOrderChange");
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
@import "../../../../assets/common";

.container {
  @include flex-box(column, stretch, flex-start);
  width: 100%;
  height: 100%;
}

.tab-container {
  @include flex-box(column, stretch, flex-start);
  flex: 1;
  background-color: white;
  overflow-y: scroll;
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
    border-top: 1px dotted var(--uni-color-gray);
  }

  &.dragMode {
    cursor: grab;

    .drag-mark {
      visibility: visible;
    }
  }
}

.icon-box {
  display: inline-block;
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
}

.check-box {
  @include flex-box(row, flex-start, center);
  position: absolute;
  right: 0.3rem;
  top: 0;
  bottom: 0;
}

.locked {
  @include lock-view();

  &:after {
    left: auto;
    right: 0.2rem;
  }
}

.locked:after {
  content: var(--msg-locked, "ロック中");
}

.drag-mark {
  visibility: hidden;
}

.sort-check {
  position: absolute;
  right: 0;
}
</style>
