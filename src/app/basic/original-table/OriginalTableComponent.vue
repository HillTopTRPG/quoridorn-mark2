<template>
  <div
    class="tab-container"
    :class="{ locked: tab.exclusionOwner }"
    :style="{
      '--msg-locked': `'${$t('label.editing')}(${getExclusionOwner(
        tab.exclusionOwner
      )})'`
    }"
  >
    <div class="info-line">
      <original-table-line-component
        :tab="tab"
        :view-command="false"
        @hover="(type, value) => $emit('hover', type, value)"
      />
    </div>
    <div class="info-line">
      {{ $t("label.dice-roll") }}：{{ tab.data.diceRoll }}
    </div>
    <div class="scroll-area">
      <div class="table-contents">
        <template v-for="(value, key) in tab.data.tableContents">
          <div class="th" :key="key + '-key'">{{ key }}</div>
          <div class="td" :key="key">{{ value.replace(/\\n/g, "\n") }}</div>
        </template>
      </div>
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
import GameObjectManager from "@/app/basic/GameObjectManager";
import VueEvent from "@/app/core/decorator/VueEvent";
import OriginalTableLineComponent from "@/app/basic/original-table/OriginalTableLineComponent.vue";

@Component({ components: { OriginalTableLineComponent, SButton } })
export default class OriginalTableComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private tab!: StoreData<OriginalTableStore>;

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
    const text = this.$t("message.delete-tab")!
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

  @VueEvent
  private getExclusionOwner(exclusionOwner: string) {
    return GameObjectManager.instance.getExclusionOwnerName(exclusionOwner);
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.tab-container {
  @include flex-box(column, stretch, flex-start);
  min-height: 2em;
  height: calc(100% - 10em);
  border-bottom: 1px dotted var(--uni-color-gray);
  box-sizing: border-box;
}

.info-line {
  @include flex-box(row, space-between, center);
  position: relative;
  background-color: var(--uni-color-cream);
  height: calc(2em + 2px);
  min-height: calc(2em + 2px);
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

.scroll-area {
  //@include flex-box(row, flex-start, center);
  overflow-y: scroll;
}

.table-contents {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-auto-rows: max-content;

  .th,
  .td {
    @include flex-box(row, space-between, flex-start, wrap);
    white-space: pre-wrap;
    min-height: 2em;
    border-top: 1px dashed gray;
  }

  .th {
    vertical-align: top;
    font-weight: bold;
    padding-left: 0.3rem;

    &:after {
      content: "：";
    }
  }
}

.locked:after {
  content: var(--msg-locked, "ロック中");
}
</style>
