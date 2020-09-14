<template>
  <div id="drop-area" :class="{ dropping: isDropping }">
    <div class="message" v-t="'message.drop-area'"></div>
  </div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import ComponentVue from "../../core/window/ComponentVue";

@Component
export default class DropArea extends Mixins<ComponentVue>(ComponentVue) {
  @Prop({ type: Boolean, required: true })
  private isDropping!: boolean;
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

#drop-area {
  @include flex-box(column, center, center);
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
  pointer-events: none;
  background-color: rgba(0, 0, 0, 0.7);
  visibility: hidden;

  &.dropping {
    visibility: visible;
  }
}

.message {
  @include flex-box(column, center, center);
  padding: 1rem;
  font-size: 3rem;
  width: 80vw;
  height: 80vh;
  color: white;
  border: 3px dashed white;
  border-radius: 3rem;
  white-space: pre-line;
}
</style>
