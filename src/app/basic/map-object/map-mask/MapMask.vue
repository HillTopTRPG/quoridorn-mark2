<template>
  <div
    class="map-mask"
    :class="basicClasses"
    :id="docId"
    @mouseover="mouseover"
    @mouseout="mouseout"
    @click.right.prevent="openContext"
    @mousedown.left.stop="leftDown"
    @mouseup.left.stop="leftUp"
    @mousedown.right.stop="rightDown"
    @mouseup.right.stop="rightUp"
    @touchstart.stop="leftDown"
    @touchend.stop="leftUp"
    @touchcancel.stop="leftUp"
    @contextmenu.prevent
    ref="component"
  ></div>
</template>

<script lang="ts">
import PieceMixin from "@/app/basic/common/mixin/PieceMixin.vue";
import { Component } from "vue-property-decorator";
import { MapMaskStore } from "@/@types/gameObject";

@Component
export default class MapMask extends PieceMixin<MapMaskStore> {}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";
.map-mask {
  @include basic-map-object();
}
</style>
