<template>
  <div class="map-layer" :class="[className]" ref="elm">
    <map-mask
      v-for="obj in getMapObjectList(mapMaskList, 'field')"
      :key="obj.id"
      :docId="obj.id"
      type="map-mask"
    />

    <chit
      v-for="obj in getMapObjectList(chitList, 'field')"
      :key="obj.id"
      :docId="obj.id"
      type="chit"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import MapMask from "@/app/basic/map-object/map-mask/MapMask.vue";
import Chit from "@/app/basic/map-object/chit/Chit.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { StoreUseData } from "@/@types/store";
import { MapObject } from "@/@types/gameObject";
import VueEvent from "@/app/core/decorator/VueEvent";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import { MapLayer } from "@/@types/room";

@Component({
  components: {
    MapMask,
    Chit
  }
})
export default class MapLayerComponent extends Vue {
  @Prop({ type: Object, required: true })
  private layer!: StoreUseData<MapLayer>;

  private mapMaskList = GameObjectManager.instance.mapMaskList;
  private chitList = GameObjectManager.instance.chitList;

  private isMounted: boolean = false;

  private get className(): string {
    return this.layer.data.deletable
      ? this.layer.data.name
      : this.layer.data.type;
  }

  @LifeCycle
  private async mounted() {
    this.isMounted = true;
  }

  @Watch("isMounted")
  @Watch("layer", { deep: true })
  private onChangeLayer() {
    this.elm.style.setProperty("--z-index", (this.layer.order + 1).toString());
  }

  @VueEvent
  private getMapObjectList(
    list: StoreUseData<MapObject>[],
    place: "field" | "graveyard" | "backstage"
  ) {
    return GameObjectManager.filterPlaceList(list, place).filter(
      o => o.data.layerId === this.layer.id
    );
  }

  private get elm(): HTMLElement {
    return this.$refs.elm as HTMLElement;
  }
}
</script>

<style scoped lang="scss">
.map-layer {
  position: absolute;
  left: 0;
  top: 0;
  width: 0;
  height: 0;
  z-index: var(--z-index);
}
</style>
