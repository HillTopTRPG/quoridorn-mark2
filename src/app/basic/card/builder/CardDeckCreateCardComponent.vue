<template>
  <card-deck-sub-container-component
    message="create-front"
    @back="$emit('back')"
    @next="$emit('next')"
  >
    <div class="create-container">
      <image-picker-component
        class="image-picker-component"
        v-model="currentImageId"
        :windowKey="key"
        :imageTag.sync="currentTag"
        :isSimple="true"
        :viewName="true"
        imageSize="20em"
      />
      <div class="setting-container">
        <table>
          <tr>
            <tr-string-input-component labelName="name" v-model="name" />
          </tr>
          <tr>
            <tr-color-picker-component
              labelName="background-color"
              v-model="frontBackgroundColor"
              :useAlpha="false"
            />
          </tr>
          <tr v-if="nameHeight && textHeight">
            <tr-color-picker-component
              labelName="font-color"
              v-model="fontColor"
              :useAlpha="false"
            />
          </tr>
          <tr v-if="nameHeight">
            <tr-number-input-component
              labelName="card-name-font-size"
              v-model="nameFontSize"
            />
          </tr>
          <tr v-if="nameHeight">
            <tr-color-picker-component
              labelName="card-name-background-color"
              v-model="nameBackgroundColor"
              :useAlpha="true"
            />
          </tr>
          <tr v-if="textHeight">
            <tr-number-input-component
              labelName="card-text-font-size"
              v-model="textFontSize"
            />
          </tr>
          <tr-color-picker-component
            labelName="card-text-background-color"
            v-model="textBackgroundColor"
            :useAlpha="true"
          />
          <tr v-if="textHeight">
            <tr-number-input-component
              labelName="card-text-padding"
              v-model="textPadding"
            />
          </tr>
        </table>

        <label class="text-container">
          <span class="text label-input" v-t="'label.text'"></span>
          <textarea v-model="text"></textarea>
        </label>

        <card-simulator-component
          :width="width"
          :height="height"
          :padTop="padTop"
          :padHorizontal="padHorizontal"
          :padBottom="padBottom"
          :radius="radius"
          :frontBackgroundColor="frontBackgroundColor"
          :fontColor="fontColor"
          :imageSrc="getImageUrl(currentImageId)"
          :name="name"
          :nameHeight="nameHeight"
          :nameFontSize="nameFontSize"
          :nameBackgroundColor="nameBackgroundColor"
          :text="text"
          :textHeight="textHeight"
          :textFontSize="textFontSize"
          :textPadding="textPadding"
          :textBackgroundColor="textBackgroundColor"
        />

        <s-button
          class="add-button"
          icon="plus"
          :label="$t('button.add')"
          colorStyle="skyblue"
          :disabled="!name"
          @click="addCard()"
        />
      </div>
      <div class="card-result-box">
        <div class="h-box">
          <s-check
            class="sort-check"
            v-model="isViewCardImage"
            colorStyle="skyblue"
            c-icon="image"
            c-label=""
            n-icon="list2"
            n-label=""
          />
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
        </div>
        <div class="card-list" :style="{ minWidth: `calc(1rem + ${width}px)` }">
          <div
            class="card-container"
            v-for="cardMeta in useCardList"
            :key="cardMeta.id"
            @mouseenter="onHoverCard(cardMeta, true, $event.target)"
            @mouseleave="onHoverCard(cardMeta, false, $event.target)"
            :style="{ width: `${width}px` }"
          >
            <span class="name">
              <span>{{ cardMeta.data.name }}</span>
            </span>
            <card-component
              class="deck-set-card"
              v-show="isViewCardImage"
              :cardMeta="cardMeta"
              :size="getCardSize(cardMeta.data)"
              :isTurnOff="false"
            />
            <s-button
              class="delete-button"
              icon="bin"
              colorStyle="pink"
              @click="deleteCard(cardMeta.id)"
            />
          </div>
        </div>
      </div>
    </div>
  </card-deck-sub-container-component>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import { Prop, Watch } from "vue-property-decorator";
import { StoreUseData } from "@/@types/store";
import LifeCycle from "../../../core/decorator/LifeCycle";
import {
  createRectangle,
  createSize
} from "@/app/core/utility/CoordinateUtility";
import ComponentVue from "../../../core/window/ComponentVue";
import GameObjectManager from "../../GameObjectManager";
import { createEmptyStoreUseData } from "@/app/core/utility/Utility";
import { CardMeta } from "@/@types/gameObject";
import VueEvent from "../../../core/decorator/VueEvent";
import CardDeckSubContainerComponent from "./CardDeckSubContainerComponent.vue";
import ImagePickerComponent from "../../../core/component/ImagePickerComponent.vue";
import TrStringInputComponent from "../../common/components/TrStringInputComponent.vue";
import TrColorPickerComponent from "../../common/components/TrColorPickerComponent.vue";
import TrNumberInputComponent from "../../common/components/TrNumberInputComponent.vue";
import CardSimulatorComponent from "./CardSimulatorComponent.vue";
import SButton from "../../common/components/SButton.vue";
import SCheck from "../../common/components/SCheck.vue";
import CardComponent from "../CardComponent.vue";
const uuid = require("uuid");

@Component({
  components: {
    CardComponent,
    SCheck,
    SButton,
    CardSimulatorComponent,
    TrNumberInputComponent,
    TrColorPickerComponent,
    TrStringInputComponent,
    ImagePickerComponent,
    CardDeckSubContainerComponent
  }
})
export default class CardDeckCreateCardComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Number, required: true })
  private width!: number;

  @Prop({ type: Number, required: true })
  private height!: number;

  @Prop({ type: Number, required: true })
  private padTop!: number;

  @Prop({ type: Number, required: true })
  private padHorizontal!: number;

  @Prop({ type: Number, required: true })
  private padBottom!: number;

  @Prop({ type: Number, required: true })
  private radius!: number;

  @Prop({ type: String, required: true })
  private frontBackgroundColorDefault!: string;

  @Prop({ type: String, required: true })
  private backImage!: string;

  @Prop({ required: true })
  private imageTag!: string | null;
  @Watch("imageTag")
  private onChangeImageTag() {
    this.currentTag = this.imageTag;
  }

  @Prop({ type: String, required: true })
  private backBackgroundColor!: string;

  @Prop({ type: String, required: true })
  private fontColor!: string;

  @Prop({ type: Number, required: true })
  private nameHeight!: number;

  @Prop({ type: Number, required: true })
  private nameFontSizeDefault!: number;

  @Prop({ type: String, required: true })
  private nameBackgroundColorDefault!: string;

  @Prop({ type: Number, required: true })
  private textHeight!: number;

  @Prop({ type: Number, required: true })
  private textFontSizeDefault!: number;

  @Prop({ type: String, required: true })
  private textBackgroundColorDefault!: string;

  @Prop({ type: Number, required: true })
  private textPaddingDefault!: number;

  @Prop({ type: Array, required: true })
  private cardList!: StoreUseData<CardMeta>[];

  private frontBackgroundColor: string = "#ffffff";
  private nameFontSize: number = 20;
  private nameBackgroundColor: string = "rgba(255, 255, 255, 0.3)";
  private textBackgroundColor: string = "rgba(255, 255, 255, 0.3)";
  private textFontSize: number = 11;
  private textPadding: number = 0;
  private name: string = "";
  private text: string = "";

  private searchText: string = "";
  private isViewCardImage: boolean = true;

  @VueEvent
  private get useCardList() {
    if (!this.searchText) return this.cardList.concat();
    const regExt = new RegExp(this.searchText);
    return this.cardList.filter(c => c.data!.name.match(regExt));
  }

  @LifeCycle
  private mounted() {
    this.setDefault();
    this.currentTag = this.imageTag;
  }

  @VueEvent
  private getCardSize(cardMeta: CardMeta) {
    return createSize(cardMeta.width, cardMeta.height);
  }

  private setDefault() {
    this.frontBackgroundColor = this.frontBackgroundColorDefault;
    this.nameFontSize = this.nameFontSizeDefault;
    this.nameBackgroundColor = this.nameBackgroundColorDefault;
    this.textBackgroundColor = this.textBackgroundColorDefault;
    this.textFontSize = this.textFontSizeDefault;
    this.textPadding = this.textPaddingDefault;
    this.currentImageId = "";
    this.name = "";
    this.text = "";
  }

  private currentImageId: string = "";
  private currentTag: string | null = null;
  private mediaList = GameObjectManager.instance.mediaList;

  @VueEvent
  private getImageUrl(mediaId: string): string {
    const media = this.mediaList.filter(m => m.id === mediaId)[0];
    if (!media) return "";
    return `url('${media.data!.url}')`;
  }

  @VueEvent
  private addCard() {
    const id: string = uuid.v4();
    this.cardList.push(
      createEmptyStoreUseData(id, {
        width: this.width,
        height: this.height,
        padHorizontal: this.padHorizontal,
        padTop: this.padTop,
        padBottom: this.padBottom,
        radius: this.radius,
        frontImage: this.getImageUrl(this.currentImageId),
        frontBackgroundColor: this.frontBackgroundColor,
        backImage: this.getImageUrl(this.backImage),
        backBackgroundColor: this.backBackgroundColor,
        fontColor: this.fontColor,
        name: this.name,
        nameHeight: this.nameHeight,
        nameFontSize: this.nameFontSize,
        nameBackgroundColor: this.nameBackgroundColor,
        text: this.text,
        textHeight: this.textHeight,
        textFontSize: this.textFontSize,
        textPadding: this.textPadding,
        textBackgroundColor: this.textBackgroundColor
      })
    );
    this.setDefault();
    console.log(JSON.stringify(this.cardList, null, "  "));
  }

  private hoverCardId: string | null = null;

  @VueEvent
  private onHoverCard(
    card: StoreUseData<CardMeta>,
    isHover: boolean,
    elm: HTMLElement
  ) {
    this.hoverCardId = isHover ? card.id! : null;
    const rect: any = elm.getBoundingClientRect();
    const r = createRectangle(rect.x, rect.y, rect.width, rect.height);
    this.$emit("hover-card", card, isHover, r);
  }

  @VueEvent
  private deleteCard(cardId: string) {
    const idx = this.cardList.findIndex(c => c.id === cardId);
    this.cardList.splice(idx, 1);
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.create-container {
  @include flex-box(row, space-around, stretch);
  flex: 1;
  align-self: stretch;
  overflow: hidden;
}

.setting-container {
  @include flex-box(column, center, flex-start);
}

.image-picker-component {
  @include flex-box(column, flex-end, flex-start);
  width: calc(20em + 4px + var(--scroll-bar-width));
}

.add-button {
  margin-top: 1rem;
}

.card-result-box {
  @include flex-box(column, flex-end, flex-start);
}

.search-name {
  @include inline-flex-box(row, flex-start, center);
  font-size: inherit;
  height: 2em;
  min-height: 2em;
}

.card-list {
  @include flex-box(column, center, flex-start);
  border: 1px solid gray;
  padding: 0.5rem;
  overflow-y: scroll;
  flex: 1;
}

.card-container {
  border: 1px solid gray;
  padding: 0.5rem;
  position: relative;

  &:hover {
    background-color: var(--uni-color-cream);
  }

  &:not(:first-child) {
    margin-top: 0.5rem;
  }
}

.name {
  @include flex-box(row, flex-start, center);
  height: 2em;
  position: relative;

  span {
    display: inline-block;
    vertical-align: middle;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    flex: 1;
    margin-right: 2em;
  }
}

.delete-button {
  position: absolute;
  right: 0.5rem;
  top: 0.5rem;
}

.text-container {
  @include flex-box(row, flex-start, flex-start);
}

textarea {
  width: 30em;
  height: 6em;
  resize: none;
}
</style>
