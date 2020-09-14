<template>
  <div class="item" v-t="`${type}.window-title`" @click="onClickItem"></div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";
import App from "@/views/App.vue";
import VueEvent from "@/app/core/decorator/VueEvent";

@Component
export default class MenuWindowItem extends Mixins<ComponentVue>(ComponentVue) {
  @Prop({ type: String, required: true })
  private type!: string;

  @VueEvent
  private async onClickItem(event: MouseEvent) {
    this.$emit("click", event);
    await App.openSimpleWindow(this.type);
  }
}
</script>
