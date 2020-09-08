<template>
  <div
    :class="[
      fontSizeChangeBan ? 'fontSizeChangeBan' : undefined,
      `knob-${side}`,
      deco ? 'deco' : undefined
    ]"
    @mousedown.left.stop="leftDown($event, side)"
    @touchstart.stop="leftDown($event, side)"
    @contextmenu.prevent
  ></div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import VueEvent from "../decorator/VueEvent";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";

@Component
export default class ResizeKnob extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private side!: string;

  @Prop({ type: Boolean, default: false })
  private fontSizeChangeBan!: boolean;

  @Prop({ type: Boolean, default: false })
  private deco!: boolean;

  @VueEvent
  private leftDown(event: MouseEvent | TouchEvent, side: string): void {
    this.$emit("leftDown", event, side);
  }
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

  &.deco {
    background-color: var(--uni-color-orange);
  }
}

.knob-left,
.knob-right {
  top: 6px;
  width: 10px;
  height: calc(100% - 12px);
}

.knob-top,
.knob-bottom {
  left: 6px;
  height: 10px;
  width: calc(100% - 12px);
}

.knob-top:not(.fontSizeChangeBan) {
  left: calc(6px + 8rem);
  width: calc(100% - 12px - 8rem);
}

.knob-bottom {
  left: 6px;
  width: calc(100% - 12px);
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
}
.knob-right-bottom {
  cursor: se-resize;
}
</style>
