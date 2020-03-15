<template>
  <div class="card-deck-chooser-component deck-set-container">
    <div class="title" v-t="title"></div>
    <div
      class="deck-set"
      :class="{ selected: isSelectedDeck(deck.id) }"
      v-for="deck in deckList"
      :key="deck.id"
      @click="onClickPresetDeck(deck.id)"
      @mouseenter="onHoverPresetDeck(deck.id, true)"
      @mouseleave="onHoverPresetDeck(deck.id, false)"
    >
      <span class="title">{{ deck.title }}</span>
      <card-component
        class="deck-set-card"
        v-for="cardMeta in getSampleList(deck.cardMetaList)"
        :key="cardMeta.id"
        :cardMeta="cardMeta"
        :isTurnOff="!isSelectedDeck(deck.id)"
      />
      <img
        v-if="isSelectedDeck(deck.id)"
        class="select-mark"
        src="http://quoridorn.com/img/mascot/normal/mascot_normal.png"
        alt="こっぺりん"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import VueEvent from "@/app/core/decorator/VueEvent";
import { Prop, Watch } from "vue-property-decorator";
import { CardMeta } from "@/@types/gameObject";
import CardComponent from "@/app/basic/card/CardComponent.vue";
import { StoreUseData } from "@/@types/store";

type DeckInfo = {
  id: string;
  title: string;
  cardMetaList: StoreUseData<CardMeta>[];
};

@Component({
  components: { CardComponent }
})
export default class CardDeckChooserComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private title!: string;

  @Prop({ type: Array, required: true })
  private deckList!: DeckInfo[];

  // selectedDeckIdList
  @Prop({ type: Array, required: true })
  private selectedDeckIdList!: string[];
  private selectedDeckIdListVolatile: string[] = [];
  @Watch("selectedDeckIdList", { immediate: true, deep: true })
  private onChangeSelectedDeckIdList(value: string[]) {
    this.selectedDeckIdListVolatile = value;
  }
  @Watch("selectedDeckIdListVolatile", { deep: true })
  private onChangeSelectedDeckIdListVolatile(value: string[]) {
    this.$emit("update:selectedDeckIdList", value);
  }

  private hoverDeckId: string | null = null;

  @VueEvent
  private isSelectedDeck(cardDeckId: string): boolean {
    return this.selectedDeckIdList.findIndex(i => i === cardDeckId) > -1;
  }

  @VueEvent
  private onClickPresetDeck(cardDeckId: string) {
    const findIdx = this.selectedDeckIdList.findIndex(i => i === cardDeckId);
    if (findIdx === -1) {
      this.selectedDeckIdList.push(cardDeckId);
    } else {
      this.selectedDeckIdList.splice(findIdx, 1);
    }
  }

  @VueEvent
  private onHoverPresetDeck(cardDeckId: string, isHover: boolean) {
    this.hoverDeckId = isHover ? cardDeckId : null;
  }

  @VueEvent
  private getSampleList(list: StoreUseData<CardMeta>[]) {
    return list.slice(0, 3);
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.deck-set-container {
  @include flex-box(row, flex-start, flex-start, wrap);
  position: relative;
  border: 1px solid lightyellow;
  padding: 2em 1rem 1rem 0.5rem;
  box-sizing: border-box;
  min-height: calc(18em + 1.5rem);

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
}

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
