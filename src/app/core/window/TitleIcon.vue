<template>
  <span class="title-icon-area">
    <i
      :class="[className]"
      @mousedown.left.stop
      @click.left.stop="emit"
      @keydown.space.stop="emit"
      @keydown.enter.stop="emit"
      @keydown.229.stop
      @keyup.229.stop
      :tabindex="0"
    ></i>
  </span>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import VueEvent from "../decorator/VueEvent";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";

@Component
export default class TitleIcon extends Mixins<ComponentVue>(ComponentVue) {
  @Prop({ type: String, required: true })
  private className!: string;

  @VueEvent
  private emit(event: MouseEvent | TouchEvent) {
    this.$emit("emit", event);
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.title-icon-area {
  i {
    display: block;
    padding: 3px;
    font-size: 8px;
    border: 2px solid rgba(0, 0, 0, 0.5);
    color: rgba(0, 0, 0, 0.5);
    transform-origin: center;
    transform: scale(0.8) translateX(0);
    cursor: pointer;
    white-space: nowrap;
    box-sizing: border-box;

    &:hover {
      border-color: black;
      color: black;
    }
  }
}
</style>
