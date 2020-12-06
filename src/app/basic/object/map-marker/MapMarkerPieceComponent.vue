<template>
  <div
    class="map-marker"
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
    <span
      class="frame"
      v-if="sceneObjectInfo && !sceneObjectInfo.data.isHideHighlight"
    >
      <span class="frame-corner-1"></span>
      <span class="frame-corner-2"></span>
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
export default class MapMarkerPieceComponent extends PieceMixin<"map-marker"> {}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";
.map-marker {
  @include basic-map-object();

  .frame {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;

    .frame-corner-1,
    .frame-corner-2 {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      border: 2px solid black;

      &:before,
      &:after {
        content: "";
        position: absolute;
        width: 0;
        height: 0;
        border-right: 8px solid transparent;
        border-bottom: 8px solid black;
        border-left: 8px solid transparent;
      }
    }
    .frame-corner-1 {
      &:before {
        transform: translate(calc(-50% + 1px), calc(-50% + 1px)) rotate(-45deg);
        top: 0;
        left: 0;
      }
      &:after {
        transform: translate(calc(50% - 1px), calc(-50% + 1px)) rotate(45deg);
        top: 0;
        right: 0;
      }
    }
    .frame-corner-2 {
      &:before {
        transform: translate(calc(-50% + 1px), calc(50% - 1px)) rotate(-135deg);
        bottom: 0;
        left: 0;
      }
      &:after {
        transform: translate(calc(50% - 1px), calc(50% - 1px)) rotate(135deg);
        bottom: 0;
        right: 0;
      }
    }
  }
}
</style>
