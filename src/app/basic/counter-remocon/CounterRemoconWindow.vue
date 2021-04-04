<template>
  <div class="container" ref="window-container">
    <div class="button-container">
      <counter-remocon-button-component
        class="card-deck-set"
        v-for="counterRemocon in useCounterRemoconList"
        :counter-remocon="counterRemocon"
        :key="counterRemocon.key"
        @changeMessage="changeMessage"
        @execute="onChangeResourceValue"
      />
    </div>
    <div class="button-area">
      <ctrl-button @click="addCounterRemocon()">
        <span v-t="'button.add'"></span>
      </ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { findRequireByKey } from "@/app/core/utility/Utility";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import WindowVue from "@/app/core/window/WindowVue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import VueEvent from "@/app/core/decorator/VueEvent";
import CounterRemoconButtonComponent from "@/app/basic/counter-remocon/CounterRemoconButtonComponent.vue";
import { CounterRemoconStore } from "@/@types/store-data";
import App from "@/views/App.vue";
import { permissionCheck } from "@/app/core/api/app-server/SocketFacade";

@Component({ components: { CounterRemoconButtonComponent, CtrlButton } })
export default class CounterRemoconWindow extends Mixins<WindowVue<void, void>>(
  WindowVue
) {
  private counterRemoconList = GameObjectManager.instance.counterRemoconList;
  private useCounterRemoconList: StoreUseData<CounterRemoconStore>[] = [];
  private isMounted: boolean = false;

  @Watch("counterRemoconList", { immediate: true, deep: true })
  private onChangeCounterRemoconList() {
    this.useCounterRemoconList = this.counterRemoconList.filter(c =>
      permissionCheck(c, "view")
    );
  }

  @LifeCycle
  private async mounted() {
    await this.init();
    this.isMounted = true;
  }

  @VueEvent
  private changeMessage(message: string) {
    this.windowInfo.message = message;
  }

  @VueEvent
  private async onChangeResourceValue(
    counterRemocon: StoreData<CounterRemoconStore>,
    resourceMasterKey: string,
    value: number
  ) {
    const resourceMaster = findRequireByKey(
      GameObjectManager.instance.resourceMasterList,
      resourceMasterKey
    );
    console.log(
      [
        `update: ${counterRemocon.data!.name}`,
        `resource: ${resourceMaster.data!.name}`,
        `value: ${value}`
      ].join(", ")
    );
  }

  @VueEvent
  private async addCounterRemocon() {
    await App.openSimpleWindow("counter-remocon-add-window");
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.container {
  @include flex-box(column, stretch, center);
  width: 100%;
  height: 100%;
}

.button-container {
  @include flex-box(row, flex-start, flex-start, wrap);
  flex: 1;
  height: 100%;
  overflow-y: scroll;
}

.lock-info {
  @include lock-view();
}

.lock-info:after {
  content: var(--msg-locked, "ロック中");
}
</style>
