<template>
  <div class="container" ref="window-container">
    <room-data-info-form
      v-if="roomData"
      :window-info="windowInfo"
      :room-data.sync="roomData"
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
import LifeCycle from "@/app/core/decorator/LifeCycle";
import WindowVue from "@/app/core/window/WindowVue";
import VueEvent from "@/app/core/decorator/VueEvent";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import { clone } from "@/app/core/utility/PrimaryDataUtility";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { RoomDataStore } from "@/@types/store-data";
import RoomDataInfoForm from "@/app/basic/login/RoomDataInfoForm.vue";

@Component({ components: { RoomDataInfoForm, ButtonArea } })
export default class RoomDataEditWindow extends WindowVue<
  RoomDataStore,
  RoomDataStore
> {
  private roomData: RoomDataStore | null = null;

  @LifeCycle
  public async mounted() {
    await this.init();
    this.roomData = clone(this.windowInfo.args!)!;
  }

  @VueEvent
  private async commit() {
    await this.finally(this.roomData || undefined);
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
