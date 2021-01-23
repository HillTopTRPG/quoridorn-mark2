<template>
  <div class="container" ref="window-container">
    <map-mask-info-form
      :windowKey="windowKey"
      v-if="isMounted"
      :isAdd="false"
      initTabTarget="background"
      :name.sync="name"
      :text.sync="text"
      :color.sync="color"
      :tag.sync="tag"
      :otherTextList.sync="otherTextList"
      :width.sync="width"
      :height.sync="height"
      :layerKey.sync="layerKey"
    />

    <button-area
      :is-commit-able="true"
      commit-text="modify"
      @commit="commit()"
      @rollback="rollback()"
    />
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import MapMaskInfoForm from "@/app/basic/object/map-mask/MapMaskInfoForm.vue";
import MapObjectEditWindowVue from "@/app/core/window/MapObjectEditWindowVue";

@Component({ components: { ButtonArea, MapMaskInfoForm } })
export default class MapMaskEditWindow extends MapObjectEditWindowVue {
  protected hasOtherText: boolean = true;
  protected sizeType: "size" | "wh" = "wh";
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.container {
  display: grid;
  grid-template-rows: 12em 1fr calc(2em + 0.5rem);
  grid-template-columns: 12em 1fr;
  width: 100%;
  height: 100%;
}

.button-area {
  grid-row: 3 / 4;
  grid-column: 1 / 3;
}
</style>
