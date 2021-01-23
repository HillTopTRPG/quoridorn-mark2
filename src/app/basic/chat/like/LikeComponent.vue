<template>
  <div
    class="like-info"
    :class="{
      locked: like.exclusionOwner,
      changeOrder: changeOrderKey === like.key,
      dragMode
    }"
    :style="{
      '--msg-locked': `'${$t('label.editing')}(${getExclusionOwner(
        like.exclusionOwner
      )})'`
    }"
    @onMouseDown="changeOrderKey = like.key"
    @onMouseUp="changeOrderKey = ''"
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
import { WindowOpenInfo } from "@/@types/window";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";
import { LikeStore } from "@/@types/store-data";
import { questionDialog } from "@/app/core/utility/Utility";
import TaskManager from "@/app/core/task/TaskManager";
import GameObjectManager from "@/app/basic/GameObjectManager";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import VueEvent from "@/app/core/decorator/VueEvent";

@Component({ components: { SButton } })
export default class LikeComponent extends Mixins<ComponentVue>(ComponentVue) {
  @Prop({ type: Object, required: true })
  private like!: StoreData<LikeStore>;

  @Prop({ type: Boolean, required: true })
  private dragMode = false;

  @Prop({ type: String, required: true })
  private changeOrderKey: string = "";

  private likeListCC = SocketFacade.instance.likeListCC();

  @VueEvent
  private async editTab(tabInfo: StoreData<LikeStore>) {
    await TaskManager.instance.ignition<WindowOpenInfo<DataReference>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "like-edit-window",
        args: {
          type: "like-list",
          key: tabInfo.key
        }
      }
    });
  }

  @VueEvent
  private async deleteTab(tabInfo: StoreData<LikeStore>) {
    const text = this.$t("message.delete-tab")!
      .toString()
      .replace("$1", tabInfo.data!.char);
    const result = questionDialog({
      title: this.$t("button.delete").toString(),
      text,
      confirmButtonText: this.$t("button.delete").toString(),
      cancelButtonText: this.$t("button.reject").toString()
    });
    if (!result) return;

    try {
      await this.likeListCC.deletePackage([tabInfo.key]);
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
