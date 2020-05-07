<template>
  <div class="scene-object-container" v-if="selectedLayerId">
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
        :key="sceneObject.id"
        :sceneObject="sceneObject"
        :sceneAndObject="getSceneAndObjectInfo(sceneObject.id)"
        :isSelected="localValue === sceneObject.id"
        :isOrderChanging="changeOrderId === sceneObject.id"
        :dragMode="dragMode"
        @onClick="localValue = sceneObject.id"
        @onMouseHoverAddress="val => $emit('hoverAddress', val)"
        @onMouseHoverOrder="val => $emit('hoverOrder', val)"
        @onMouseDown="
          localValue = sceneObject.id;
          changeOrderId = sceneObject.id;
        "
        @onMouseUp="changeOrderId = ''"
        @onChangeIsOriginalAddress="onChangeIsOriginalAddress"
      />
    </draggable>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import BaseInput from "@/app/core/component/BaseInput.vue";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { StoreUseData } from "@/@types/store";
import { SceneAndObject } from "@/@types/room";
import VueEvent from "@/app/core/decorator/VueEvent";
import { clone } from "@/app/core/utility/PrimaryDataUtility";
import { SceneObject } from "@/@types/gameObject";
import { Address } from "address";
import ComponentVue from "@/app/core/window/ComponentVue";
import draggable from "vuedraggable";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import EditSceneObjectComponent from "@/app/basic/map/EditSceneObjectComponent.vue";
import TaskManager from "@/app/core/task/TaskManager";
import { ModeInfo } from "mode";

@Component({ components: { EditSceneObjectComponent, BaseInput, draggable } })
export default class EditSceneObjectChooserComponent extends Mixins<
  ComponentVue
>(ComponentVue) {
  @Prop({ type: String, required: true })
  private sceneId!: string;

  @Prop({ type: String, required: true })
  private selectedLayerId!: string;

  @Prop({ type: String, default: "" })
  private value!: string; // selectedSceneObjectId

  private changeOrderId: string = "";
  private dragMode: boolean = false;

  private orderChangingIdList: string[] = [];

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

  private sceneObjectInfoList: StoreUseData<SceneObject>[] = [];

  @Watch("sceneObjectList", { immediate: true })
  @Watch("sceneAndObjectList")
  @Watch("selectedLayerId")
  private onChangeSceneObjectInfoList() {
    this.sceneObjectInfoList = this.sceneAndObjectList
      .filter(sao => sao.data!.sceneId === this.sceneId)
      .map(
        sao =>
          this.sceneObjectList.filter(mo => mo.id === sao.data!.objectId)[0]
      )
      .filter(so => so.data!.layerId === this.selectedLayerId);
  }

  @Watch("sceneAndObjectList", { deep: true })
  private async onChangeSceneAndObjectInfoList() {
    if (this.dragMode) {
      const idList = await this.sceneAndObjectList
        .filter(
          sao =>
            this.orderChangingIdList.filter(oId => oId === sao.id).length === -1
        )
        .map(sao => sao.id!);

      try {
        await this.sceneAndObjectCC.touchModify(idList);
        this.orderChangingIdList.push(...idList);
      } catch (err) {
        alert("このタイミングでは例外にならないはず");
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
    this.changeOrderId = "";
  }

  @VueEvent
  private async onSortOrderChange() {
    window.console.log("onEndOrderChange");
    const idList: string[] = this.sceneObjectInfoList.map(sao => sao.id!);
    const idOrderList = idList.map(id => {
      const sao = this.sceneAndObjectList.filter(
        sao => sao.data!.objectId === id
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

    const orderedIdList: string[] = [];
    const dataList: SceneAndObject[] = [];
    const optionList: any[] = [];
    idList.forEach((sceneLayerId, idx) => {
      if (!idOrderList[idx].target) return;
      const id = idOrderList[idx].id;
      const data = this.sceneAndObjectList.filter(sao => sao.id === id)[0]
        .data!;
      orderedIdList.push(id);
      dataList.push(data);
      optionList.push({
        order: idOrderList[idx].order,
        continuous: true
      });
    });
    await this.sceneAndObjectCC.update(orderedIdList, dataList, optionList);
  }

  @Watch("dragMode")
  private async onChangeDragMode() {
    const idList: string[] = this.sceneAndObjectList
      .filter(
        sao =>
          this.sceneObjectInfoList.findIndex(
            so => so.id === sao.data!.objectId
          ) > -1
      )
      .map(sao => sao.id!);
    if (this.dragMode) {
      try {
        await this.sceneAndObjectCC.touchModify(idList);
        this.orderChangingIdList = idList;
      } catch (err) {
        this.dragModeProcessed = true;
        this.dragMode = false;
        this.orderChangingIdList = [];
        alert("Failure to get sceneAndObjectList's lock.\nPlease try again.");
      }
    } else {
      this.orderChangingIdList = [];
      if (!this.dragModeProcessed) {
        await this.sceneAndObjectCC.releaseTouch(idList);
        this.dragModeProcessed = false;
      }
    }
  }

  @LifeCycle
  private async beforeDestroy(): Promise<void> {
    await this.sceneAndObjectCC.releaseTouch(this.orderChangingIdList);
  }

  @VueEvent
  private getSceneAndObjectInfo(
    objectId: string
  ): StoreUseData<SceneAndObject> {
    return this.sceneAndObjectList.filter(
      o => o.data!.objectId === objectId && o.data!.sceneId === this.sceneId
    )[0];
  }

  private get sceneObjectInfo(): StoreUseData<SceneObject> {
    return this.sceneObjectList.filter(o => o.id === this.localValue)[0];
  }

  private get sceneAndObjectInfo(): StoreUseData<SceneAndObject> {
    return this.sceneAndObjectList.filter(
      o =>
        o.data!.objectId === this.localValue && o.data!.sceneId === this.sceneId
    )[0];
  }

  private async updateSceneAndObject(partObj: Partial<SceneAndObject>) {
    const sceneAndObjectData: SceneAndObject = clone(
      this.sceneAndObjectInfo.data
    )!;

    Object.assign(sceneAndObjectData, partObj);

    const targetId = this.sceneAndObjectList.filter(
      sao =>
        sao.data!.sceneId === this.sceneId &&
        sao.data!.objectId === this.localValue
    )[0]!.id!;
    if (!this.dragMode) {
      await this.sceneAndObjectCC.touchModify([targetId]);
      await this.sceneAndObjectCC.update([targetId], [sceneAndObjectData]);
    } else {
      await this.sceneAndObjectCC.update(
        [targetId],
        [sceneAndObjectData],
        [{ continuous: true }]
      );
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
