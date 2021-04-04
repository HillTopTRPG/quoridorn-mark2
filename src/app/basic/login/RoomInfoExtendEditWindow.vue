<template>
  <div class="container" ref="window-container">
    <room-info-extend-info-form
      v-if="roomInfoExtend"
      :window-key="windowKey"
      :room-info-extend.sync="roomInfoExtend"
    />

    <button-area
      :is-commit-able="isGm"
      commit-text="modify"
      @commit="commit()"
      @rollback="rollback()"
      :use-preview="false"
    />
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import { RoomInfoExtend } from "@/@types/store-data-optional";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import WindowVue from "@/app/core/window/WindowVue";
import VueEvent from "@/app/core/decorator/VueEvent";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import RoomInfoExtendInfoForm from "@/app/basic/login/RoomInfoExtendInfoForm.vue";
import { clone } from "@/app/core/utility/PrimaryDataUtility";
import GameObjectManager from "@/app/basic/GameObjectManager";

@Component({ components: { RoomInfoExtendInfoForm, ButtonArea } })
export default class RoomInfoExtendEditWindow extends WindowVue<
  RoomInfoExtend,
  RoomInfoExtend
> {
  private roomInfoExtend: RoomInfoExtend | null = null;

  @LifeCycle
  public async mounted() {
    await this.init();
    this.roomInfoExtend = clone(this.windowInfo.args!)!;
  }

  @VueEvent
  private async commit() {
    await this.finally(this.roomInfoExtend || undefined);
  }

  @VueEvent
  private async rollback() {
    await this.finally();
  }

  private get isGm() {
    return GameObjectManager.instance.isGm;
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.container {
  @include flex-box(column, flex-start, flex-start);
  width: 100%;
  height: 100%;
}

.button-area {
  @include flex-box(row, center, flex-start);
  width: 100%;
}
</style>
