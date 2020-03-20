<template>
  <div
    class="deck-set"
    :class="{ selected: isSelected }"
    @click="$emit('select')"
  >
    <span class="title">{{ deck.cardDeckBig.data.name }}</span>
    <card-component
      class="deck-set-card"
      v-for="cardMeta in getSampleList(deck.cardMetaList)"
      :key="cardMeta.id"
      :cardMeta="cardMeta"
      :isTurnOff="!isSelected"
    />
    <img
      v-if="isSelected"
      class="select-mark"
      src="http://quoridorn.com/img/mascot/normal/mascot_normal.png"
      alt="こっぺりん"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import VueEvent from "@/app/core/decorator/VueEvent";
import { Prop, Watch } from "vue-property-decorator";
import { CardDeckBig, CardMeta } from "@/@types/gameObject";
import CardComponent from "@/app/basic/card/CardComponent.vue";
import { StoreUseData } from "@/@types/store";

export type DeckInfo = {
  cardDeckBig: StoreUseData<CardDeckBig>;
  cardMetaList: StoreUseData<CardMeta>[];
};

@Component({
  components: { CardComponent }
})
export default class CardDeckChooserComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private deck!: DeckInfo;

  @Prop({ type: Boolean, required: true })
  private isSelected!: boolean;

  @VueEvent
  private getSampleList(list: StoreUseData<CardMeta>[]) {
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
  width: 16em;
  height: 16em;
  overflow: hidden;
  background-color: rgba(0, 0, 0, 0.5);
  cursor: pointer;

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
  }

  .deck-set-card {
    position: absolute;
    top: 30%;
    left: 60%;
    transform-origin: bottom center;
    z-index: 1;
    transition: all 0.1s ease-in-out;

    &:nth-of-type(1) {
      transform: rotate(-39deg) translateY(-5%) translateX(-35%);
    }

    &:nth-of-type(2) {
      transform: rotate(-12deg) translateY(-12%) translateX(-35%);
    }

    &:nth-of-type(3) {
      transform: rotate(15deg) translateY(-19%) translateX(-35%);
    }
  }

  &:hover {
    border-color: var(--uni-color-skyblue);

    .title {
      border-color: var(--uni-color-skyblue);
    }

    .deck-set-card {
      &:nth-of-type(1) {
        transform: rotate(-39deg) translateY(-9%) translateX(-35%);
      }

      &:nth-of-type(2) {
        transform: rotate(-12deg) translateY(-16%) translateX(-35%);
      }

      &:nth-of-type(3) {
        transform: rotate(15deg) translateY(-23%) translateX(-35%);
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
