<template>
  <div
    class="chit"
    :class="basicClasses"
    :id="docKey"
    @mouseover="mouseover"
    @mouseout="mouseout"
    @mousedown.left="leftDown"
    @touchstart="leftDown"
    @mousedown.right.stop="rightDown"
    @contextmenu.prevent
    ref="component"
  >
    <span class="tag" v-if="sceneObjectInfo">
      {{ sceneObjectInfo.data.name }} - {{ elm.style.zIndex }} - {{ docKey }}
    </span>

    <!-- HTMLインジェクション対策済み -->
    <div class="lock-info" v-if="lockMessage">
      <span class="lock-info-message" v-html="lockMessage"></span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import PieceMixin from "../../common/mixin/PieceMixin.vue";

@Component
export default class ChitPieceComponent extends PieceMixin<"chit"> {}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";
.chit {
  @include basic-map-object();
}
</style>
