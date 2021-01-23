<template>
  <div class="container" ref="window-container">
    <dice-symbol-info-form
      :windowKey="windowKey"
      v-if="isMounted"
      :isAdd="false"
      initTabTarget="background"
      :name.sync="name"
      :color.sync="color"
      :tag.sync="tag"
      :size.sync="size"
      :layerKey.sync="layerKey"
      :diceTypeKey.sync="subTypeKey"
      :pips.sync="subTypeValue"
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
import DiceSymbolInfoForm from "@/app/basic/object/dice-symbol/DiceSymbolInfoForm.vue";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import GameObjectManager from "@/app/basic/GameObjectManager";
import MapObjectEditWindowVue from "@/app/core/window/MapObjectEditWindowVue";

@Component({ components: { ButtonArea, DiceSymbolInfoForm } })
export default class DiceSymbolEditWindow extends MapObjectEditWindowVue {
  protected hasOtherText: boolean = false;
  protected sizeType: "size" | "wh" = "size";
  protected color: string = "rgba(255, 255, 255, 1)";

  @LifeCycle
  private created() {
    const diceTypeList = GameObjectManager.instance.diceTypeList;
    const diceType =
      diceTypeList.find(dt => dt.data!.faceNum === "6") || diceTypeList[0];
    this.subTypeKey = diceType.key;
    const pipsList = GameObjectManager.instance.diceAndPipsList
      .filter(dap => dap.data!.diceTypeKey === this.subTypeKey)
      .map(dap => dap.data!.pips);
    this.subTypeValue = pipsList.find(p => p === "1") || pipsList[0];
  }
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
