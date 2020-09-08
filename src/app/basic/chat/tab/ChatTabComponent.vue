<template>
  <div
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
        @hover="value => $emit('hover', 'edit', value)"
        @click="editTab(tab)"
      />
      <s-button
        icon="user-tie"
        :disabled="!isChmodAble(tab)"
        @hover="value => $emit('hover', 'chmod', value)"
        @click="chmodTab(tab)"
      />
      <s-button
        icon="bin"
        :disabled="!isDeletable(tab)"
        @hover="value => $emit('hover', 'delete', value)"
        @click="deleteTab(tab)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import SButton from "@/app/basic/common/components/SButton.vue";
import { StoreUseData } from "@/@types/store";
import SocketFacade, {
  permissionCheck
} from "../../../core/api/app-server/SocketFacade";
import TaskManager from "../../../core/task/TaskManager";
import GameObjectManager from "../../GameObjectManager";
import { WindowOpenInfo } from "@/@types/window";
import LanguageManager from "../../../../LanguageManager";
import { ChatTabInfo } from "@/@types/room";
import { DataReference } from "@/@types/data";
import VueEvent from "../../../core/decorator/VueEvent";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";

@Component({
  components: { SButton }
})
export default class ChatTabComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private tab!: StoreUseData<ChatTabInfo>;

  @Prop({ type: Boolean, required: true })
  private dragMode = false;

  @Prop({ type: String, required: true })
  private changeOrderId: string = "";

  private chatTabListCC = SocketFacade.instance.chatTabListCC();

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
    const msg = ChatTabComponent.getDialogMessage("delete-tab").replace(
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
  private getExclusionOwner(exclusionOwner: string) {
    return GameObjectManager.instance.getExclusionOwnerName(exclusionOwner);
  }

  private static getDialogMessage(target: string) {
    const msgTarget = "chat-setting-window.dialog." + target;
    return LanguageManager.instance.getText(msgTarget);
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

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
</style>
