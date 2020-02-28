<template>
  <div
    class="layer-info"
    :class="{
      selected: localValue === layerInfo.id,
      unuse: !sceneAndLayerInfo(layerInfo.id).data.isUse,
      orderChanging: isOrderChanging,
      dragMode
    }"
    @mouseenter="!dragMode || $emit('onMouseHoverOrder', true)"
    @mouseleave="!dragMode || $emit('onMouseHoverOrder', false)"
    @mousedown="!dragMode || $emit('onMouseDown')"
    @mouseup="!dragMode || $emit('onMouseUp')"
    @click="localValue = layerInfo.id"
  >
    <span class="icon-menu drag-mark"></span>
    <span
      v-t="'type.' + layerInfo.data.type"
      v-if="layerInfo.data.isSystem"
    ></span>
    <span v-else>{{ layerInfo.data.name }}</span>
    <label
      class="view-check"
      @mouseenter="$emit('onMouseHoverView', true)"
      @mouseleave="
        dragMode
          ? $emit('onMouseHoverOrder', true)
          : $emit('onMouseHoverView', false)
      "
      :class="[
        sceneAndLayerInfo(layerInfo.id).data.isUse
          ? 'icon-eye'
          : 'icon-eye-blocked'
      ]"
    >
      <input
        type="checkbox"
        class="input"
        :checked="sceneAndLayerInfo(layerInfo.id).data.isUse"
        @change="
          $emit(
            'onChangeLayerUse',
            sceneAndLayerInfo(layerInfo.id).id,
            !sceneAndLayerInfo(layerInfo.id).data.isUse
          )
        "
      />
    </label>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import { StoreUseData } from "@/@types/store";
import { SceneAndLayer, SceneLayer } from "@/@types/room";
import GameObjectManager from "@/app/basic/GameObjectManager";
import VueEvent from "@/app/core/decorator/VueEvent";

@Component({ components: {} })
export default class EditSceneLayerComponent extends Vue {
  @Prop({ type: Object, required: true })
  private layerInfo!: SceneLayer;

  @Prop({ type: Boolean, required: true })
  private dragMode!: boolean;

  @Prop({ type: String, default: "" })
  private value!: string; // selectedLayerId

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

  private get sceneAndLayerInfo(): (id: string) => StoreUseData<SceneAndLayer> {
    return (id: string) =>
      this.sceneAndLayerList.filter(sal => sal.data!.layerId === id)[0];
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

  &.selected {
    background-color: lightyellow;

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
