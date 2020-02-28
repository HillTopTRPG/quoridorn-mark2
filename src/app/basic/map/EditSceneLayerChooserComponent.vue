<template>
  <div class="layer-container">
    <label class="header">
      <span v-t="'label.layer'"></span>
      <span
        class="icon-menu drag-mode-button"
        @click="dragMode = !dragMode"
        @mouseenter="$emit('hoverOrderMode', true, dragMode)"
        @mouseleave="$emit('hoverOrderMode', false, dragMode)"
      ></span>
    </label>
    <draggable
      :options="{
        animation: 10,
        handle: dragMode ? '' : '.anonymous'
      }"
      v-model="layerInfoList"
      @sort="onSortOrderChange()"
      @end="changeOrderId = ''"
    >
      <edit-scene-layer-component
        v-for="layerInfo in layerInfoList"
        :key="layerInfo.id"
        :layerInfo="layerInfo"
        :dragMode="dragMode"
        :isOrderChanging="changeOrderId === layerInfo.id"
        v-model="localValue"
        @onMouseHoverView="value => $emit('hoverView', value)"
        @onMouseHoverOrder="value => $emit('hoverOrder', value)"
        @onChangeLayerUse="changeLayerUse"
        @onMouseDown="
          localValue = layerInfo.id;
          changeOrderId = layerInfo.id;
        "
        @onMouseUp="changeOrderId = ''"
      />
    </draggable>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import { StoreUseData } from "@/@types/store";
import { SceneAndLayer, SceneLayer } from "@/@types/room";
import GameObjectManager from "@/app/basic/GameObjectManager";
import VueEvent from "@/app/core/decorator/VueEvent";
import draggable from "vuedraggable";
import EditSceneLayerComponent from "@/app/basic/map/EditSceneLayerComponent.vue";

@Component({ components: { EditSceneLayerComponent, draggable } })
export default class EditSceneLayerChooserComponent extends Vue {
  @Prop({ type: String, required: true })
  private sceneId!: string;

  @Prop({ type: String, default: "" })
  private value!: string; // selectedLayerId
  private dragMode: boolean = false;
  private dragModeProcessed: boolean = false;
  private orderChangingIdList: string[] = [];
  private changeOrderId: string = "";

  public input(value: string) {
    this.$emit("input", value);
  }

  private get localValue(): string {
    return this.value;
  }

  private set localValue(value: string) {
    this.input(value);
  }

  private get sceneAndLayerInfo(): (id: string) => StoreUseData<SceneAndLayer> {
    return (id: string) =>
      this.sceneAndLayerList.filter(sal => sal.data!.layerId === id)[0];
  }

  private sceneAndLayerInfoList: StoreUseData<SceneAndLayer>[] | null = null;
  private layerInfoList: StoreUseData<SceneLayer>[] | null = null;
  private sceneAndLayerCC = SocketFacade.instance.sceneAndLayerCC();

  private sceneAndLayerList = GameObjectManager.instance.sceneAndLayerList;
  private layerList = GameObjectManager.instance.sceneLayerList;

  @VueEvent
  private async changeLayerUse(mapAndKayerId: string, checked: boolean) {
    const option: any = {};
    if (this.dragMode) {
      option.continuous = true;
    } else {
      await this.sceneAndLayerCC.touchModify(mapAndKayerId);
    }
    let data = this.sceneAndLayerInfoList!.filter(
      ml => ml.id === mapAndKayerId
    )[0].data!;
    data.isUse = checked;
    await this.sceneAndLayerCC.update(mapAndKayerId, data, option);
  }

  @LifeCycle
  private async mounted() {
    this.sceneAndLayerInfoList = this.sceneAndLayerList
      .filter(map => map.data!.sceneId === this.sceneId)
      .sort((m1, m2) => {
        if (m1.order < m2.order) return -1;
        if (m1.order > m2.order) return 1;
        return 0;
      });
    this.layerInfoList = this.sceneAndLayerInfoList
      .map(ml => this.layerList.filter(l => l.id === ml.data!.layerId)[0])
      .filter(l => l);
  }

  @LifeCycle
  private async beforeDestroy(): Promise<void> {
    const releaseTouchModifyFunc = async (id: string): Promise<void> => {
      await this.sceneAndLayerCC.releaseTouch(id);
    };

    // 直列の非同期で全部実行する
    await this.orderChangingIdList
      .map((id: string) => () => releaseTouchModifyFunc(id))
      .reduce((prev, curr) => prev.then(curr), Promise.resolve());
  }

  @Watch("sceneAndLayerList", { deep: true })
  private async onChangeSceneAndLayerInfoList() {
    if (this.dragMode) {
      const touchModifyFunc = async (id: string): Promise<void> => {
        try {
          await this.sceneAndLayerCC.touchModify(id);
          this.orderChangingIdList.push(id);
        } catch (err) {
          alert("このタイミングでは例外にならないはず");
        }
      };

      await this.sceneAndLayerList
        .filter(
          sao =>
            this.orderChangingIdList.filter(oId => oId === sao.id).length === -1
        )
        .map(sao => sao.id!)
        .map((id: string) => () => touchModifyFunc(id))
        .reduce((prev, curr) => prev.then(curr), Promise.resolve());
    }
  }

  @VueEvent
  private onMouseHover(isMouseOn: boolean) {
    this.$emit("hover", isMouseOn);
  }

  @Watch("dragMode")
  private async onChangeDragMode() {
    this.$emit("onChangeDragMode", this.dragMode);

    const releaseTouchModifyFunc = async (id: string): Promise<void> => {
      await this.sceneAndLayerCC.releaseTouch(id);
    };

    const idList: string[] = this.sceneAndLayerList.map(sao => sao.id!);
    if (this.dragMode) {
      let error: boolean = false;
      const touchedList: string[] = [];

      const touchModifyFunc = async (id: string): Promise<void> => {
        if (error) return;
        try {
          await this.sceneAndLayerCC.touchModify(id);
          touchedList.push(id);
        } catch (err) {
          error = true;

          // 直列の非同期で全部実行する
          await touchedList
            .map((id: string) => () => releaseTouchModifyFunc(id))
            .reduce((prev, curr) => prev.then(curr), Promise.resolve());

          alert("Failure to get sceneAndLayerList's lock.\nPlease try again.");
        }
      };

      // 直列の非同期で全部実行する
      await idList
        .map((id: string) => () => touchModifyFunc(id))
        .reduce((prev, curr) => prev.then(curr), Promise.resolve());

      if (error) {
        this.dragModeProcessed = true;
        this.dragMode = false;
        this.orderChangingIdList = [];
      } else {
        this.orderChangingIdList = idList;
      }
    } else {
      this.orderChangingIdList = [];
      if (!this.dragModeProcessed) {
        // 直列の非同期で全部実行する
        await idList
          .map((id: string) => () => releaseTouchModifyFunc(id))
          .reduce((prev, curr) => prev.then(curr), Promise.resolve());

        this.dragModeProcessed = false;
      }
    }
  }

  @VueEvent
  private async onSortOrderChange() {
    window.console.log("onEndOrderChange");
    const idList: string[] = this.layerInfoList!.map(sao => sao.id!);
    const idOrderList = idList.map(id => {
      const sao = this.sceneAndLayerList.filter(
        sao => sao.data!.layerId === id
      )[0];
      return {
        id: sao.id!,
        order: sao.order,
        target: false
      };
    });
    const orderList = idOrderList.concat().map(ido => ido.order);
    orderList.sort((o1, o2) => {
      if (o1 < o2) return -1;
      if (o1 > o2) return 1;
      return 0;
    });
    idOrderList.forEach((ido, idx: number) => {
      if (ido.order !== orderList[idx]) ido.target = true;
      ido.order = orderList[idx];
    });

    const updateOrderFunc = async (idx: number): Promise<void> => {
      if (!idOrderList[idx].target) return;
      const id = idOrderList[idx].id;
      const order = idOrderList[idx].order;
      const data = this.sceneAndLayerList.filter(sao => sao.id === id)[0].data!;
      await this.sceneAndLayerCC.update(id, data, {
        order,
        continuous: true
      });
    };

    // 直列の非同期で全部実行する
    await idList
      .map((id: string, idx: number) => () => updateOrderFunc(idx))
      .reduce((prev, curr) => prev.then(curr), Promise.resolve());
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.header {
  @include inline-flex-box(row, space-between, center);
}

$border-color: green;

.layer-container {
  @include inline-flex-box(column, stretch, flex-start);
  border: 1px solid $border-color;
  margin-right: 1em;
  overflow: visible;

  > label {
    background-color: $border-color;
    color: white;
    height: 2em;
    line-height: 2em;
    padding: 0 0.2rem;
  }
}

.drag-mode-button {
  @include inline-flex-box(row, center, center);
  display: inline-block;
  box-sizing: border-box;
  background-color: white;
  color: black;
  width: 1.5em;
  height: 1.5em;
  padding: 0.2rem;
  border: 1px solid gray;
  border-radius: 50%;
  cursor: pointer;
}
</style>
