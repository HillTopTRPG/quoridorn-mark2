<template>
  <div class="container" ref="window-container">
    <chit-info-form
      :windowKey="windowKey"
      :isAdd="true"
      initTabTarget="image"
      :name.sync="name"
      :tag.sync="tag"
      :otherTextList.sync="otherTextList"
      :width.sync="width"
      :height.sync="height"
      :mediaKey.sync="mediaKey"
      :mediaTag.sync="mediaTag"
      :direction.sync="direction"
      :backgroundSize.sync="backgroundSize"
      :layerKey.sync="layerKey"
      @drag-start="dragStart"
      @drag-end="dragEnd"
    />
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import ChitInfoForm from "./ChitInfoForm.vue";
import { SceneObjectType } from "@/@types/store-data-optional";
import MapObjectAddWindowVue from "@/app/core/window/MapObjectAddWindowVue";

@Component({ components: { ChitInfoForm } })
export default class ChitAddWindow extends MapObjectAddWindowVue {
  protected type: SceneObjectType = "chit";
  protected textureType: "color" | "image" = "image";
  protected hasOtherText: boolean = true;
  protected sizeType: "size" | "wh" = "wh";

  @LifeCycle
  public async mounted() {
    await this.initExtend("character");
    this.mediaTag = this.$t("type.character")!.toString();
  }

  @Watch("mediaKey", { immediate: true })
  private onChangeImageDocKey() {
    this.windowInfo.message = this.$t(
      this.mediaKey ? "message.drag-piece" : "message.choose-image"
    )!.toString();
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
