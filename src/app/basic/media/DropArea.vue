<template>
  <div id="drop-area" :class="{ dropping: isDropping }">
    <div class="message" v-t="'label.drop-area'"></div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import MapMask from "@/app/basic/object/map-mask/MapMaskPieceComponent.vue";
import Chit from "@/app/basic/object/chit/ChitPieceComponent.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { StoreObj, StoreUseData } from "@/@types/store";
import VueEvent from "@/app/core/decorator/VueEvent";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import { SceneAndLayer, SceneLayer } from "@/@types/room";
import DocumentSnapshot from "nekostore/lib/DocumentSnapshot";
import SocketFacade, {
  getStoreObj
} from "@/app/core/api/app-server/SocketFacade";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";

@Component({
  components: {
    MapMask,
    Chit
  }
})
export default class DropArea extends Mixins<ComponentVue>(ComponentVue) {
  @Prop({ type: Boolean, required: true })
  private isDropping!: boolean;
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

#drop-area {
  @include flex-box(column, center, center);
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
  pointer-events: none;
  background-color: rgba(0, 0, 0, 0.7);
  visibility: hidden;

  &.dropping {
    visibility: visible;
  }
}

.message {
  @include flex-box(column, center, center);
  padding: 1rem;
  font-size: 3rem;
  width: 80vw;
  height: 80vh;
  color: white;
  border: 3px dashed white;
  border-radius: 3rem;
  white-space: pre-line;
}
</style>
