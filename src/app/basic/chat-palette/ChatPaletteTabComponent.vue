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
    <span>{{ tab.data.name || $t("label.non-tab") }}</span>

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
import { Component, Prop, Vue } from "vue-property-decorator";
import SButton from "@/app/basic/common/components/SButton.vue";
import { StoreUseData } from "@/@types/store";
import { permissionCheck } from "@/app/core/api/app-server/SocketFacade";
import { ChatPaletteStore } from "@/@types/gameObject";
import GameObjectManager from "@/app/basic/GameObjectManager";
import VueEvent from "@/app/core/decorator/VueEvent";

@Component({ components: { SButton } })
export default class ChatPaletteTabComponent extends Vue {
  @Prop({ type: Object, required: true })
  private tab!: StoreUseData<ChatPaletteStore>;

  @Prop({ type: Boolean, required: true })
  private dragMode = false;

  @Prop({ type: String, required: true })
  private changeOrderId: string = "";

  @VueEvent
  private isEditable(tabInfo: StoreUseData<ChatPaletteStore>) {
    return permissionCheck(tabInfo, "edit");
  }

  @VueEvent
  private async editTab(tabInfo: StoreUseData<ChatPaletteStore>) {
    if (!this.isEditable(tabInfo)) return;
    this.$emit("edit", tabInfo);
  }

  @VueEvent
  private isChmodAble(tabInfo: StoreUseData<ChatPaletteStore>) {
    return permissionCheck(tabInfo, "chmod");
  }

  @VueEvent
  private async chmodTab(tabInfo: StoreUseData<ChatPaletteStore>) {
    if (!this.isChmodAble(tabInfo)) return;
    this.$emit("chmod", tabInfo);
  }

  @VueEvent
  private isDeletable(tabInfo: StoreUseData<ChatPaletteStore>) {
    return permissionCheck(tabInfo, "edit");
  }

  @VueEvent
  private async deleteTab(tabInfo: StoreUseData<ChatPaletteStore>) {
    if (!this.isDeletable(tabInfo)) return;
    this.$emit("delete", tabInfo);
  }

  @VueEvent
  private getExclusionOwner(exclusionOwner: string) {
    return GameObjectManager.instance.getExclusionOwnerName(exclusionOwner);
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

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
