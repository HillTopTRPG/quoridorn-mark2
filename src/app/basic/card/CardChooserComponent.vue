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
    </div>

    <div
      class="card-wrap"
      :class="{ selected: getSelectedCount(card.id) > 0 }"
      v-for="card in useCardList"
      :key="card.id"
      @mouseenter="onHoverCard(card, true, $event.target)"
      @mouseleave="onHoverCard(card, false, $event.target)"
    >
      <span class="title">{{ card.data.name }}</span>
      <card-component
        class="card card-face-back"
        :cardMeta="card"
        :isTurnOff="true"
      />
      <card-component
        class="card card-face-front"
        :cardMeta="card"
        :isTurnOff="false"
      />
      <div class="operation-box">
        <s-button class="minus-btn" icon="minus" @click="onMinusCard(card)" />
        <div class="count">{{ getSelectedCount(card.id) }}</div>
        <s-button class="plus-btn" icon="plus" @click="onPlusCard(card)" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import { Prop, Watch } from "vue-property-decorator";
import { CardMeta, OtherTextViewInfo } from "@/@types/gameObject";
import CardComponent from "@/app/basic/card/CardComponent.vue";
import { StoreUseData } from "@/@types/store";
import SButton from "@/app/basic/common/components/SButton.vue";
import CardSearchCountChooser from "@/app/basic/common/components/CardSearchCountChooser.vue";
import { createPoint } from "@/app/core/utility/CoordinateUtility";

export type CardCountInfo = {
  id: string;
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
  private cardList!: StoreUseData<CardMeta>[];

  // selectedCardIdList
  @Prop({ type: Array, required: true })
  private selectedCardList!: CardCountInfo[];
  private selectedCardListVolatile: CardCountInfo[] = [];
  @Watch("selectedCardList", { immediate: true, deep: true })
  private onChangeSelectedCardList(value: CardCountInfo[]) {
    this.selectedCardListVolatile = value;
  }
  @Watch("selectedCardListVolatile", { deep: true })
  private onChangeSelectedCardListVolatile(value: CardCountInfo[]) {
    this.$emit("update:selectedCardList", value);
  }

  // otherTextViewInfo
  @Prop({ type: Object, default: null })
  private otherTextViewInfo!: OtherTextViewInfo | null;
  private otherTextViewInfoVolatile: OtherTextViewInfo | null = null;
  @Watch("otherTextViewInfo", { immediate: true })
  private onChangeOtherTextViewInfo(value: OtherTextViewInfo | null) {
    this.otherTextViewInfoVolatile = value;
  }
  @Watch("otherTextViewInfoVolatile")
  private onChangeOtherTextViewInfoVolatile(value: OtherTextViewInfo | null) {
    this.$emit("update:otherTextViewInfo", value);
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
      const count = this.getSelectedCount(c.id!);
      return (
        (count > 4 && this.searchCountList.indexOf("more") > -1) ||
        this.searchCountList.indexOf(count.toString(10)) > -1
      );
    });
  }

  @VueEvent
  private setCardCount() {
    this.useCardList.forEach(c => {
      const scIndex = this.selectedCardList.findIndex(sc => sc.id === c.id);
      if (scIndex === -1) {
        // 見つからなかった
        if (this.targetCount > 0) {
          this.selectedCardList.push({
            id: c.id!,
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
    const info = this.selectedCardList.filter(c => c.id === cardId)[0];
    return info ? info.count : 0;
  }

  @VueEvent
  private onPlusCard(cardMeta: StoreUseData<CardMeta>) {
    const findIdx = this.selectedCardList.findIndex(c => c.id === cardMeta.id);
    if (findIdx === -1) {
      this.selectedCardList.push({
        id: cardMeta.id!,
        count: 1
      });
    } else {
      this.selectedCardList[findIdx].count++;
    }
  }

  @VueEvent
  private onMinusCard(cardMeta: StoreUseData<CardMeta>) {
    const findIdx = this.selectedCardList.findIndex(c => c.id === cardMeta.id);
    if (findIdx === -1) return;

    const info = this.selectedCardList[findIdx];
    if (info.count > 1) info.count--;
    else this.selectedCardList.splice(findIdx, 1);
  }

  @VueEvent
  private onHoverCard(
    card: StoreUseData<CardMeta>,
    isHover: boolean,
    elm: HTMLElement
  ) {
    this.hoverCardId = isHover ? card.id! : null;
    if (isHover) {
      const rect = elm.getBoundingClientRect();
      this.otherTextViewInfoVolatile = {
        type: "card-meta",
        docId: card.id!,
        text: card.data!.text || "このカードにテキストはありません",
        point: createPoint(rect.x, rect.y),
        width: rect.width,
        height: rect.height,
        isFix: true
      };
    } else {
      this.otherTextViewInfoVolatile = null;
    }
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

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
