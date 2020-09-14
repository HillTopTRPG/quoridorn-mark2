<template>
  <span
    @mousedown.prevent.stop="onMousedown"
    @touchstart.prevent.stop="onMousedown"
    @mouseenter.prevent.stop="onMouseEnter"
    @click.prevent.stop
    :data-type="type"
    :class="{ isHover }"
    v-t="textTarget"
  ></span>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";
import VueEvent from "@/app/core/decorator/VueEvent";

@Component
export default class MenuDownItem extends Mixins<ComponentVue>(ComponentVue) {
  @Prop({ type: String, required: true })
  private type!: string;

  @Prop({ type: String, required: true })
  private textTarget!: string;

  @Prop({ type: Boolean, required: true })
  private isHover!: boolean;

  @VueEvent
  private onMousedown(event: MouseEvent) {
    this.$emit("mousedown", event);
  }

  @VueEvent
  private onMouseEnter(event: MouseEvent) {
    this.$emit("mouseenter", event);
  }
}
</script>
