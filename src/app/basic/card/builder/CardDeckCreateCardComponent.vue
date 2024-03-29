<template>
  <card-deck-sub-container-component
    message="create-front"
    @back="$emit('back')"
    @next="$emit('next')"
  >
    <div class="create-container">
      <image-picker-component
        class="image-picker-component"
        v-model="currentImageKey"
        :windowKey="key"
        :mediaTag.sync="currentTag"
        :isDisabledDirection="true"
        imageSize="20em"
        :is-simple.sync="isSimple"
      />
      <div class="setting-container">
        <table>
          <tr>
            <tr-string-input-component labelName="label.name" v-model="name" />
          </tr>
          <tr>
            <tr-color-picker-component
              labelName="label.background-color"
              v-model="frontBackgroundColor"
              :useAlpha="false"
            />
          </tr>
          <tr v-if="nameHeight && textHeight">
            <tr-color-picker-component
              labelName="label.font-color"
              v-model="fontColor"
              :useAlpha="false"
            />
          </tr>
          <tr v-if="nameHeight">
            <tr-number-input-component
              labelName="card-deck-create-card-component.label.card-name-font-size"
              v-model="nameFontSize"
            />
          </tr>
          <tr v-if="nameHeight">
            <tr-color-picker-component
              labelName="card-deck-create-card-component.label.card-name-background-color"
              v-model="nameBackgroundColor"
              :useAlpha="true"
            />
          </tr>
          <tr v-if="textHeight">
            <tr-number-input-component
              labelName="card-deck-create-card-component.label.card-text-font-size"
              v-model="textFontSize"
            />
          </tr>
          <tr-color-picker-component
            labelName="card-deck-create-card-component.label.card-text-background-color"
            v-model="textBackgroundColor"
            :useAlpha="true"
          />
          <tr v-if="textHeight">
            <tr-number-input-component
              labelName="card-deck-create-card-component.label.card-text-padding"
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
          :imageSrc="getImageUrl(currentImageKey)"
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
            :key="cardMeta.key"
            @mouseenter="onHoverCard(cardMeta, true, $event.target)"
            @mouseleave="onHoverCard(cardMeta, false, $event.target)"
            @contextmenu.prevent
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
              @click="deleteCard(cardMeta.key)"
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
import {
  createRectangle,
  createSize
} from "@/app/core/utility/CoordinateUtility";
import { createEmptyStoreUseData, findByKey } from "@/app/core/utility/Utility";
import { CardMetaStore } from "@/@types/store-data";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import CardDeckSubContainerComponent from "@/app/basic/card/builder/CardDeckSubContainerComponent.vue";
import ComponentVue from "@/app/core/window/ComponentVue";
import SButton from "@/app/basic/common/components/SButton.vue";
import TrColorPickerComponent from "@/app/basic/common/components/table-item/TrColorPickerComponent.vue";
import CardSimulatorComponent from "@/app/basic/card/builder/CardSimulatorComponent.vue";
import CardComponent from "@/app/basic/card/CardComponent.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import ImagePickerComponent from "@/app/core/component/ImagePickerComponent.vue";
import SCheck from "@/app/basic/common/components/SCheck.vue";
import TrStringInputComponent from "@/app/basic/common/components/table-item/TrStringInputComponent.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import TrNumberInputComponent from "@/app/basic/common/components/table-item/TrNumberInputComponent.vue";
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

  private isSimple: boolean = true;

  @Prop({ required: true })
  private mediaTag!: string | null;
  @Watch("mediaTag")
  private onChangeImageTag() {
    this.currentTag = this.mediaTag;
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
  private cardList!: StoreData<CardMetaStore>[];

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
    this.currentTag = this.mediaTag;
  }

  @VueEvent
  private getCardSize(cardMeta: CardMetaStore) {
    return createSize(cardMeta.width, cardMeta.height);
  }

  private setDefault() {
    this.frontBackgroundColor = this.frontBackgroundColorDefault;
    this.nameFontSize = this.nameFontSizeDefault;
    this.nameBackgroundColor = this.nameBackgroundColorDefault;
    this.textBackgroundColor = this.textBackgroundColorDefault;
    this.textFontSize = this.textFontSizeDefault;
    this.textPadding = this.textPaddingDefault;
    this.currentImageKey = "";
    this.name = "";
    this.text = "";
  }

  private currentImageKey: string = "";
  private currentTag: string | null = null;
  private mediaList = GameObjectManager.instance.mediaList;

  @VueEvent
  private getImageUrl(mediaKey: string): string {
    const media = findByKey(this.mediaList, mediaKey);
    if (!media) return "";
    return `url('${media.data!.url}')`;
  }

  @VueEvent
  private addCard() {
    const key: string = uuid.v4();
    this.cardList.push(
      createEmptyStoreUseData(key, {
        width: this.width,
        height: this.height,
        padHorizontal: this.padHorizontal,
        padTop: this.padTop,
        padBottom: this.padBottom,
        radius: this.radius,
        frontImage: this.getImageUrl(this.currentImageKey),
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

  private hoverCardKey: string | null = null;

  @VueEvent
  private onHoverCard(
    card: StoreData<CardMetaStore>,
    isHover: boolean,
    elm: HTMLElement
  ) {
    this.hoverCardKey = isHover ? card.key : null;
    const rect: any = elm.getBoundingClientRect();
    const r = createRectangle(rect.x, rect.y, rect.width, rect.height);
    this.$emit("hover-card", card, isHover, r);
  }

  @VueEvent
  private deleteCard(cardKey: string) {
    const index = this.cardList.findIndex(c => c.key === cardKey);
    this.cardList.splice(index, 1);
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
