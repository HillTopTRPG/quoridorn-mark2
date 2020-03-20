<template>
  <div id="card-deck-builder" ref="elm">
    <div class="tool-title" v-t="'card-deck-builder.title'"></div>
    <div class="tool-description" v-t="'card-deck-builder.description'"></div>
    <span class="icon-cross close-btn" @click="rollback()"></span>

    <!-- 進捗欄 -->
    <div class="progress-area">
      <div
        class="process"
        v-t="`${ml}.choose-base-deck`"
        @click="statusNum = 1"
        :class="{ current: statusNum === 1 }"
      ></div>
      <div class="process-separator"></div>
      <div
        class="process"
        v-t="`${ml}.choose-card`"
        @click="statusNum = 2"
        :class="{ current: statusNum === 2 }"
      ></div>
      <div class="process-separator"></div>
      <div
        class="process"
        v-t="`${ml}.confirm`"
        @click="statusNum = 3"
        :class="{
          disabled: selectedDeckIdList.length === 0,
          current: statusNum === 3
        }"
      ></div>
    </div>

    <div
      class="contents choose-base-deck"
      :class="{ 'out-left': statusNum > 1 }"
    >
      <!-- ベース山札の選択 -->
      <card-deck-chooser-component
        class="deck-set-choose-preset"
        title="card-deck-builder.header.deck-set-preset"
        :deckList="presetDeckList"
        :selectedDeckIdList.sync="selectedDeckIdList"
      />

      <!-- ベース山札の選択 -->
      <card-deck-chooser-component
        class="deck-set-choose-room"
        title="card-deck-builder.header.deck-set-room"
        :deckList="dbDeckList"
        :selectedDeckIdList.sync="selectedDeckIdList"
      />
    </div>

    <div
      class="contents choose-card"
      :class="{ 'out-right': statusNum < 2, 'out-left': statusNum > 2 }"
    >
      <card-chooser-component
        class="card-choose"
        title="card-deck-builder.header.card-list"
        :cardList="cardList"
        :selectedCardList.sync="selectedCardList"
        :otherTextViewInfo.sync="otherTextViewInfo"
      />
    </div>

    <div class="contents confirm" :class="{ 'out-right': statusNum < 3 }">
      これは確認画面
    </div>

    <text-frame
      class="text-frame"
      :otherTextViewInfo="otherTextViewInfo"
      @hide="otherTextHide"
      v-if="otherTextViewInfo"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import ThrowCharSelect from "@/app/basic/common/components/select/ThrowCharSelect.vue";
import ComponentVue from "@/app/core/window/ComponentVue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import { Prop } from "vue-property-decorator";
import {
  CardDeckBig,
  CardMeta,
  CardYamlInfo,
  InputCardInfo,
  OtherTextViewInfo
} from "@/@types/gameObject";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import { loadYaml } from "@/app/core/utility/FileUtility";
import TaskManager from "@/app/core/task/TaskManager";
import { ModeInfo } from "mode";
import { createEmptyStoreUseData, getSrc } from "@/app/core/utility/Utility";
import CardComponent from "@/app/basic/card/CardComponent.vue";
import urljoin from "url-join";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { StoreUseData } from "@/@types/store";
import CardDeckChooserComponent from "@/app/basic/card/CardDeckChooserComponent.vue";
import CardChooserComponent, {
  CardCountInfo
} from "@/app/basic/card/CardChooserComponent.vue";
import TextFrame from "@/app/basic/card/TextFrame.vue";

const cardDeckYamlPath = "/static/conf/deck.yaml";

type DeckInfo = {
  cardDeckBig: StoreUseData<CardDeckBig>;
  cardMetaList: StoreUseData<CardMeta>[];
};

@Component({
  components: {
    TextFrame,
    CardChooserComponent,
    CardDeckChooserComponent,
    CardComponent,
    CtrlButton,
    ThrowCharSelect
  }
})
export default class CardDeckBuilder extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, default: "" })
  private cardDeckId!: string;

  private ml: string = "card-deck-builder.message-list";

  private cardDeckBigList = GameObjectManager.instance.cardDeckBigList;
  private cardMetaList = GameObjectManager.instance.cardMetaList;

  private presetDeckList: DeckInfo[] = [];
  private dbDeckList: DeckInfo[] = [];

  private otherTextViewInfo: OtherTextViewInfo | null = null;

  private get cardList(): StoreUseData<CardMeta>[] {
    const resultList: StoreUseData<CardMeta>[] = [];

    this.presetDeckList
      .concat(this.dbDeckList)
      .filter(
        deck =>
          this.selectedDeckIdList.findIndex(
            idx => idx === deck.cardDeckBig.id
          ) > -1
      )
      .forEach(deck => {
        resultList.push(...deck.cardMetaList);
      });
    return resultList;
  }

  private selectedDeckIdList: string[] = [];
  private selectedCardList: CardCountInfo[] = [];
  private statusNum: number = 1;

  @LifeCycle
  private async created() {
    // DBデッキリストを参照
    this.cardDeckBigList.forEach(cardDeckBig => {
      const cardMetaList: StoreUseData<CardMeta>[] = this.cardMetaList.filter(
        cm => cm.owner === cardDeckBig.id
      );
      this.dbDeckList.push({ cardDeckBig, cardMetaList });
    });

    // プリセットデッキの読み込み
    (await loadYaml<CardYamlInfo[]>(cardDeckYamlPath)).forEach(
      (presetDeck: CardYamlInfo, deckIdx: number) => {
        const name = presetDeck.title;
        const id = `preset-deck-${name}-${deckIdx}`;
        const cardDeckBig = createEmptyStoreUseData(id, { name });
        const cardMetaList: StoreUseData<CardMeta>[] = presetDeck.cards.map(
          (c: InputCardInfo, cardIdx: number) => {
            const cardId = `preset-card-${deckIdx}-${cardIdx}`;
            const basePath = presetDeck.basePath || "";
            const cardMeta: CardMeta = {
              width: presetDeck.width,
              height: presetDeck.height,
              padWidth: presetDeck.padWidth || 0,
              padHeight: presetDeck.padHeight || 0,
              radius: presetDeck.radius || 0,
              frontImage: c.imagePath
                ? `url(${getSrc(urljoin(basePath, c.imagePath))})`
                : "",
              frontBackgroundColor: c.backgroundColor || "#ffffff",
              backImage: presetDeck.back.imagePath
                ? `url(${getSrc(urljoin(basePath, presetDeck.back.imagePath))})`
                : "",
              backBackgroundColor: presetDeck.back.backgroundColor || "#ffffff",
              fontColor: c.fontColor || "#000000",
              name: c.name || "",
              nameHeight: presetDeck.nameHeight || 0,
              text: c.text || "",
              textHeight: presetDeck.textHeight || 0
            };
            if (!cardMeta.radius) cardMeta.radius = 0;
            return createEmptyStoreUseData(cardId, cardMeta);
          }
        );
        this.presetDeckList.push({ cardDeckBig, cardMetaList });
      }
    );
  }

  @VueEvent
  private async commit(): Promise<void> {
    window.console.log("commit");
    await this.close();
  }

  @VueEvent
  private async rollback(): Promise<void> {
    window.console.log("rollback");
    await this.close();
  }

  @VueEvent
  private async close(): Promise<void> {
    await TaskManager.instance.ignition<ModeInfo, never>({
      type: "mode-change",
      owner: "Quoridorn",
      value: {
        type: "view-card-deck",
        value: {
          flag: "off",
          cardDeckId: ""
        }
      }
    });
  }

  @VueEvent
  private otherTextHide() {
    this.otherTextViewInfo = null;
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

#card-deck-builder {
  width: 100%;
  height: 100%;
  user-select: none;
  background-color: rgba(50, 50, 50, 0.8);
  position: relative;
  font-size: 1rem;
}

.text-frame {
  z-index: 10;
}

.tool-title,
.tool-description {
  background-color: var(--uni-color-light-gray);
  padding-left: 0.5rem;
  line-height: 1.5em;
  z-index: 20;
}

.progress-area {
  @include flex-box(row, flex-start, baseline);
  background-color: var(--uni-color-light-gray);
  padding: 0 2rem;
  font-size: 150%;
  height: 2em;
  z-index: 20;

  .process {
    cursor: pointer;
    border: 1px dashed gray;
    border-radius: 1em;
    padding: 0 0.5em;

    &.current {
      font-weight: bold;
      font-size: 120%;
      background-color: var(--uni-color-cream);
    }
  }

  .process-separator {
    @include inline-flex-box(row, flex-start, center);

    &:before {
      content: ">";
      margin: 0 1em;
    }
  }
}

.close-btn {
  @include flex-box(row, center, center);
  position: absolute;
  right: 1rem;
  top: 1rem;
  border-radius: 50%;
  border: 2px solid black;
  width: 2em;
  height: 2em;
  box-sizing: border-box;
  color: black;
  cursor: pointer;

  &:hover {
    color: var(--uni-color-cream);
    border-color: var(--uni-color-cream);
  }
}

.contents {
  position: absolute;
  top: 6em;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0 3em;
  transition: all 0.5s ease-in-out;

  &.out-left {
    transform: translateX(-100%);
  }

  &.out-right {
    transform: translateX(100%);
  }
}

.choose-base-deck {
  @include flex-box(column, stretch, space-evenly);

  .deck-set-choose-preset {
    background-image: repeating-linear-gradient(
        -30deg,
        rgba(255, 250, 250, 0.5),
        rgba(255, 250, 250, 0.5) 20px,
        rgba(84, 74, 71, 0.5) 20px,
        rgba(84, 74, 71, 0.5) 40px,
        rgba(255, 250, 250, 0.5) 40px,
        rgba(255, 250, 250, 0.5) 60px,
        rgba(255, 219, 79, 0.5) 60px,
        rgba(255, 219, 79, 0.5) 80px
      ),
      repeating-linear-gradient(
        60deg,
        rgba(255, 250, 250, 0.5),
        rgba(255, 250, 250, 0.5) 20px,
        rgba(84, 74, 71, 0.5) 20px,
        rgba(84, 74, 71, 0.5) 40px,
        rgba(255, 250, 250, 0.5) 40px,
        rgba(255, 250, 250, 0.5) 60px,
        rgba(255, 219, 79, 0.5) 60px,
        rgba(255, 219, 79, 0.5) 80px
      );
  }

  .deck-set-choose-room {
    background-image: repeating-linear-gradient(
        30deg,
        rgba(255, 250, 250, 0.5),
        rgba(255, 250, 250, 0.5) 20px,
        rgba(84, 74, 71, 0.5) 20px,
        rgba(84, 74, 71, 0.5) 40px,
        rgba(255, 250, 250, 0.5) 40px,
        rgba(255, 250, 250, 0.5) 60px,
        rgba(0, 155, 159, 0.5) 60px,
        rgba(0, 155, 159, 0.5) 80px
      ),
      repeating-linear-gradient(
        -60deg,
        rgba(255, 250, 250, 0.5),
        rgba(255, 250, 250, 0.5) 20px,
        rgba(84, 74, 71, 0.5) 20px,
        rgba(84, 74, 71, 0.5) 40px,
        rgba(255, 250, 250, 0.5) 40px,
        rgba(255, 250, 250, 0.5) 60px,
        rgba(0, 155, 159, 0.5) 60px,
        rgba(0, 155, 159, 0.5) 80px
      );
  }
}

.card-choose {
  background-size: 20px 20px;
  background-color: var(--uni-color-green);
  background-image: linear-gradient(
      45deg,
      rgba(56, 142, 60, 0.5) 25%,
      transparent 25%,
      transparent 50%,
      rgba(56, 142, 60, 0.5) 50%,
      rgba(56, 142, 60, 0.5) 75%,
      transparent 75%,
      transparent
    ),
    linear-gradient(
      -45deg,
      rgba(56, 142, 60, 0.5) 25%,
      transparent 25%,
      transparent 50%,
      rgba(56, 142, 60, 0.5) 50%,
      rgba(56, 142, 60, 0.5) 75%,
      transparent 75%,
      transparent
    );
}
</style>
