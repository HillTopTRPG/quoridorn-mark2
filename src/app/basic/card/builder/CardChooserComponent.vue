<template>
  <div class="card-chooser-component card-container">
    <div class="title" v-t="title"></div>

    <div class="operation-area">
      <fieldset>
        <legend v-t="'label.search'"></legend>
        <div class="fieldset-contents">
          <input
            type="text"
            class="search-name"
            :value="searchText"
            @input="searchText = $event.target.value"
            :placeholder="$t('label.search-name-box')"
            @keydown.enter.prevent.stop
            @keyup.enter.prevent.stop
            @keydown.229.prevent.stop
            @keyup.229.prevent.stop
          />

          <card-search-count-chooser v-model="searchCountList" />
        </div>
      </fieldset>

      <fieldset>
        <legend v-t="'label.operation'"></legend>
        <div class="fieldset-contents">
          <label class="set-card-count-box">
            <span v-t="'label.all'"></span>
            <input
              type="number"
              class="search-name"
              :value="targetCount"
              @input="targetCount = $event.target.valueAsNumber"
              @keydown.enter.prevent.stop
              @keyup.enter.prevent.stop
              @keydown.229.prevent.stop
              @keyup.229.prevent.stop
            />
            <ctrl-button @click="setCardCount()">
              <span v-t="'button.execution'"></span>
            </ctrl-button>
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend v-t="'label.resist'"></legend>
        <div class="fieldset-contents">
          <label class="name-box">
            <span v-t="'label.name'"></span>
            <input
              type="text"
              :value="cardDeckNameVolatile"
              @input="cardDeckNameVolatile = $event.target.value"
              @keydown.enter.prevent.stop
              @keyup.enter.prevent.stop
              @keydown.229.prevent.stop
              @keyup.229.prevent.stop
            />
            <ctrl-button @click="$emit('resist')">
              <span v-t="'label.resist'"></span>
            </ctrl-button>
          </label>
        </div>
      </fieldset>
    </div>

    <div
      class="card-wrap"
      :class="{ selected: getSelectedCount(card.key) > 0 }"
      v-for="card in useCardList"
      :key="card.key"
      @mouseenter="onHoverCard(card, true, $event.target)"
      @mouseleave="onHoverCard(card, false, $event.target)"
    >
      <span class="title">{{ card.data.name }}</span>
      <card-component
        class="card card-face-back"
        :cardMeta="card"
        :size="getCardSize(card.data)"
        :isTurnOff="true"
      />
      <card-component
        class="card card-face-front"
        :cardMeta="card"
        :size="getCardSize(card.data)"
        :isTurnOff="false"
      />
      <div class="operation-box">
        <s-button class="minus-btn" icon="minus" @click="onMinusCard(card)" />
        <div class="count">{{ getSelectedCount(card.key) }}</div>
        <s-button class="plus-btn" icon="plus" @click="onPlusCard(card)" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import { Prop, Watch } from "vue-property-decorator";
import {
  createRectangle,
  createSize
} from "@/app/core/utility/CoordinateUtility";
import ComponentVue from "../../../core/window/ComponentVue";
import CardSearchCountChooser from "../../common/components/CardSearchCountChooser.vue";
import CtrlButton from "../../../core/component/CtrlButton.vue";
import SButton from "../../common/components/SButton.vue";
import { CardMetaStore } from "@/@types/store-data";
import CardComponent from "../CardComponent.vue";
import VueEvent from "../../../core/decorator/VueEvent";

export type CardCountInfo = {
  key: string;
  count: number;
};

@Component({
  components: {
    CardSearchCountChooser,
    SButton,
    CardComponent,
    CtrlButton
  }
})
export default class CardChooserComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private title!: string;

  @Prop({ type: Array, required: true })
  private cardList!: StoreData<CardMetaStore>[];

  // selectedCardIdList
  @Prop({ type: Array, required: true })
  private selectedCardList!: CardCountInfo[];

  // cardDeckName
  @Prop({ type: String, required: true })
  private cardDeckName!: string;
  private cardDeckNameVolatile: string = "";
  @Watch("cardDeckName", { immediate: true })
  private onChangeCardDeckName(value: string) {
    this.cardDeckNameVolatile = value;
  }
  @Watch("cardDeckNameVolatile")
  private onChangeCardDeckNameVolatile(value: string) {
    this.$emit("update:cardDeckName", value);
  }

  private hoverCardId: string | null = null;

  private searchText: string = "";
  private searchCountList: string[] = ["0", "1", "2", "3", "4", "more"];
  private targetCount: number = 1;

  private get useCardList() {
    const regExp = this.searchText ? new RegExp(this.searchText) : null;
    return this.cardList.filter(c => {
      if (regExp) {
        const name = c.data!.name;
        if (!name.match(regExp)) return false;
      }
      const count = this.getSelectedCount(c.key);
      return (
        (count > 4 && this.searchCountList.indexOf("more") > -1) ||
        this.searchCountList.indexOf(count.toString(10)) > -1
      );
    });
  }

  @VueEvent
  private getCardSize(cardMeta: CardMetaStore) {
    return createSize(cardMeta.width, cardMeta.height);
  }

  @VueEvent
  private setCardCount() {
    this.useCardList.forEach(c => {
      const scIndex = this.selectedCardList.findIndex(sc => sc.key === c.key);
      if (scIndex === -1) {
        // 見つからなかった
        if (this.targetCount > 0) {
          this.selectedCardList.push({
            key: c.key,
            count: this.targetCount
          });
        } else {
          // Nothing.
        }
      } else {
        // 見つかった
        if (this.targetCount > 0) {
          this.selectedCardList[scIndex].count = this.targetCount;
        } else {
          // Nothing.
          this.selectedCardList.splice(scIndex, 1);
        }
      }
    });
  }

  @VueEvent
  private getSelectedCount(cardId: string): number {
    const info = this.selectedCardList.filter(c => c.key === cardId)[0];
    return info ? info.count : 0;
  }

  @VueEvent
  private onPlusCard(cardMeta: StoreData<CardMetaStore>) {
    const findIndex = this.selectedCardList.findIndex(
      c => c.key === cardMeta.key
    );
    if (findIndex === -1) {
      this.selectedCardList.push({
        key: cardMeta.key,
        count: 1
      });
    } else {
      this.selectedCardList[findIndex].count++;
    }
  }

  @VueEvent
  private onMinusCard(cardMeta: StoreData<CardMetaStore>) {
    const findIndex = this.selectedCardList.findIndex(
      c => c.key === cardMeta.key
    );
    if (findIndex === -1) return;

    const info = this.selectedCardList[findIndex];
    if (info.count > 1) info.count--;
    else this.selectedCardList.splice(findIndex, 1);
  }

  @VueEvent
  private onHoverCard(
    card: StoreData<CardMetaStore>,
    isHover: boolean,
    elm: HTMLElement
  ) {
    this.hoverCardId = isHover ? card.key : null;
    const rect: any = elm.getBoundingClientRect();
    const r = createRectangle(rect.x, rect.y, rect.width, rect.height);
    this.$emit("hover-card", card, isHover, r);
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.card-container {
  @include flex-box(row, flex-start, flex-start, wrap);
  position: relative;
  border: 1px solid lightyellow;
  padding: 2em 1rem 1rem 0.5rem;
  box-sizing: border-box;
  min-height: calc(18em + 1rem);
  overflow-y: scroll;
  height: 100%;

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
    z-index: 2;
  }
}

.operation-area {
  @include flex-box(row, flex-start, flex-start);
  width: 100%;
}

fieldset {
  background-color: white;
  border: none;
  padding: calc(1em + 2px) 0.5rem 0.5rem;
  margin: 0 0 0 0.5rem;

  legend {
    @include inline-flex-box(row, flex-start, center);
    background-color: inherit;
    height: 2em;
    transform: translateY(50%);
    font-weight: bold;
  }

  .fieldset-contents {
    @include inline-flex-box(column, stretch, flex-start);
  }

  .set-card-count-box {
    @include inline-flex-box(row, flex-start, center);
    input {
      width: 3em;
    }
  }
}

.search-name {
  @include flex-box(row, flex-start, center);
  font-size: inherit;
  height: 2em;
  min-height: 2em;
}

.card-wrap {
  position: relative;
  border: 3px solid white;
  box-sizing: border-box;
  margin-left: 0.5rem;
  margin-top: 0.5rem;
  width: 11em;
  height: 14em;
  overflow: hidden;
  background-color: rgba(0, 0, 0, 0.5);

  .card {
    position: absolute;
    top: 30%;
    left: 40%;
    transform-origin: bottom center;
    z-index: 1;
    transition: all 0.1s ease-in-out;

    &:nth-of-type(1) {
      transform: rotate(-10deg) translateY(-5%) translateX(-35%);
    }

    &:nth-of-type(2) {
      transform: rotate(10deg) translateY(-12%) translateX(-35%);
    }
  }

  &:hover {
    border-color: var(--uni-color-skyblue);

    .title {
      border-color: var(--uni-color-skyblue);
    }

    .card {
      &:nth-of-type(1) {
        transform: rotate(-10deg) translateY(-9%) translateX(-35%);
      }

      &:nth-of-type(2) {
        transform: rotate(10deg) translateY(-16%) translateX(-35%);
      }
    }
  }
  &.selected {
    border-color: var(--uni-color-blue);

    .title {
      border-color: var(--uni-color-blue);
    }

    .count {
      background-color: var(--uni-color-cream);
      color: var(--uni-color-blue);
    }
  }

  .operation-box {
    @include flex-box(row, space-around, center);
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 2;
  }

  .count {
    @include flex-box(row, center, center);
    width: 1.8em;
    height: 1.8em;
    font-size: 200%;
    font-weight: bold;
    border: 2px solid var(--uni-color-orange);
    border-radius: 50%;
    box-sizing: border-box;
    background-color: var(--uni-color-light-gray);
    color: var(--uni-color-gray);
  }
}
</style>
