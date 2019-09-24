<template>
  <div
    :class="`knob-${side}`"
    @mousedown.left.stop="leftDown(side)"
    @touchstart.stop="leftDown(side)"
    @contextmenu.prevent
  ></div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from "vue-property-decorator";

@Component
export default class ResizeKnob extends Vue {
  @Prop({ type: String, required: true })
  private side!: string;

  @Emit("leftDown")
  private leftDown(side: string): void {}
}
</script>
