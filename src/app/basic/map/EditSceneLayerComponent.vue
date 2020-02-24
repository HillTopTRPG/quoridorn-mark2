<template>
  <div
    class="layer-info"
    :class="{
      selected: localValue === layerInfo.id,
      unuse: !sceneAndLayerInfoList[index].data.isUse
    }"
    @click="localValue = layerInfo.id"
  >
    <span
      v-t="'type.' + layerInfo.data.type"
      v-if="layerInfo.data.isSystem"
    ></span>
    <span v-else>{{ layerInfo.data.name }}</span>
    <label
      class="view-check"
      :class="[
        sceneAndLayerInfoList[index].data.isUse
          ? 'icon-eye'
          : 'icon-eye-blocked'
      ]"
      @mouseenter="onMouseHover(true)"
      @mouseleave="onMouseHover(false)"
    >
      <input
        type="checkbox"
        class="input"
        :checked="sceneAndLayerInfoList[index].data.isUse"
        @change="
          changeLayerUse(
            sceneAndLayerInfoList[index].id,
            $event.target.checked
          ).then()
        "
      />
    </label>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import { StoreUseData } from "@/@types/store";
import { SceneAndLayer, SceneLayer } from "@/@types/room";
import GameObjectManager from "@/app/basic/GameObjectManager";
import VueEvent from "@/app/core/decorator/VueEvent";

@Component({ components: {} })
export default class EditSceneLayerChooserComponent extends Vue {
  @Prop({ type: Object, required: true })
  private layerInfo!: SceneLayer;

  @Prop({ type: String, required: true })
  private sceneId!: string;

  @Prop({ type: String, default: "" })
  private value!: string; // selectedLayerId

  public input(value: string) {
    this.$emit("input", value);
  }

  private get localValue(): string {
    return this.value;
  }

  private set localValue(value: string) {
    this.input(value);
  }

  private sceneAndLayerInfoList: StoreUseData<SceneAndLayer>[] | null = null;
  private layerInfoList: StoreUseData<SceneLayer>[] | null = null;
  private sceneAndLayerCC = SocketFacade.instance.sceneAndLayerCC();

  private sceneAndLayerList = GameObjectManager.instance.sceneAndLayerList;
  private layerList = GameObjectManager.instance.sceneLayerList;

  @VueEvent
  private async changeLayerUse(mapAndKayerId: string, checked: boolean) {
    await this.sceneAndLayerCC.touchModify(mapAndKayerId);
    let data = this.sceneAndLayerInfoList!.filter(
      ml => ml.id === mapAndKayerId
    )[0].data!;
    data.isUse = checked;
    await this.sceneAndLayerCC.update(mapAndKayerId, data);
  }

  @LifeCycle
  private async mounted() {
    this.sceneAndLayerInfoList = this.sceneAndLayerList
      .filter(map => map.data!.sceneId === this.sceneId)
      .sort((m1, m2) => {
        if (m1.order < m2.order) return -1;
        if (m1.order > m2.order) return 1;
        return 0;
      });
    this.layerInfoList = this.sceneAndLayerInfoList
      .map(ml => this.layerList.filter(l => l.id === ml.data!.layerId)[0])
      .filter(l => l);
  }

  @VueEvent
  private onMouseHover(isMouseOn: boolean) {
    this.$emit("hover", isMouseOn);
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.view-check {
  @include flex-box(row, center, center);
  width: 1.5em;
  height: 1.5em;
  border: 1px solid black;
  border-radius: 50%;
  box-sizing: border-box;
  cursor: pointer;

  input {
    display: none !important;
  }
}

$border-color: green;

.layer-container {
  @include inline-flex-box(column, stretch, flex-start);
  border: 1px solid $border-color;
  margin-right: 1em;
  overflow: visible;

  > label {
    background-color: $border-color;
    color: white;
    height: 2em;
    line-height: 2em;
    padding: 0 0.2rem;
  }
}

.layer-info {
  @include flex-box(row, space-between, center);
  background-color: white;
  height: 2em;
  line-height: 2em;
  padding: 0 0.2rem;
  position: relative;
  border-bottom: 1px solid $border-color;
  cursor: pointer;

  &.selected {
    &:not(.unuse) {
      background-color: lightyellow;
    }

    &:after {
      content: "";
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      transform: translateX(100%) translateY(-1px);
      border: transparent calc(1em + 1px) solid;
      border-left-color: $border-color;
      box-sizing: border-box;
    }
  }

  &.unuse {
    background-color: lightgray;
  }
}
</style>
