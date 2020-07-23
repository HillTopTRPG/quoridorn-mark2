<template>
  <div class="scene-layer" :class="[className]" ref="elm">
    <template v-for="cardDeckSmall in useCardDeckSmallList">
      <card-deck-small-component
        :deck="cardDeckSmall"
        :key="cardDeckSmall.id"
      />
    </template>
    <template v-for="sceneObject in useSceneObjectList">
      <map-mask-piece-component
        v-if="sceneObject.data.type === 'map-mask'"
        :key="sceneObject.id"
        :docId="sceneObject.id"
        type="map-mask"
      />

      <chit-piece-component
        v-if="sceneObject.data.type === 'chit'"
        :key="sceneObject.id"
        :docId="sceneObject.id"
        type="chit"
      />

      <character-piece-component
        v-if="sceneObject.data.type === 'character'"
        :key="sceneObject.id"
        :docId="sceneObject.id"
        type="character"
      />
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import DocumentSnapshot from "nekostore/lib/DocumentSnapshot";
import { Mixins } from "vue-mixin-decorator";
import { StoreObj, StoreUseData } from "../../../@types/store";
import LifeCycle from "../../core/decorator/LifeCycle";
import ComponentVue from "../../core/window/ComponentVue";
import { SceneAndLayer, SceneLayer } from "../../../@types/room";
import GameObjectManager from "../GameObjectManager";
import CardDeckSmallComponent from "../card/CardDeckSmallComponent.vue";
import VueEvent from "../../core/decorator/VueEvent";
import SocketFacade, {
  getStoreObj
} from "../../core/api/app-server/SocketFacade";
import MapMaskPieceComponent from "../object/map-mask/MapMaskPieceComponent.vue";
import ChitPieceComponent from "../object/chit/ChitPieceComponent.vue";
import CharacterPieceComponent from "../object/character/CharacterPieceComponent.vue";

@Component({
  components: {
    CharacterPieceComponent,
    ChitPieceComponent,
    MapMaskPieceComponent,
    CardDeckSmallComponent
  }
})
export default class SceneLayerComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private sceneId!: string;

  @Prop({ type: Object, required: true })
  private layer!: StoreUseData<SceneLayer>;

  private sceneAndLayerCC = SocketFacade.instance.sceneAndLayerCC();

  private cardDeckSmallList = GameObjectManager.instance.cardDeckSmallList;
  private sceneObjectList = GameObjectManager.instance.sceneObjectList;
  private sceneAndObjectList = GameObjectManager.instance.sceneAndObjectList;

  private isMounted: boolean = false;
  private sceneAndLayerInfo: StoreUseData<SceneAndLayer> | null = null;

  private get className(): string {
    return this.layer.data!.isSystem
      ? this.layer.data!.type
      : this.layer.data!.name!;
  }

  @LifeCycle
  private async mounted() {
    const sceneAndLayerInfo = (await this.sceneAndLayerCC!.find([
      {
        property: "data.layerId",
        operand: "==",
        value: this.layer.id!
      }
    ]))![0];
    this.sceneAndLayerInfo = sceneAndLayerInfo;
    await this.sceneAndLayerCC!.setSnapshot(
      this.key,
      sceneAndLayerInfo.id!,
      (snapshot: DocumentSnapshot<StoreObj<SceneAndLayer>>) => {
        if (!snapshot.data) return;
        const status = snapshot.data.status;
        if (status === "modified" || status === "modify-touched") {
          this.sceneAndLayerInfo = getStoreObj<SceneAndLayer>(snapshot);
        }
      }
    );
    this.isMounted = true;
  }

  @Watch("isMounted")
  @Watch("sceneAndLayerInfo.order")
  private onChangeOrder() {
    this.elm.style.zIndex = this.sceneAndLayerInfo!.order.toString(10);
  }

  @VueEvent
  private get useSceneObjectList() {
    return this.sceneAndObjectList
      .filter(sao => sao.data!.sceneId === this.sceneId)
      .map(
        sao =>
          this.sceneObjectList.filter(mo => mo.id === sao.data!.objectId)[0]
      )
      .filter(
        so => so.data!.place === "field" && so.data!.layerId === this.layer.id
      );
  }

  @VueEvent
  private get useCardDeckSmallList() {
    return this.cardDeckSmallList.filter(
      cds => cds.data!.layerId === this.layer.id
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
