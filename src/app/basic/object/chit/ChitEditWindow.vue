<template>
  <div class="container" ref="window-container">
    <chit-info-form
      :windowKey="windowKey"
      v-if="isMounted"
      :isAdd="false"
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
import ChitInfoForm from "@/app/basic/object/chit/ChitInfoForm.vue";
import MapObjectEditWindowVue from "@/app/core/window/MapObjectEditWindowVue";

@Component({ components: { ButtonArea, ChitInfoForm } })
export default class ChitEditWindow extends MapObjectEditWindowVue {
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
