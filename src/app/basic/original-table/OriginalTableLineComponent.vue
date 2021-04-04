<template>
  <div class="original-table-line-component">
    <div v-if="viewCommand">{{ tab.data.commandName }}</div>
    <div class="title">
      <div>{{ tab.data.tableTitle }}</div>
    </div>

    <div class="icon-box">
      <s-button
        icon="pencil"
        :disabled="!isEditable(tab)"
        @hover="value => $emit('hover', 'edit', value)"
        @click="editOriginalTable(tab)"
      />
      <s-button
        icon="user-tie"
        :disabled="!isChmodAble(tab)"
        @hover="value => $emit('hover', 'chmod', value)"
        @click="chmodOriginalTable(tab)"
      />
      <s-button
        icon="bin"
        :disabled="!isDeletable(tab)"
        @hover="value => $emit('hover', 'delete', value)"
        @click="deleteOriginalTable(tab)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import SButton from "@/app/basic/common/components/SButton.vue";
import { WindowOpenInfo } from "@/@types/window";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";
import { questionDialog } from "@/app/core/utility/Utility";
import { OriginalTableStore } from "@/@types/room";
import SocketFacade, {
  permissionCheck
} from "@/app/core/api/app-server/SocketFacade";
import TaskManager from "@/app/core/task/TaskManager";
import VueEvent from "@/app/core/decorator/VueEvent";

@Component({ components: { SButton } })
export default class OriginalTableLineComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private tab!: StoreData<OriginalTableStore>;

  @Prop({ type: Boolean, required: true })
  private viewCommand!: boolean;

  private originalTableListCC = SocketFacade.instance.originalTableListCC();

  @VueEvent
  private isEditable(tabInfo: StoreData<OriginalTableStore>) {
    return permissionCheck(tabInfo, "edit");
  }

  @VueEvent
  private async editOriginalTable(tabInfo: StoreData<OriginalTableStore>) {
    if (!this.isEditable(tabInfo)) return;

    await TaskManager.instance.ignition<WindowOpenInfo<DataReference>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "original-table-edit-window",
        args: {
          type: tabInfo.collection,
          key: tabInfo.key
        }
      }
    });
  }

  @VueEvent
  private isChmodAble(tabInfo: StoreData<OriginalTableStore>) {
    return permissionCheck(tabInfo, "chmod");
  }

  @VueEvent
  private async chmodOriginalTable(tabInfo: StoreData<OriginalTableStore>) {
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
  private isDeletable(tabInfo: StoreData<OriginalTableStore>) {
    return permissionCheck(tabInfo, "edit");
  }

  @VueEvent
  private async deleteOriginalTable(tabInfo: StoreData<OriginalTableStore>) {
    if (!this.isDeletable(tabInfo)) return;
    const text = this.$t("original-table-list-window.dialog.delete-table")!
      .toString()
      .replace("$1", tabInfo.data!.tableTitle);
    const result = await questionDialog({
      title: this.$t("button.delete").toString(),
      text,
      confirmButtonText: this.$t("button.delete").toString(),
      cancelButtonText: this.$t("button.reject").toString()
    });
    if (!result) return;

    try {
      await this.originalTableListCC.deletePackage([tabInfo.key]);
    } catch (err) {
      // TODO error message.
      return;
    }
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.original-table-line-component {
  display: contents;

  > * {
    @include flex-box(row, center, center);
    border-bottom: dashed 1px gray;
  }

  .title {
    height: 100%;
    flex: 1;
    box-sizing: border-box;

    div {
      @include flex-box(row, flex-start, center);
      justify-self: stretch;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      width: 100%;
      height: 100%;
    }
  }
}
</style>
