<template>
  <span
    class="shortcut-button"
    :class="[
      'icon-' + icon,
      disabled ? 'disabled' : undefined,
      colorStyle,
      label ? 'hasLabel' : undefined
    ]"
    :tabindex="disabled ? undefined : '0'"
    @click.stop="disabled || $emit('click')"
    @mousedown.stop
    @touchstart.stop
    @keydown.space.stop="$emit('click')"
    @keydown.enter.stop="$emit('click')"
    @mouseenter="$emit('hover', true)"
    @mouseleave="$emit('hover', false)"
    @keydown.229.stop
    @keyup.229.stop
  >
    <span class="label">{{ label }}</span>
  </span>
</template>

<script lang="ts">
import { Prop } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";
import ComponentVue from "../../../core/window/ComponentVue";
import TabsComponent from "./tab-component/TabsComponent.vue";

@Component({
  components: { TabsComponent }
})
export default class SButton extends Mixins<ComponentVue>(ComponentVue) {
  @Prop({ type: String, required: true })
  private icon!: string;

  @Prop({ type: String, default: "skyblue" })
  private colorStyle!: string;

  @Prop({ type: Boolean, default: false })
  private disabled!: boolean;

  @Prop({ type: String, default: "" })
  private label!: string;
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.shortcut-button {
  @include inline-flex-box(row, center, center);
  border: 1px dotted gray;
  border-radius: 1em;
  background-color: white;
  width: 2em;
  min-width: 2em;
  height: 2em;
  min-height: 2em;
  box-sizing: border-box;
  margin-left: 0.3rem;

  .label {
    white-space: pre-wrap;
  }

  &.hasLabel {
    width: auto;
    padding: 0 0.5em;
    height: auto;
  }

  &.skyblue {
    @include btn-skyblue();
  }

  &.pink {
    @include btn-pink();
  }
}
</style>
