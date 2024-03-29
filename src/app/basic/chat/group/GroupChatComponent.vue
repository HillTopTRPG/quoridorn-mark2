<template>
  <div
    class="tab-info"
    :class="{
      locked: tab.exclusionOwner,
      changeOrder: changeOrderKey === tab.key,
      dragMode
    }"
    :style="{
      '--msg-locked': `'${$t('label.editing')}(${getExclusionOwner(
        tab.exclusionOwner
      )})'`
    }"
    @onMouseDown="changeOrderKey = tab.key"
    @onMouseUp="changeOrderKey = ''"
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
import SocketFacade, {
  permissionCheck
} from "../../../core/api/app-server/SocketFacade";
import TaskManager from "../../../core/task/TaskManager";
import GameObjectManager from "../../GameObjectManager";
import { WindowOpenInfo } from "@/@types/window";
import LanguageManager from "../../../../LanguageManager";
import { ChatTabStore, GroupChatTabStore } from "@/@types/store-data";
import VueEvent from "../../../core/decorator/VueEvent";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";
import { questionDialog } from "@/app/core/utility/Utility";

@Component({ components: { SButton } })
export default class GroupChatComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private tab!: StoreData<GroupChatTabStore>;

  @Prop({ type: Boolean, required: true })
  private dragMode = false;

  @Prop({ type: String, required: true })
  private changeOrderKey: string = "";

  private groupChatTabListCC = SocketFacade.instance.groupChatTabListCC();

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
  private getExclusionOwner(exclusionOwner: string) {
    return GameObjectManager.instance.getExclusionOwnerName(exclusionOwner);
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
