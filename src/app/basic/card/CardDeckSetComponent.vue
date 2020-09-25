<template>
  <div
    class="deck-set"
    :class="{ selected: isSelected }"
    :style="{
      width: `${size}em`,
      height: `${size}em`
    }"
    @click="$emit('select')"
    ref="elm"
  >
    <span class="title">{{ deck.cardDeckBig.data.name }}</span>
    <card-component
      class="deck-set-card"
      v-for="cardMeta in getSampleList(deck.cardMetaList)"
      :key="cardMeta.key"
      :cardMeta="cardMeta"
      :size="cardSize"
      :isTurnOff="!isSelected"
    />
    <img
      v-if="isSelected"
      class="select-mark"
      src="https://quoridorn.com/img/mascot/normal/mascot_normal.png"
      alt="こっぺりん"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import { Prop } from "vue-property-decorator";
import { Size } from "address";
import { createSize } from "../../core/utility/CoordinateUtility";
import ComponentVue from "../../core/window/ComponentVue";
import { CardDeckBig, CardMeta } from "@/@types/gameObject";
import { getCssPxNum } from "../../core/css/Css";
import VueEvent from "../../core/decorator/VueEvent";
import CardComponent from "./CardComponent.vue";
import { StoreObj } from "@/@types/store";

export type DeckInfo = {
  cardDeckBig: StoreObj<CardDeckBig>;
  cardMetaList: StoreObj<CardMeta>[];
};

@Component({
  components: { CardComponent }
})
export default class CardDeckSetComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private deck!: DeckInfo;

  @Prop({ type: Boolean, required: true })
  private isSelected!: boolean;

  @Prop({ type: Number, default: 16 })
  private size!: number;

  @VueEvent
  private get cardSize(): Size {
    const fontSize = getCssPxNum("font-size", this.elm);
    return createSize(
      (this.size * fontSize * 4) / 10,
      (this.size * fontSize * 6) / 10
    );
  }

  private get elm(): HTMLDivElement {
    return this.$refs.elm as HTMLDivElement;
  }

  @VueEvent
  private getSampleList(list: StoreObj<CardMeta>[]) {
    return list.slice(0, 3);
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.deck-set {
  position: relative;
  border: 3px solid white;
  box-sizing: border-box;
  margin-left: 0.5rem;
  margin-top: 0.5rem;
  overflow: hidden;
  background-color: rgba(0, 0, 0, 0.5);
  cursor: pointer;
  transform-origin: bottom center;

  .title {
    @include inline-flex-box(row, flex-start, center);
    position: absolute;
    left: 0;
    top: 0;
    padding: 0 0.3rem;
    background-color: white;
    border-right: 2px solid white;
    border-bottom: 2px solid white;
    box-sizing: border-box;
    height: 2em;
    font-weight: bold;
    z-index: 1;
  }

  .deck-set-card {
    position: absolute;
    transform-origin: bottom center;
    z-index: 0;
    transition: all 0.1s ease-in-out;

    &:nth-of-type(1) {
      bottom: 0;
      left: 50%;
      transform: translate(-50%) rotate(-39deg);
    }

    &:nth-of-type(2) {
      bottom: 8%;
      left: 60%;
      transform: translate(-50%) rotate(-12deg);
    }

    &:nth-of-type(3) {
      bottom: 16%;
      left: 70%;
      transform: translate(-50%) rotate(15deg);
    }
  }

  &:hover {
    border-color: var(--uni-color-skyblue);

    .title {
      border-color: var(--uni-color-skyblue);
    }

    .deck-set-card {
      &:nth-of-type(1) {
        transform: translateX(-50%) rotate(-39deg) translateY(-10%);
      }

      &:nth-of-type(2) {
        transform: translateX(-50%) rotate(-12deg) translateY(-10%);
      }

      &:nth-of-type(3) {
        transform: translateX(-50%) rotate(15deg) translateY(-10%);
      }
    }
  }
  &.selected {
    border-color: var(--uni-color-blue);

    .title {
      border-color: var(--uni-color-blue);
    }
  }

  .select-mark {
    position: absolute;
    z-index: 2;
    right: 0;
    bottom: 0;
    width: 40%;
    height: 40%;
  }
}
</style>
