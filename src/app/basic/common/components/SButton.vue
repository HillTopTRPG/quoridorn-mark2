<template>
  <span
    class="shortcut-button"
    :class="['icon-' + icon, disabled ? 'disabled' : undefined]"
    :tabindex="disabled ? undefined : '0'"
    @click.stop="$emit('click')"
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

  @Prop({ type: Boolean, default: false })
  private disabled!: boolean;
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.shortcut-button {
  @include inline-flex-box(row, center, center);
  @include btn-skyblue();
  border: 1px dotted gray;
  border-radius: 50%;
  background-color: white;
  width: 2em;
  height: 2em;
  min-width: 2em;
  box-sizing: border-box;
  margin-left: 0.3rem;
}
</style>
