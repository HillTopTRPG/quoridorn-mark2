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
      @start="onSortStart()"
      @end="onSortEnd()"
      @sort="onSortOrderChange()"
    >
      <edit-scene-layer-component
        v-for="layerInfo in layerInfoList"
        :key="layerInfo.key"
        :layerInfo="layerInfo"
        :dragMode="dragMode"
        :isOrderChanging="changeOrderKey === layerInfo.key"
        v-model="localValue"
        @onMouseHoverView="value => $emit('hoverView', value)"
        @onMouseHoverOrder="value => $emit('hoverOrder', value)"
        @onChangeLayerUse="changeLayerUse"
        @onMouseDown="
          localValue = layerInfo.key;
          changeOrderKey = layerInfo.key;
        "
        @onMouseUp="changeOrderKey = ''"
      />
    </draggable>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import draggable from "vuedraggable";
import { ModeInfo } from "mode";
import LifeCycle from "../../core/decorator/LifeCycle";
import EditSceneLayerComponent from "./EditSceneLayerComponent.vue";
import TaskManager from "../../core/task/TaskManager";
import { SceneAndLayerStore, SceneLayerStore } from "@/@types/store-data";
import GameObjectManager from "../GameObjectManager";
import SocketFacade from "../../core/api/app-server/SocketFacade";
import VueEvent from "../../core/decorator/VueEvent";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";
import { findRequireByKey } from "@/app/core/utility/Utility";

@Component({ components: { EditSceneLayerComponent, draggable } })
export default class EditSceneLayerChooserComponent extends Mixins<
  ComponentVue
>(ComponentVue) {
  @Prop({ type: String, required: true })
  private sceneKey!: string;

  @Prop({ type: String, default: "" })
  private value!: string; // selectedLayerKey
  private dragMode: boolean = false;
  private dragModeProcessed: boolean = false;
  private orderChangingKeyList: string[] = [];
  private changeOrderKey: string = "";

  public input(value: string) {
    this.$emit("input", value);
  }

  private get localValue(): string {
    return this.value;
  }

  private set localValue(value: string) {
    this.input(value);
  }

  @VueEvent
  private get sceneAndLayerInfo(): (
    key: string
  ) => StoreData<SceneAndLayerStore> {
    return (key: string) =>
      this.sceneAndLayerList.find(sal => sal.data!.layerKey === key)!;
  }

  private sceneAndLayerInfoList: StoreData<SceneAndLayerStore>[] | null = null;
  private layerInfoList: StoreData<SceneLayerStore>[] | null = null;
  private sceneAndLayerCC = SocketFacade.instance.sceneAndLayerCC();

  private sceneAndLayerList = GameObjectManager.instance.sceneAndLayerList;
  private layerList = GameObjectManager.instance.sceneLayerList;

  @VueEvent
  private async changeLayerUse(mapAndKayerKey: string, checked: boolean) {
    if (!this.dragMode) {
      await this.sceneAndLayerCC.touchModify([mapAndKayerKey]);
    }
    const data = findRequireByKey(this.sceneAndLayerInfoList!, mapAndKayerKey)
      .data!;
    data.isUse = checked;
    const option: Partial<StoreData<SceneAndLayerStore>> & {
      key: string;
      continuous?: boolean;
    } = {
      key: mapAndKayerKey
    };
    if (this.dragMode) option.continuous = true;
    await this.sceneAndLayerCC.update([
      {
        ...option,
        data
      }
    ]);
  }

  @LifeCycle
  private async mounted() {
    this.sceneAndLayerInfoList = this.sceneAndLayerList
      .filter(map => map.data!.sceneKey === this.sceneKey)
      .sort((m1, m2) => {
        if (m1.order < m2.order) return -1;
        if (m1.order > m2.order) return 1;
        return 0;
      });
    this.layerInfoList = this.sceneAndLayerInfoList
      .map(ml => this.layerList.find(l => l.key === ml.data!.layerKey))
      .filter(l => l) as StoreData<SceneLayerStore>[];
  }

  @LifeCycle
  private async beforeDestroy(): Promise<void> {
    await this.sceneAndLayerCC.releaseTouch(this.orderChangingKeyList);
  }

  @Watch("sceneAndLayerList", { deep: true })
  private async onChangeSceneAndLayerStoreInfoList() {
    if (this.dragMode) {
      const keyList = this.sceneAndLayerList
        .filter(
          sao =>
            this.orderChangingKeyList.filter(oKey => oKey === sao.key)
              .length === -1
        )
        .map(sao => sao.key);

      try {
        await this.sceneAndLayerCC.touchModify(keyList);
        this.orderChangingKeyList.push(...keyList);
      } catch (err) {
        alert("このタイミングでは例外にならないはず");
      }
    }
  }

  @VueEvent
  private onMouseHover(isMouseOn: boolean) {
    this.$emit("hover", isMouseOn);
  }

  @Watch("dragMode")
  private async onChangeDragMode() {
    this.$emit("onChangeDragMode", this.dragMode);

    const keyList: string[] = this.sceneAndLayerList.map(sao => sao.key);
    if (this.dragMode) {
      try {
        await this.sceneAndLayerCC.touchModify(keyList);
        this.orderChangingKeyList = keyList;
      } catch (err) {
        alert("Failure to get sceneAndLayerList's lock.\nPlease try again.");
        this.dragModeProcessed = true;
        this.dragMode = false;
        this.orderChangingKeyList = [];
      }
    } else {
      this.orderChangingKeyList = [];
      if (!this.dragModeProcessed) {
        try {
          await this.sceneAndLayerCC.releaseTouch(keyList);
          this.dragModeProcessed = false;
        } catch (err) {
          // Nothing.
        }
      }
    }
  }

  @VueEvent
  private async onSortStart() {
    await TaskManager.instance.ignition<ModeInfo, never>({
      type: "mode-change",
      owner: "Quoridorn",
      value: { type: "special-drag", value: "on" as "on" }
    });
  }

  @VueEvent
  private async onSortEnd() {
    await TaskManager.instance.ignition<ModeInfo, never>({
      type: "mode-change",
      owner: "Quoridorn",
      value: { type: "special-drag", value: "off" as "off" }
    });
    this.changeOrderKey = "";
  }

  @VueEvent
  private async onSortOrderChange() {
    console.log("onEndOrderChange");
    const keyList: string[] = this.layerInfoList!.map(sao => sao.key);
    const keyOrderList = keyList.map(key => {
      const sao = this.sceneAndLayerList.filter(
        sao => sao.data!.layerKey === key
      )[0];
      return {
        key: sao.key,
        order: sao.order,
        target: false
      };
    });
    const orderList = keyOrderList.concat().map(keyo => keyo.order);
    orderList.sort((o1, o2) => {
      if (o1 < o2) return -1;
      if (o1 > o2) return 1;
      return 0;
    });
    keyOrderList.forEach((keyo, index: number) => {
      if (keyo.order !== orderList[index]) keyo.target = true;
      keyo.order = orderList[index];
    });

    const list: (Partial<StoreData<SceneAndLayerStore>> & {
      key: string;
      continuous?: boolean;
    })[] = [];

    keyList.forEach((layerKey, index) => {
      if (!keyOrderList[index].target) return;
      const key = keyOrderList[index].key;
      list.push({
        key,
        order: keyOrderList[index].order,
        data: findRequireByKey(this.sceneAndLayerList, key).data!,
        continuous: true
      });
    });
    await this.sceneAndLayerCC.update(list);
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
