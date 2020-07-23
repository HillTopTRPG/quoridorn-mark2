<template>
  <div class="container" ref="window-container"></div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import LifeCycle from "./core/decorator/LifeCycle";
import WindowVue from "./core/window/WindowVue";

@Component
export default class TemplateWindow extends Mixins<WindowVue<string, never>>(
  WindowVue
) {
  @LifeCycle
  private async mounted() {
    await this.init();
  }
}
</script>

<style scoped lang="scss">
@import "../assets/common";

.container {
  @include flex-box(column, stretch, center);
  width: 100%;
  height: 100%;
}
</style>
