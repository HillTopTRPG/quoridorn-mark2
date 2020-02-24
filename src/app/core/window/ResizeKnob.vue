<template>
  <div
    :class="[
      fontSizeChangeBan ? 'fontSizeChangeBan' : undefined,
      `knob-${side}`
    ]"
    @mousedown.left.stop="leftDown($event, side)"
    @touchstart.stop="leftDown($event, side)"
    @contextmenu.prevent
  ></div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from "vue-property-decorator";

@Component
export default class ResizeKnob extends Vue {
  @Prop({ type: String, required: true })
  private side!: string;

  @Prop({ type: Boolean, default: false })
  private fontSizeChangeBan!: boolean;

  @Emit("leftDown")
  private leftDown(event: MouseEvent | TouchEvent, side: string): void {}
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.knob-left,
.knob-right,
.knob-top,
.knob-bottom,
.knob-left-top,
.knob-left-bottom,
.knob-right-top,
.knob-right-bottom {
  position: absolute;
  z-index: 1;
}

.knob-left,
.knob-right {
  top: 10px;
  width: 10px;
  height: calc(100% - 20px);
}

.knob-top,
.knob-bottom {
  left: 10px;
  height: 10px;
  width: calc(100% - 20px);
}

.knob-top:not(.fontSizeChangeBan) {
  left: calc(10px + 8rem);
  width: calc(100% - 20px - 8rem);
}

.knob-bottom {
  left: 10px;
  width: calc(100% - 20px);
}

.knob-left-top,
.knob-left-bottom,
.knob-right-top,
.knob-right-bottom {
  width: 10px;
  height: 10px;
}

.knob-left,
.knob-left-top,
.knob-left-bottom {
  left: -4px;
}
.knob-right,
.knob-right-top,
.knob-right-bottom {
  right: -4px;
}
.knob-top,
.knob-left-top,
.knob-right-top {
  top: -4px;
}
.knob-bottom,
.knob-left-bottom,
.knob-right-bottom {
  bottom: -4px;
}

.knob-left {
  cursor: w-resize;
}
.knob-right {
  cursor: e-resize;
}
.knob-top {
  cursor: n-resize;
}
.knob-bottom {
  cursor: s-resize;
}
.knob-left-top {
  cursor: nw-resize;
}
.knob-left-bottom {
  cursor: sw-resize;
}
.knob-right-top {
  cursor: ne-resize;
  border-radius: 0 8px 0 0;
}
.knob-right-bottom {
  cursor: se-resize;
}
</style>
