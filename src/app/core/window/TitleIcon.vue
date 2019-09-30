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
import { Component, Emit, Prop, Vue } from "vue-property-decorator";
import ResizeKnob from "./ResizeKnob.vue";

@Component({
  components: { ResizeKnob }
})
export default class TitleIcon extends Vue {
  @Prop({ type: String, required: true })
  private className!: string;

  @Emit("emit")
  private emit(event: MouseEvent) {}
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.title-icon-area i {
  display: block;
  padding: 3px;
  font-size: 8px;
  border: 2px solid rgba(0, 0, 0, 0.5);
  color: rgba(0, 0, 0, 0.5);
  transform-origin: right;
  transform: scale(0.8) translateX(0);
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    border-color: black;
    color: black;
  }
}
</style>
