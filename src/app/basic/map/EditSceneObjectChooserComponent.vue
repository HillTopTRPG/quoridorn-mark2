<template>
  <div class="scene-object-container" v-if="selectedLayerKey">
    <label class="header">
      <span v-t="'label.map-object'"></span>
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
      v-model="sceneObjectInfoList"
      @start="onSortStart()"
      @end="onSortEnd()"
      @sort="onSortOrderChange()"
    >
      <edit-scene-object-component
        v-for="sceneObject in sceneObjectInfoList"
        :key="sceneObject.key"
        :sceneObject="sceneObject"
        :sceneAndObject="getSceneAndObjectInfo(sceneObject.key)"
        :isSelected="localValue === sceneObject.key"
        :isOrderChanging="changeOrderKey === sceneObject.key"
        :dragMode="dragMode"
        @onClick="localValue = sceneObject.key"
        @onMouseHoverAddress="val => $emit('hoverAddress', val)"
        @onMouseHoverOrder="val => $emit('hoverOrder', val)"
        @onMouseDown="
          localValue = sceneObject.key;
          changeOrderKey = sceneObject.key;
        "
        @onMouseUp="changeOrderKey = ''"
        @onChangeIsOriginalAddress="onChangeIsOriginalAddress"
      />
    </draggable>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import draggable from "vuedraggable";
import { ModeInfo } from "mode";
import { SceneObjectStore, SceneAndObjectStore } from "@/@types/store-data";
import { Address } from "@/@types/store-data-optional";
import { errorDialog } from "@/app/core/utility/Utility";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import ComponentVue from "@/app/core/window/ComponentVue";
import TaskManager from "@/app/core/task/TaskManager";
import GameObjectManager from "@/app/basic/GameObjectManager";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import { clone } from "@/app/core/utility/PrimaryDataUtility";
import EditSceneObjectComponent from "@/app/basic/map/EditSceneObjectComponent.vue";
import BaseInput from "@/app/core/component/BaseInput.vue";
import VueEvent from "@/app/core/decorator/VueEvent";

@Component({ components: { EditSceneObjectComponent, BaseInput, draggable } })
export default class EditSceneObjectChooserComponent extends Mixins<
  ComponentVue
>(ComponentVue) {
  @Prop({ type: String, required: true })
  private sceneKey!: string;

  @Prop({ type: String, required: true })
  private selectedLayerKey!: string;

  @Prop({ type: String, default: "" })
  private value!: string; // selectedSceneObjectKey

  private changeOrderKey: string = "";
  private dragMode: boolean = false;

  private orderChangingKeyList: string[] = [];

  private dragModeProcessed: boolean = false;

  public input(value: string) {
    this.$emit("input", value);
  }

  private get localValue(): string {
    return this.value;
  }

  private set localValue(value: string) {
    this.input(value);
  }

  private sceneAndObjectCC = SocketFacade.instance.sceneAndObjectCC();

  private sceneObjectList = GameObjectManager.instance.sceneObjectList;
  private sceneAndObjectList = GameObjectManager.instance.sceneAndObjectList;

  private sceneObjectInfoList: StoreUseData<SceneObjectStore>[] = [];

  @Watch("sceneObjectList", { immediate: true })
  @Watch("sceneAndObjectList")
  @Watch("selectedLayerKey")
  private onChangeSceneObjectInfoList() {
    this.sceneObjectInfoList = this.sceneAndObjectList
      .filter(sao => sao.data!.sceneKey === this.sceneKey)
      .map(
        sao =>
          this.sceneObjectList.filter(mo => mo.key === sao.data!.objectKey)[0]
      )
      .filter(so => so.data!.layerKey === this.selectedLayerKey);
  }

  @Watch("sceneAndObjectList", { deep: true })
  private async onChangeSceneAndObjectInfoList() {
    if (this.dragMode) {
      const keyList = await this.sceneAndObjectList
        .filter(
          sao =>
            this.orderChangingKeyList.filter(oKey => oKey === sao.key)
              .length === -1
        )
        .map(sao => sao.key);

      try {
        await this.sceneAndObjectCC.touchModify(keyList);
        this.orderChangingKeyList.push(...keyList);
      } catch (err) {
        await errorDialog({
          title: this.$t("message.error").toString(),
          text: "このタイミングでは例外にならないはず"
        });
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
    const keyList: string[] = this.sceneObjectInfoList.map(sao => sao.key);
    const keyOrderList = keyList.map(key => {
      const sao = this.sceneAndObjectList.filter(
        sao => sao.data!.objectKey === key
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

    const list: (Partial<StoreUseData<SceneAndObjectStore>> & {
      key: string;
      continuous?: boolean;
    })[] = [];
    keyList.forEach((sceneLayerKey, index) => {
      if (!keyOrderList[index].target) return;
      const key = keyOrderList[index].key;
      const data = this.sceneAndObjectList.filter(sao => sao.key === key)[0]
        .data!;
      list.push({
        key,
        order: keyOrderList[index].order,
        data,
        continuous: true
      });
    });
    await this.sceneAndObjectCC.update(list);
  }

  @Watch("dragMode")
  private async onChangeDragMode() {
    const keyList: string[] = this.sceneAndObjectList
      .filter(
        sao =>
          this.sceneObjectInfoList.findIndex(
            so => so.key === sao.data!.objectKey
          ) > -1
      )
      .map(sao => sao.key);
    if (this.dragMode) {
      try {
        await this.sceneAndObjectCC.touchModify(keyList);
        this.orderChangingKeyList = keyList;
      } catch (err) {
        this.dragModeProcessed = true;
        this.dragMode = false;
        this.orderChangingKeyList = [];
        await errorDialog({
          title: this.$t("message.error").toString(),
          text: "Failure to get sceneAndObjectList's lock.\nPlease try again."
        });
      }
    } else {
      this.orderChangingKeyList = [];
      if (!this.dragModeProcessed) {
        await this.sceneAndObjectCC.releaseTouch(keyList);
        this.dragModeProcessed = false;
      }
    }
  }

  @LifeCycle
  private async beforeDestroy(): Promise<void> {
    await this.sceneAndObjectCC.releaseTouch(this.orderChangingKeyList);
  }

  @VueEvent
  private getSceneAndObjectInfo(
    objectKey: string
  ): StoreUseData<SceneAndObjectStore> {
    return this.sceneAndObjectList.filter(
      o => o.data!.objectKey === objectKey && o.data!.sceneKey === this.sceneKey
    )[0];
  }

  private get sceneObjectInfo(): StoreUseData<SceneObjectStore> {
    return this.sceneObjectList.filter(o => o.key === this.localValue)[0];
  }

  private get sceneAndObjectInfo(): StoreUseData<SceneAndObjectStore> {
    return this.sceneAndObjectList.filter(
      o =>
        o.data!.objectKey === this.localValue &&
        o.data!.sceneKey === this.sceneKey
    )[0];
  }

  private async updateSceneAndObject(partObj: Partial<SceneAndObjectStore>) {
    const sceneAndObjectData: SceneAndObjectStore = clone(
      this.sceneAndObjectInfo.data
    )!;

    Object.assign(sceneAndObjectData, partObj);

    const targetKey = this.sceneAndObjectList.filter(
      sao =>
        sao.data!.sceneKey === this.sceneKey &&
        sao.data!.objectKey === this.localValue
    )[0]!.key;
    if (!this.dragMode) {
      await this.sceneAndObjectCC.touchModify([targetKey]);
      await this.sceneAndObjectCC.update([
        {
          key: targetKey,
          data: sceneAndObjectData
        }
      ]);
    } else {
      await this.sceneAndObjectCC.update([
        {
          key: targetKey,
          data: sceneAndObjectData,
          continuous: true
        }
      ]);
    }
  }

  @VueEvent
  private async onChangeIsOriginalAddress(isOriginalAddress: boolean) {
    setTimeout(async () => {
      const so = this.sceneObjectInfo.data!;
      const originalAddress: Address | null = isOriginalAddress
        ? {
            x: so.x,
            y: so.y,
            row: so.row,
            column: so.column
          }
        : null;
      await this.updateSceneAndObject({ isOriginalAddress, originalAddress });
    });
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.header {
  @include inline-flex-box(row, space-between, center);
}

$border-color: green;

.scene-object-container {
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
