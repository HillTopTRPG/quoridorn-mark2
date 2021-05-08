<template>
  <div
    class="layer-info"
    :class="{
      selected: localValue === layerInfo.key,
      unuse: !sceneAndLayerInfo.data.isUse,
      orderChanging: isOrderChanging,
      dragMode
    }"
    @mouseenter="!dragMode || $emit('onMouseHoverOrder', true)"
    @mouseleave="!dragMode || $emit('onMouseHoverOrder', false)"
    @mousedown="!dragMode || $emit('onMouseDown')"
    @mouseup="!dragMode || $emit('onMouseUp')"
    @click="localValue = layerInfo.key"
  >
    <span class="icon-menu drag-mark"></span>
    <span
      v-t="'type.' + layerInfo.data.type"
      v-if="layerInfo.data.isSystem"
    ></span>
    <span v-else>{{ layerInfo.data.name }}</span>
    <s-check
      :value="sceneAndLayerInfo.data.isUse"
      colorStyle="pink"
      c-icon="eye"
      c-label=""
      n-icon="eye-blocked"
      n-label=""
      @hover="onHoverView"
      @input="value => $emit('onChangeLayerUse', sceneAndLayerInfo.key, value)"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { SceneAndLayerStore, SceneLayerStore } from "@/@types/store-data";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";
import SCheck from "@/app/basic/common/components/SCheck.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import VueEvent from "@/app/core/decorator/VueEvent";

@Component({ components: { SCheck } })
export default class EditSceneLayerComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private layerInfo!: StoreData<SceneLayerStore>;

  @Prop({ type: Boolean, required: true })
  private dragMode!: boolean;

  @Prop({ type: String, default: "" })
  private value!: string; // selectedLayerKey

  @Prop({ type: String, required: true })
  private sceneKey!: string;

  @Prop({ type: Boolean, required: true })
  private isOrderChanging!: boolean;

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
  private get sceneAndLayerInfo(): StoreData<SceneAndLayerStore> {
    return this.sceneAndLayerList.find(
      sal =>
        sal.data!.layerKey === this.layerInfo.key &&
        sal.data!.sceneKey === this.sceneKey
    )!;
  }

  @VueEvent
  private onHoverView(isHover: boolean) {
    if (isHover) this.$emit("onMouseHoverView", true);
    else {
      if (this.dragMode) this.$emit("onMouseHoverOrder", true);
      else this.$emit("onMouseHoverView", false);
    }
  }

  private sceneAndLayerList = GameObjectManager.instance.sceneAndLayerList;
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

$border-color: green;

.view-check {
  @include flex-box(row, center, center);
  width: 1.5em;
  height: 1.5em;
  border: 1px solid black;
  border-radius: 50%;
  box-sizing: border-box;
  cursor: pointer;

  input {
    display: none !important;
  }
}

.drag-mark {
  visibility: hidden;
}

.layer-info {
  @include flex-box(row, space-between, center);
  background-color: white;
  height: 2em;
  line-height: 2em;
  padding: 0 0.2rem;
  position: relative;
  border-bottom: 1px solid $border-color;
  cursor: pointer;

  &:hover {
    background-color: var(--uni-color-light-skyblue);
  }

  &.selected {
    background-color: var(--uni-color-skyblue);

    &:after {
      content: "";
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      transform: translateX(100%) translateY(-1px);
      border: transparent calc(1em + 1px) solid;
      border-left-color: $border-color;
      box-sizing: border-box;
    }
  }

  &.dragMode {
    cursor: grab;

    .drag-mark {
      visibility: visible;
    }
  }

  &.orderChanging {
    background-color: lightpink;
    cursor: grabbing;
  }

  &.unuse {
    background-color: lightgray;
  }
}
</style>
