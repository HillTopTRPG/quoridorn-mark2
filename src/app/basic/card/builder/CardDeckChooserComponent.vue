<template>
  <div class="card-deck-chooser-component deck-set-container">
    <div class="title" v-t="title"></div>
    <card-deck-set-component
      v-for="deck in deckList"
      :key="deck.cardDeckBig.id"
      :deck="deck"
      :isSelected="isSelectedDeck(deck.cardDeckBig.id)"
      @select="onClickPresetDeck(deck.cardDeckBig.id)"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import { Prop } from "vue-property-decorator";
import ComponentVue from "../../../core/window/ComponentVue";
import CardDeckSetComponent, { DeckInfo } from "../CardDeckSetComponent.vue";
import VueEvent from "../../../core/decorator/VueEvent";

@Component({
  components: { CardDeckSetComponent }
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
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

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
</style>
