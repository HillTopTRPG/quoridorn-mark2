<template>
  <div class="container" ref="window">
    <textarea class="raw" v-model="rawText"></textarea>
    <other-text-component v-model="rawText" />
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import WindowVue from "../../core/window/WindowVue";
import { Mixins } from "vue-mixin-decorator";
import LifeCycle from "../../core/decorator/LifeCycle";
import OtherTextComponent from "./OtherTextComponent.vue";

@Component({
  components: { OtherTextComponent }
})
export default class EditOtherTextWindow extends Mixins<
  WindowVue<string, never>
>(WindowVue) {
  private rawText: string = "";

  @LifeCycle
  public async mounted() {
    await this.init();
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.container {
  @include flex-box(row, flex-start, center);
  height: 100%;

  .raw {
    width: 25%;
  }

  .other-text-container {
    width: 75%;
  }

  > * {
    height: 100% !important;
    padding: 0;
    margin: 0;
    box-sizing: border-box;
  }
}
</style>
