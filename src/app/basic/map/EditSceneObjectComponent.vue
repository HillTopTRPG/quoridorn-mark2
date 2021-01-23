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
    <s-check
      :value="sceneAndObject.data.isOriginalAddress"
      colorStyle="pink"
      c-icon="checkmark"
      :c-label="$t('label.original-address')"
      n-icon=""
      :n-label="$t('label.original-address')"
      @hover="onHoverView"
      @input="value => $emit('onChangeIsOriginalAddress', value)"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import draggable from "vuedraggable";
import { SceneObjectStore, SceneAndObjectStore } from "@/@types/store-data";
import ComponentVue from "@/app/core/window/ComponentVue";
import SCheck from "@/app/basic/common/components/SCheck.vue";
import BaseInput from "@/app/core/component/BaseInput.vue";
import VueEvent from "@/app/core/decorator/VueEvent";

@Component({ components: { SCheck, BaseInput, draggable } })
export default class EditSceneObjectComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private sceneObject!: StoreData<SceneObjectStore>;

  @Prop({ type: Object, default: null })
  private sceneAndObject!: StoreData<SceneAndObjectStore>;

  @Prop({ type: Boolean, required: true })
  private isSelected!: boolean;

  @Prop({ type: Boolean, required: true })
  private isOrderChanging!: boolean;

  @Prop({ type: Boolean, required: true })
  private dragMode!: boolean;

  @VueEvent
  private onHoverView(isHover: boolean) {
    if (isHover) this.$emit("onMouseHoverAddress", true);
    else {
      if (this.dragMode) this.$emit("onMouseHoverOrder", true);
      else this.$emit("onMouseHoverAddress", false);
    }
  }
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

.drag-mark {
  visibility: hidden;
}

$border-color: green;

.scene-object {
  @include flex-box(row, space-between, center);
  @include btn-skyblue();
  background-color: white;
  height: 2em;
  line-height: 2em;
  padding: 0 0.2rem;
  position: relative;
  border-bottom: 1px solid $border-color;

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
