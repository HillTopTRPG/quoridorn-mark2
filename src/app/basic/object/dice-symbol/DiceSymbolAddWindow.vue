<template>
  <div class="container" ref="window-container">
    <dice-symbol-info-form
      :windowKey="windowKey"
      :isAdd="true"
      initTabTarget="background"
      :name.sync="name"
      :color.sync="color"
      :tag.sync="tag"
      :size.sync="size"
      :layerKey.sync="layerKey"
      :diceTypeKey.sync="subTypeKey"
      :pips.sync="subTypeValue"
      @drag-start="dragStart"
      @drag-end="dragEnd"
    />
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import MapObjectAddWindowVue from "@/app/core/window/MapObjectAddWindowVue";
import DiceSymbolInfoForm from "@/app/basic/object/dice-symbol/DiceSymbolInfoForm.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { SceneObjectType } from "@/@types/store-data-optional";

@Component({ components: { DiceSymbolInfoForm } })
export default class DiceSymbolAddWindow extends MapObjectAddWindowVue {
  protected type: SceneObjectType = "dice-symbol";
  protected textureType: "color" | "image" = "color";
  protected hasOtherText: boolean = false;
  protected sizeType: "size" | "wh" = "size";
  private diceTypeList = GameObjectManager.instance.diceTypeList;
  private diceAndPipsList = GameObjectManager.instance.diceAndPipsList;

  @LifeCycle
  private created() {
    this.color = "rgba(255, 255, 255, 1)";
    const diceType =
      this.diceTypeList.find(dt => dt.data!.faceNum === "6") ||
      this.diceTypeList[0];
    this.subTypeKey = diceType.key;
    const pipsList = this.diceAndPipsList
      .filter(dap => dap.data!.diceTypeKey === this.subTypeKey)
      .map(dap => dap.data!.pips);
    this.subTypeValue = pipsList.find(p => p === "1") || pipsList[0];
  }

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
