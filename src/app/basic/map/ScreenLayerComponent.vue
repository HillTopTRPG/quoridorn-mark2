<template>
  <div class="screen-layer" :class="[className]" ref="elm">
    <map-mask
      v-for="obj in getScreenObjectList('map-mask', 'field')"
      :key="obj.id"
      :docId="obj.id"
      type="map-mask"
    />

    <chit
      v-for="obj in getScreenObjectList('chit', 'field')"
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
import VueEvent from "@/app/core/decorator/VueEvent";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import { ScreenLayer } from "@/@types/room";

@Component({
  components: {
    MapMask,
    Chit
  }
})
export default class ScreenLayerComponent extends Vue {
  @Prop({ type: Object, required: true })
  private layer!: StoreUseData<ScreenLayer>;

  private screenObjectList = GameObjectManager.instance.screenObjectList;

  private isMounted: boolean = false;

  private get className(): string {
    return this.layer.data!.isSystem
      ? this.layer.data!.type
      : this.layer.data!.name!;
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
  private getScreenObjectList(
    type: string,
    place: "field" | "graveyard" | "backstage"
  ) {
    return this.screenObjectList.filter(
      mo =>
        mo.data!.type === type &&
        mo.data!.place === place &&
        mo.data!.layerId === this.layer.id
    );
  }

  private get elm(): HTMLElement {
    return this.$refs.elm as HTMLElement;
  }
}
</script>

<style scoped lang="scss">
.screen-layer {
  position: absolute;
  left: 0;
  top: 0;
  width: 0;
  height: 0;
  z-index: var(--z-index);
}
</style>
