<template>
  <div
    class="like-info"
    :class="{
      locked: like.exclusionOwner,
      changeOrder: changeOrderId === like.id,
      dragMode
    }"
    :style="{
      '--msg-locked': `'${$t('label.editing')}(${getExclusionOwner(
        like.exclusionOwner
      )})'`
    }"
    @onMouseDown="changeOrderId = like.id"
    @onMouseUp="changeOrderId = ''"
  >
    <span class="icon-menu drag-mark"></span>
    <span>{{ like.data.char }}</span>

    <div class="icon-box">
      <s-button
        icon="pencil"
        @hover="value => $emit('hover', 'edit', value)"
        @click="editTab(like)"
      />
      <s-button
        icon="bin"
        @hover="value => $emit('hover', 'delete', value)"
        @click="deleteTab(like)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import SButton from "@/app/basic/common/components/SButton.vue";
import { StoreUseData } from "@/@types/store";
import SocketFacade from "../../../core/api/app-server/SocketFacade";
import TaskManager from "../../../core/task/TaskManager";
import GameObjectManager from "../../GameObjectManager";
import { WindowOpenInfo } from "@/@types/window";
import VueEvent from "../../../core/decorator/VueEvent";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";
import { LikeStore } from "@/@types/gameObject";

@Component({ components: { SButton } })
export default class LikeComponent extends Mixins<ComponentVue>(ComponentVue) {
  @Prop({ type: Object, required: true })
  private like!: StoreUseData<LikeStore>;

  @Prop({ type: Boolean, required: true })
  private dragMode = false;

  @Prop({ type: String, required: true })
  private changeOrderId: string = "";

  private likeListCC = SocketFacade.instance.likeListCC();

  @VueEvent
  private async editTab(tabInfo: StoreUseData<LikeStore>) {
    await TaskManager.instance.ignition<WindowOpenInfo<string>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "like-edit-window",
        args: tabInfo.id!
      }
    });
  }

  @VueEvent
  private async deleteTab(tabInfo: StoreUseData<LikeStore>) {
    const msg = this.$t("message.delete-tab")!
      .toString()
      .replace("$1", tabInfo.data!.char);
    const result = window.confirm(msg);
    if (!result) return;

    try {
      await this.likeListCC.deletePackage([tabInfo.id!]);
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

.like-info {
  @include flex-box(row, flex-start, center);
  position: relative;
  height: 2em;
  min-height: 2em;
  padding: 0 0.3rem;
  border-bottom: 1px dotted var(--uni-color-gray);
  box-sizing: border-box;

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
