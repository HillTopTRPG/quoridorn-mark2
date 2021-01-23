<template>
  <div class="container" ref="window-container">
    <map-marker-info-form
      :windowKey="windowKey"
      :isAdd="true"
      initTabTarget="background"
      :name.sync="name"
      :text.sync="text"
      :color.sync="color"
      :tag.sync="tag"
      :isHideSubType.sync="isHideSubType"
      :otherTextList.sync="otherTextList"
      :width.sync="width"
      :height.sync="height"
      :layerKey.sync="layerKey"
      @drag-start="dragStart"
      @drag-end="dragEnd"
    />
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import MapObjectAddWindowVue from "@/app/core/window/MapObjectAddWindowVue";
import MapMarkerInfoForm from "@/app/basic/object/map-marker/MapMarkerInfoForm.vue";
import { SceneObjectType } from "@/@types/store-data-optional";

@Component({ components: { MapMarkerInfoForm } })
export default class MapMarkerAddWindow extends MapObjectAddWindowVue {
  protected type: SceneObjectType = "map-marker";
  protected textureType: "color" | "image" = "color";
  protected hasOtherText: boolean = true;
  protected sizeType: "size" | "wh" = "wh";

  @LifeCycle
  public async mounted() {
    await this.initExtend();
    this.windowInfo.message = this.$t("message.drag-piece")!.toString();
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.container {
  display: grid;
  grid-template-rows: 12em 1fr;
  grid-template-columns: 12em 1fr;
  width: 100%;
  height: 100%;
}
</style>
