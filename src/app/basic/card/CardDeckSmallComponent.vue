<template>
  <div class="card-deck-small" :style="cardDeckStyle" ref="elm">
    <card-component
      class="card"
      v-for="cardObject in useCardObjectList"
      :key="cardObject.id"
      :size="cardSize"
      :cardMeta="getCardMeta(cardObject)"
      :isTurnOff="cardObject.data.isTurnOff"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Prop } from "vue-property-decorator";
import { CardDeckSmall, CardObject } from "@/@types/gameObject";
import CardComponent from "@/app/basic/card/CardComponent.vue";
import { StoreUseData } from "@/@types/store";
import GameObjectManager from "@/app/basic/GameObjectManager";
import VueEvent from "@/app/core/decorator/VueEvent";
import CssManager from "@/app/core/css/CssManager";
import {
  createRectangle,
  createSize
} from "@/app/core/utility/CoordinateUtility";
import { Size } from "address";

@Component({
  components: { CardComponent }
})
export default class CardDeckSmallComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private deck!: StoreUseData<CardDeckSmall>;

  private cardObjectList = GameObjectManager.instance.cardObjectList;
  private cardMetaList = GameObjectManager.instance.cardMetaList;

  @VueEvent
  private get useCardObjectList() {
    return this.cardObjectList.filter(
      co => co.data!.cardDeckSmallId === this.deck.id
    );
  }

  @VueEvent
  private getCardMeta(cardObject: StoreUseData<CardObject>) {
    return this.cardMetaList.filter(
      cm => cm.id === cardObject.data!.cardMetaId
    )[0];
  }

  @VueEvent
  private get cardSize(): Size {
    const deckData = this.deck.data!;
    const gridSize = CssManager.instance.propMap.gridSize;
    const containerRect = createRectangle(
      gridSize * deckData.address.column,
      gridSize * deckData.address.row,
      gridSize * deckData.columns,
      gridSize * deckData.rows
    );
    return createSize(
      containerRect.width / deckData.cardWidthRatio,
      containerRect.height / deckData.cardHeightRatio
    );
  }

  @VueEvent
  private get cardDeckStyle() {
    const deckData = this.deck.data!;
    const gridSize = CssManager.instance.propMap.gridSize;
    window.console.log(JSON.stringify(deckData, null, "  "));
    const containerRect = createRectangle(
      gridSize * deckData.address.column,
      gridSize * deckData.address.row,
      gridSize * deckData.columns,
      gridSize * deckData.rows
    );
    window.console.log(JSON.stringify(containerRect, null, "  "));
    return {
      left: `${containerRect.x}px`,
      top: `${containerRect.y}px`,
      width: `${containerRect.width}px`,
      height: `${containerRect.height}px`
    };
  }

  private get firstCardMeta() {
    const cardObject = this.cardObjectList.filter(
      co => co.data!.cardDeckSmallId === this.deck.id
    )[0];
    return this.cardMetaList.filter(
      cm => cm.id === cardObject.data!.cardMetaId
    )[0];
  }

  private get elm(): HTMLDivElement {
    return this.$refs.elm as HTMLDivElement;
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.card-deck-small {
  position: absolute;
}

.card {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
