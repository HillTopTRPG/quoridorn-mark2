<template>
  <div class="address-input" ref="component">
    <table v-if="localValue">
      <tr>
        <tr-number-input-component
          propName="columns"
          :disabled="!roomData.isFitGrid"
          v-model="localValue.column"
          :widthEm="5"
          @input="onInputValue()"
        />
        <tr-number-input-component
          propName="rows"
          :disabled="!roomData.isFitGrid"
          v-model="localValue.row"
          :widthEm="5"
          @input="onInputValue()"
        />
      </tr>
      <tr>
        <tr-number-input-component
          propName="x"
          :disabled="roomData.isFitGrid"
          v-model="localValue.x"
          :widthEm="5"
          @input="onInputValue()"
        />
        <tr-number-input-component
          propName="y"
          :disabled="roomData.isFitGrid"
          v-model="localValue.y"
          :widthEm="5"
          @input="onInputValue()"
        />
      </tr>
    </table>

    <div v-else v-t="'label.no-target'"></div>
  </div>
</template>

<script lang="ts">
import { Prop, Watch } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";
import { Address } from "@/@types/store-data-optional";
import ComponentVue from "@/app/core/window/ComponentVue";
import CssManager from "@/app/core/css/CssManager";
import GameObjectManager from "@/app/basic/GameObjectManager";
import TrNumberInputComponent from "@/app/basic/common/components/table-item/TrNumberInputComponent.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import { RoomDataStore } from "@/@types/store-data";

@Component({ components: { TrNumberInputComponent } })
export default class AddressInput extends Mixins<ComponentVue>(ComponentVue) {
  @Prop({ type: Object, default: null })
  private value!: Address;

  private roomData = GameObjectManager.instance.roomData;

  @TaskProcessor("room-data-update-finished")
  private async roomDataUpdateFinished(
    task: Task<RoomDataStore, never>
  ): Promise<TaskResult<never> | void> {
    this.roomData = task.value!;
  }

  private input(value: Address | null) {
    this.$emit("input", value);
  }

  public get localValue(): Address | null {
    return this.value;
  }
  public set localValue(value: Address | null) {
    this.input(value);
  }

  @Watch("localValue.x")
  private onChangeX() {
    if (!this.localValue) return;
    const gridSize = CssManager.instance.propMap.gridSize;
    this.localValue!.column = Math.floor(this.localValue!.x / gridSize) + 1;
  }

  @Watch("localValue.y")
  private onChangeY() {
    if (!this.localValue) return;
    const gridSize = CssManager.instance.propMap.gridSize;
    this.localValue!.row = Math.floor(this.localValue!.y / gridSize) + 1;
  }

  @Watch("localValue.column")
  private onChangeColumn() {
    if (!this.localValue) return;
    const gridSize = CssManager.instance.propMap.gridSize;
    this.localValue!.x = (this.localValue!.column - 1) * gridSize;
  }

  @Watch("localValue.row")
  private onChangeRow() {
    if (!this.localValue) return;
    const gridSize = CssManager.instance.propMap.gridSize;
    this.localValue!.y = (this.localValue!.row - 1) * gridSize;
  }

  @VueEvent
  private onInputValue() {
    setTimeout(() => {
      this.$emit("input");
    });
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.address-input {
  @include flex-box(row, flex-start, flex-start);
}
</style>
