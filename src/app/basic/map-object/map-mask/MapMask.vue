<template>
  <div
    class="map-mask"
    :class="basicClasses"
    :id="docId"
    @mouseover="mouseover"
    @mouseout="mouseout"
    @click.right.prevent="openContext"
    @mousedown.left="leftDown"
    @touchstart="leftDown"
    @mousedown.right.stop="rightDown"
    @contextmenu.prevent
    ref="component"
  ></div>
</template>

<script lang="ts">
import PieceMixin from "@/app/basic/common/mixin/PieceMixin.vue";
import { Component } from "vue-property-decorator";

@Component
export default class MapMask extends PieceMixin<"map-mask"> {}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";
.map-mask {
  @include basic-map-object();
}
</style>
