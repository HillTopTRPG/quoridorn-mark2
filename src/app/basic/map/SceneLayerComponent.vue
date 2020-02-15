<template>
  <div class="scene-layer" :class="[className]" ref="elm">
    <template v-for="sceneObject in useSceneObjectList">
      <map-mask
        v-if="sceneObject.data.type === 'map-mask'"
        :key="sceneObject.id"
        :docId="sceneObject.id"
        type="map-mask"
      />

      <chit
        v-if="sceneObject.data.type === 'chit'"
        :key="sceneObject.id"
        :docId="sceneObject.id"
        type="chit"
      />
    </template>
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
import { SceneLayer } from "@/@types/room";

@Component({
  components: {
    MapMask,
    Chit
  }
})
export default class SceneLayerComponent extends Vue {
  @Prop({ type: Object, required: true })
  private layer!: StoreUseData<SceneLayer>;

  private sceneObjectList = GameObjectManager.instance.sceneObjectList;
  private sceneAndObjectList = GameObjectManager.instance.sceneAndObjectList;

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
  private get useSceneObjectList() {
    return this.sceneAndObjectList
      .map(
        sao =>
          this.sceneObjectList.filter(mo => mo.id === sao.data!.objectId)[0]
      )
      .filter(
        mo => mo.data!.place === "field" && mo.data!.layerId === this.layer.id
      );
  }

  private get elm(): HTMLElement {
    return this.$refs.elm as HTMLElement;
  }
}
</script>

<style scoped lang="scss">
.scene-layer {
  position: absolute;
  left: 0;
  top: 0;
  width: 0;
  height: 0;
  z-index: var(--z-index);
}
</style>
