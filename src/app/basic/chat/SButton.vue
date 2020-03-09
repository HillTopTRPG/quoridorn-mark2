<template>
  <span
    class="shortcut-button"
    :class="'icon-' + icon"
    tabindex="0"
    @click="$emit('click')"
    @keydown.space.stop="$emit('click')"
    @keydown.enter.stop="$emit('click')"
    @mouseenter="$emit('hover', true)"
    @mouseleave="$emit('hover', false)"
    @keydown.229.stop
    @keyup.229.stop
  >
  </span>
</template>

<script lang="ts">
import { Prop } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";
import TabsComponent from "@/app/basic/common/components/tab-component/TabsComponent.vue";
import ComponentVue from "@/app/core/window/ComponentVue";

@Component({
  components: { TabsComponent }
})
export default class SButton extends Mixins<ComponentVue>(ComponentVue) {
  @Prop({ type: String, required: true })
  private icon!: string;
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.shortcut-button {
  @include flex-box(row, center, center);
  border: 1px dotted gray;
  border-radius: 50%;
  background-color: white;
  width: 2em;
  height: 2em;
  min-width: 2em;
  box-sizing: border-box;
  cursor: pointer;
  margin-left: 0.3rem;

  &:hover {
    background-color: var(--uni-color-light-skyblue);
  }

  &:active {
    background-color: var(--uni-color-skyblue);
  }
}
</style>
