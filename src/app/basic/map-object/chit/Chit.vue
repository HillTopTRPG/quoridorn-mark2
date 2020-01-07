<template>
  <div
    class="chit"
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
import { ChitStore } from "@/@types/gameObject";

@Component
export default class Chit extends PieceMixin<ChitStore> {}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";
.chit {
  @include basic-map-object();
}
</style>
