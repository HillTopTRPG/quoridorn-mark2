<template>
  <div id="card-deck-builder" ref="elm">
    <div class="tool-title" v-t="'card-deck-builder.title'"></div>
    <div
      class="tool-description"
      v-t="'card-deck-builder.description.tool'"
    ></div>
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
        v-t="`${ml}.create-card`"
        @click="statusNum = 2"
        :class="{ current: statusNum === 2 }"
      ></div>
      <div class="process-separator"></div>
      <div
        class="process"
        v-t="`${ml}.choose-card`"
        @click="statusNum = 3"
        :class="{ current: statusNum === 3 }"
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
        :selectedDeckIdList="selectedDeckIdList"
      />

      <!-- ベース山札の選択 -->
      <card-deck-chooser-component
        class="deck-set-choose-room"
        title="card-deck-builder.header.deck-set-room"
        :deckList="dbDeckList"
        :selectedDeckIdList="selectedDeckIdList"
      />
    </div>

    <div
      class="contents create-card-deck-area"
      :class="{ 'out-right': statusNum < 2, 'out-left': statusNum > 2 }"
    >
      <card-deck-create-entrance-component
        class="sub-contents card-deck-input-name"
        :class="{ 'out-bottom': subStatusNum < 1, 'out-top': subStatusNum > 1 }"
        @next="subStatusNum = 2"
        @import-direct="statusNum = 3"
        :cardList="newCardList"
        :width.sync="width"
        :height.sync="height"
        :radius.sync="radius"
        :padHorizontal.sync="padHorizontal"
        :padTop.sync="padTop"
        :padBottom.sync="padBottom"
        :frontBackgroundColor.sync="frontBackgroundColor"
        :fontColor.sync="fontColor"
        :backBackgroundColor.sync="newDeckBackColor"
        :backImageKey.sync="newDeckBackImageKey"
        :imageTag.sync="newDeckTag"
        :nameHeight.sync="nameHeight"
        :nameFontSize.sync="nameFontSize"
        :nameBackgroundColor.sync="nameBackgroundColor"
        :textHeight.sync="textHeight"
        :textFontSize.sync="textFontSize"
        :textBackgroundColor.sync="textBackgroundColor"
        :textPadding.sync="textPadding"
      />
      <card-deck-frame-setting-component
        class="sub-contents frame-setting"
        :class="{ 'out-bottom': subStatusNum < 2, 'out-top': subStatusNum > 2 }"
        @back="subStatusNum = 1"
        @next="subStatusNum = 3"
        :width.sync="width"
        :height.sync="height"
        :radius.sync="radius"
        :padHorizontal.sync="padHorizontal"
        :padTop.sync="padTop"
        :padBottom.sync="padBottom"
        :frontBackgroundColor.sync="frontBackgroundColor"
        :fontColor.sync="fontColor"
        :nameHeight.sync="nameHeight"
        :nameFontSize.sync="nameFontSize"
        :nameBackgroundColor.sync="nameBackgroundColor"
        :textHeight.sync="textHeight"
        :textFontSize.sync="textFontSize"
        :textBackgroundColor.sync="textBackgroundColor"
        :textPadding.sync="textPadding"
      />
      <card-deck-choose-back-image-component
        class="sub-contents choose-back-image"
        :class="{ 'out-bottom': subStatusNum < 3, 'out-top': subStatusNum > 3 }"
        @back="subStatusNum = 2"
        @next="subStatusNum = 4"
        :color.sync="newDeckBackColor"
        :backImageKey.sync="newDeckBackImageKey"
        :imageTag.sync="newDeckTag"
      />
      <card-deck-create-card-component
        class="sub-contents create-card"
        :class="{ 'out-bottom': subStatusNum < 4, 'out-top': subStatusNum > 4 }"
        @back="subStatusNum = 3"
        @next="statusNum = 3"
        :width="width"
        :imageTag="newDeckTag"
        :height="height"
        :padTop="padTop"
        :padHorizontal="padHorizontal"
        :padBottom="padBottom"
        :radius="radius"
        :frontBackgroundColorDefault="frontBackgroundColor"
        :backImage="newDeckBackImageKey"
        :backBackgroundColor="newDeckBackColor"
        :fontColor="fontColor"
        :nameHeight="nameHeight"
        :nameFontSizeDefault="nameFontSize"
        :nameBackgroundColorDefault="nameBackgroundColor"
        :textHeight="textHeight"
        :textFontSizeDefault="textFontSize"
        :textPaddingDefault="textPadding"
        :textBackgroundColorDefault="textBackgroundColor"
        :cardList="newCardList"
        @hover-card="hoverCard"
      />
    </div>

    <div class="contents choose-card" :class="{ 'out-right': statusNum < 3 }">
      <card-chooser-component
        class="card-choose"
        title="card-deck-builder.header.card-list"
        :cardList="cardList"
        :selectedCardList="selectedCardList"
        :cardDeckName.sync="newDeckName"
        @hover-card="hoverCard"
        @resist="resistDeck()"
      />
    </div>

    <text-frame
      class="text-frame"
      :windowKey="key"
      :otherTextViewInfo="otherTextViewInfo"
      @hide="otherTextHide"
      v-if="otherTextViewInfo"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import { Prop } from "vue-property-decorator";
import { ModeInfo } from "mode";
import urljoin from "url-join";
import ComponentVue from "../../../core/window/ComponentVue";
import LifeCycle from "../../../core/decorator/LifeCycle";
import {
  CardDeckBigStore,
  CardMetaStore,
  CardObjectStore
} from "@/@types/store-data";
import {
  createAddress,
  createPoint
} from "@/app/core/utility/CoordinateUtility";
import { createEmptyStoreUseData, getSrc } from "@/app/core/utility/Utility";
import SocketFacade from "../../../core/api/app-server/SocketFacade";
import { CardCountInfo } from "./CardChooserComponent.vue";
import { loadYaml } from "@/app/core/utility/FileUtility";
import VueEvent from "../../../core/decorator/VueEvent";
import TaskManager from "../../../core/task/TaskManager";
import GameObjectManager from "../../GameObjectManager";
import CardDeckChooserComponent from "./CardDeckChooserComponent.vue";
import CardDeckCreateEntranceComponent from "./CardDeckCreateEntranceComponent.vue";
import CardDeckChooseBackImageComponent from "./CardDeckChooseBackImageComponent.vue";
import CardDeckCreateCardComponent from "./CardDeckCreateCardComponent.vue";
import CardChooserComponent from "./CardChooserComponent.vue";
import CardDeckFrameSettingComponent from "./CardDeckFrameSettingComponent.vue";
import TextFrame from "./TextFrame.vue";
import {
  CardYamlInfo,
  InputCardInfo,
  OtherTextViewInfo,
  Rectangle
} from "@/@types/store-data-optional";
const uuid = require("uuid");

type DeckInfo = {
  cardDeckBig: StoreData<CardDeckBigStore>;
  cardMetaList: StoreData<CardMetaStore>[];
};

@Component({
  components: {
    TextFrame,
    CardDeckFrameSettingComponent,
    CardChooserComponent,
    CardDeckCreateCardComponent,
    CardDeckChooseBackImageComponent,
    CardDeckCreateEntranceComponent,
    CardDeckChooserComponent
  }
})
export default class CardDeckBuilder extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, default: "" })
  private cardDeckId!: string;

  public static DEFAULT_CARD_FRAME_PARANOIA_REBOOTED: CardMetaStore = {
    width: 200,
    height: 300,
    radius: 0,
    padHorizontal: 0,
    padTop: 140,
    padBottom: 0,
    frontBackgroundColor: "#ffffff",
    backBackgroundColor: "#ffffff",
    fontColor: "#000000",
    nameHeight: 0,
    nameFontSize: 20,
    nameBackgroundColor: "rgba(255, 255, 255, 0)",
    textHeight: 0,
    textFontSize: 11,
    textPadding: 5,
    textBackgroundColor: "rgba(255, 255, 255, 0)",
    frontImage: "",
    backImage: "",
    name: "",
    text: ""
  };

  private ml: string = "card-deck-builder.message-list";

  private cardDeckBigList = GameObjectManager.instance.cardDeckBigList;
  private cardMetaList = GameObjectManager.instance.cardMetaList;
  private mediaList = GameObjectManager.instance.mediaList;

  private presetDeckList: DeckInfo[] = [];
  private dbDeckList: DeckInfo[] = [];
  private selectedDeckKeyList: string[] = [];

  private newDeckName: string = "";
  private newDeckBackColor: string = "#ffffff";
  private newDeckBackImageKey: string = "";
  private newDeckTag: string | null = null;

  private width: number = 200;
  private height: number = 300;
  private radius: number = 0;
  private padHorizontal: number = 0;
  private padTop: number = 0;
  private padBottom: number = 0;
  private frontBackgroundColor: string = "#ffffff";
  private fontColor: string = "#000000";
  private nameHeight: number = 30;
  private nameFontSize: number = 20;
  private nameBackgroundColor: string = "rgba(255, 255, 255, 0.3)";
  private textHeight: number = 60;
  private textFontSize: number = 11;
  private textPadding: number = 0;
  private textBackgroundColor: string = "rgba(255, 255, 255, 0.3)";

  private newCardList: StoreData<CardMetaStore>[] = [];

  private selectedCardList: CardCountInfo[] = [];
  private statusNum: number = 1;
  private subStatusNum: number = 1;

  private otherTextViewInfo: OtherTextViewInfo | null = null;

  private cardMetaCC = SocketFacade.instance.cardMetaCC();
  private cardDeckBigCC = SocketFacade.instance.cardDeckBigCC();
  private cardDeckSmallCC = SocketFacade.instance.cardDeckSmallCC();
  private sceneLayerList = GameObjectManager.instance.sceneLayerList;
  private cardObjectCC = SocketFacade.instance.cardObjectCC();

  @VueEvent
  private async resistDeck() {
    // 大山札の登録
    const cardDeckBigKey = (
      await this.cardDeckBigCC.addDirect([{ data: { name: this.newDeckName } }])
    )[0];

    const cardMetaList: CardMetaStore[] = this.selectedCardList
      .filter(ccInfo => ccInfo.count)
      .map(ccInfo => this.cardList.filter(c => c.key === ccInfo.key)[0].data!);
    const cardMetaKeyList = await this.cardMetaCC.addDirect(
      cardMetaList.map(data => ({
        owner: cardDeckBigKey,
        data
      }))
    );

    console.log(JSON.stringify(cardMetaList, null, "  "));
    console.log(JSON.stringify(cardMetaKeyList, null, "  "));

    const cardObjectList: CardObjectStore[] = this.selectedCardList
      .filter(ccInfo => ccInfo.count)
      .map((ccInfo, index) => {
        // const index: number = this.cardList.findIndex(c => (c.key = ccInfo.id));
        return {
          cardMetaKey: cardMetaKeyList[index],
          cardDeckBigKey,
          isTurnOff: true,
          point: createPoint(0, 0),
          angle: 0
        };
      });

    const cardSceneLayer = this.sceneLayerList.find(
      sl => sl.data!.type === "card"
    )!;

    const cardDeckSmallKey = (
      await this.cardDeckSmallCC.addDirect([
        {
          ownerType: null,
          owner: null,
          data: {
            address: createAddress(0, 0, 0, 0),
            layout: "pile-up",
            cardHeightRatio: 1,
            cardWidthRatio: 1,
            columns: 2,
            rows: 3,
            layoutColumns: 1,
            layoutRows: 1,
            name: "",
            isUseHoverView: true,
            tileReorderingMode: "insert",
            width: 200,
            layerKey: cardSceneLayer.key,
            total: cardObjectList.length
          }
        }
      ])
    )[0];

    await this.cardObjectCC.addDirect(
      cardObjectList.map((data, v) => ({
        order: v,
        owner: cardDeckSmallKey,
        ownerType: "card-deck-small-list",
        data
      }))
    );
    await this.close();
  }

  @VueEvent
  private hoverCard(
    card: StoreData<CardMetaStore>,
    isHover: boolean,
    rect: Rectangle
  ) {
    if (isHover) {
      const text = `${card.data!.name}\n${card.data!.text}`;
      this.otherTextViewInfo = {
        type: "card-meta-list",
        key: card.key,
        dataList: [
          createEmptyStoreUseData(uuid.v4(), {
            tab: "",
            text
          })
        ],
        rect,
        isFix: true
      };
    } else {
      this.otherTextViewInfo = null;
    }
  }

  @VueEvent
  private get cardList(): StoreData<CardMetaStore>[] {
    const resultList: StoreData<CardMetaStore>[] = [];

    resultList.push(...this.newCardList);

    this.presetDeckList
      .concat(this.dbDeckList)
      .filter(
        deck =>
          this.selectedDeckKeyList.findIndex(
            key => key === deck.cardDeckBig.key
          ) > -1
      )
      .forEach(deck => {
        resultList.push(...deck.cardMetaList);
      });
    return resultList;
  }

  @LifeCycle
  private async created() {
    // DBデッキリストを参照
    this.cardDeckBigList.forEach(cardDeckBig => {
      const cardMetaList: StoreUseData<
        CardMetaStore
      >[] = this.cardMetaList.filter(cm => cm.owner === cardDeckBig.key);
      this.dbDeckList.push({ cardDeckBig, cardMetaList });
    });

    // プリセットデッキの読み込み
    // 読み込み必須でないためthrowは伝搬しないで警告だけ表示
    try {
      (await loadYaml<CardYamlInfo[]>("static/conf/deck.yaml")).forEach(
        (presetDeck: CardYamlInfo, deckIndex: number) => {
          const name = presetDeck.title;
          const key = `preset-deck-${name}-${deckIndex}`;
          const cardDeckBig = createEmptyStoreUseData(key, { name });
          const cardMetaList: StoreData<CardMetaStore>[] = presetDeck.cards.map(
            (c: InputCardInfo, cardIndex: number) => {
              const cardKey = `preset-card-${deckIndex}-${cardIndex}`;
              const basePath = presetDeck.basePath || "";
              const cardMeta: CardMetaStore = {
                width: presetDeck.width,
                height: presetDeck.height,
                padHorizontal: presetDeck.padHorizontal || 0,
                padTop: presetDeck.padTop || 0,
                padBottom: presetDeck.padBottom || 0,
                radius: presetDeck.radius || 0,
                frontImage: c.imagePath
                  ? `url(${getSrc(urljoin(basePath, c.imagePath)).url})`
                  : "",
                frontBackgroundColor: c.backgroundColor || "#ffffff",
                backImage: presetDeck.back.imagePath
                  ? `url(${
                      getSrc(urljoin(basePath, presetDeck.back.imagePath)).url
                    })`
                  : "",
                backBackgroundColor:
                  presetDeck.back.backgroundColor || "#ffffff",
                fontColor: c.fontColor || "#000000",
                name: c.name || "",
                nameHeight: presetDeck.nameHeight || 0,
                nameFontSize: presetDeck.nameFontSize || 20,
                nameBackgroundColor:
                  presetDeck.nameBackgroundColor || "rgba(255, 255, 255, 0.3)",
                text: c.text || "",
                textHeight: presetDeck.textHeight || 0,
                textFontSize: presetDeck.textFontSize || 11,
                textPadding: presetDeck.textPadding || 0,
                textBackgroundColor:
                  presetDeck.textBackgroundColor || "rgba(255, 255, 255, 0.3)"
              };
              if (!cardMeta.radius) cardMeta.radius = 0;
              return createEmptyStoreUseData(cardKey, cardMeta);
            }
          );
          this.presetDeckList.push({ cardDeckBig, cardMetaList });
        }
      );
    } catch (err) {
      console.warn(err.toString());
    }
  }

  @VueEvent
  private async rollback(): Promise<void> {
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
          flag: "off" as "off",
          cardDeckKey: ""
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
@import "../../../../assets/common";

#card-deck-builder {
  @include flex-box(column, stretch, flex-start);
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
  z-index: 100;

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
  padding: 0;
  margin: 0 3em;
  transition: all 0.5s ease-in-out;

  &.out-left {
    transform: translateX(calc(-100% - 3em));
  }

  &.out-right {
    transform: translateX(calc(100% + 3em));
  }

  .sub-contents {
    transition: all 0.5s ease-in-out;
    background-color: white;
    height: 100%;

    &.out-top {
      transform: translateY(calc(-100%));
    }

    &.out-bottom {
      transform: translateY(calc(100%));
    }
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

.create-card-deck-area {
  @include flex-box(column, stretch, flex-start);
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
