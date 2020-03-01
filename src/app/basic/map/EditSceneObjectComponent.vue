<template>
  <div
    class="scene-object"
    :class="{
      selected: isSelected,
      orderChanging: isOrderChanging,
      dragMode: dragMode
    }"
    @click="$emit('onClick')"
    @mouseenter="!dragMode || $emit('onMouseHoverOrder', true)"
    @mouseleave="!dragMode || $emit('onMouseHoverOrder', false)"
    @mousedown="!dragMode || $emit('onMouseDown')"
    @mouseup="!dragMode || $emit('onMouseUp')"
  >
    <span>
      <span class="icon-menu drag-mark"></span>
      (
      <span v-t="`type.${sceneObject.data.type}`"></span>
      )&nbsp;
      <span>{{ sceneObject.data.name }}</span>
    </span>
    <label class="original-address" v-if="sceneAndObject">
      <span
        v-t="'label.original-address'"
        class="original-address-label"
        @mouseenter="$emit('onMouseHoverAddress', true)"
        @mouseleave="
          dragMode
            ? $emit('onMouseHoverOrder', true)
            : $emit('onMouseHoverAddress', false)
        "
        :class="{
          checked: sceneAndObject.data.isOriginalAddress
        }"
      ></span>
      <base-input
        type="checkbox"
        class="original-address-check"
        :checked="sceneAndObject.data.isOriginalAddress"
        @input="
          $emit(
            'onChangeIsOriginalAddress',
            !sceneAndObject.data.isOriginalAddress
          )
        "
      />
    </label>
  </div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import BaseInput from "@/app/core/component/BaseInput.vue";
import { StoreUseData } from "@/@types/store";
import { SceneAndObject } from "@/@types/room";
import VueEvent from "@/app/core/decorator/VueEvent";
import { SceneObject } from "@/@types/gameObject";
import ComponentVue from "@/app/core/window/ComponentVue";
import draggable from "vuedraggable";

@Component({ components: { BaseInput, draggable } })
export default class EditSceneObjectComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private sceneObject!: StoreUseData<SceneObject>;

  @Prop({ type: Object, default: null })
  private sceneAndObject!: StoreUseData<SceneAndObject>;

  @Prop({ type: Boolean, required: true })
  private isSelected!: boolean;

  @Prop({ type: Boolean, required: true })
  private isOrderChanging!: boolean;

  @Prop({ type: Boolean, required: true })
  private dragMode!: boolean;
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.original-address-label {
  border: 1px solid gray;
  border-radius: 0.2rem;
  padding: 0 0.2rem;
  cursor: inherit;

  &.checked {
    background-color: yellow;
    color: red;

    &:after {
      visibility: visible;
    }
  }

  &:not(.checked) {
    background-color: lightgray;
  }

  &:after {
    content: "✔";
    visibility: hidden;
  }
}

.original-address-check {
  display: none !important;
}

.drag-mark {
  visibility: hidden;
}

$border-color: green;

.scene-object {
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

  &:after {
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
</style>
