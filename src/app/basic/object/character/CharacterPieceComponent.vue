<template>
  <div
    class="character"
    :class="basicClasses"
    :id="docId"
    @mouseover="mouseover"
    @mouseout="mouseout"
    @mousedown.left="leftDown"
    @touchstart="leftDown"
    @mousedown.right.stop="rightDown"
    @contextmenu.prevent
    ref="component"
  >
    <span class="tag" v-if="sceneObjectInfo">
      {{ sceneObjectInfo.data.name }} - {{ elm.style.zIndex }} - {{ docId }}
    </span>
    <span class="name" v-if="sceneObjectInfo">
      {{ sceneObjectInfo.data.name }}
    </span>

    <!-- HTMLインジェクション対策済み -->
    <div class="lock-info" v-if="lockMessage">
      <span class="lock-info-message" v-html="lockMessage"></span>
    </div>
  </div>
</template>

<script lang="ts">
import PieceMixin from "@/app/basic/common/mixin/PieceMixin.vue";
import { Component } from "vue-property-decorator";

@Component
export default class CharacterPieceComponent extends PieceMixin<"character"> {}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";
.character {
  @include basic-map-object();
}
</style>
