<template>
  <card-deck-sub-container-component
    message="setting-frame"
    @back="$emit('back')"
    @next="$emit('next')"
  >
    <div class="preset-frame-container">
      <div
        class="preset-frame text-template"
        v-t="'card-deck-builder.card-frame-preset.text-template'"
        @click="setFramePreset(inSaneFrameSetting)"
      ></div>
      <div
        class="preset-frame full-image-paranoia"
        v-t="'card-deck-builder.card-frame-preset.full-image-paranoia'"
        @click="setFramePreset(paranoiaRebootedFrameSetting)"
      ></div>
      <div
        class="preset-frame full-image-tnm"
        v-t="'card-deck-builder.card-frame-preset.full-image-tnm'"
        @click="setFramePreset(tnmFrameSetting)"
      ></div>
      <div
        class="preset-frame full-image-tnx"
        v-t="'card-deck-builder.card-frame-preset.full-image-tnx'"
        @click="setFramePreset(tnxFrameSetting)"
      ></div>
    </div>
    <div class="setting-container">
      <table>
        <tr>
          <tr-number-input-component
            labelName="card-width"
            v-model="widthVolatile"
          />
        </tr>
        <tr>
          <tr-number-input-component
            labelName="card-height"
            v-model="heightVolatile"
          />
        </tr>
        <tr>
          <tr-number-input-component
            labelName="card-corner-radius"
            v-model="radiusVolatile"
          />
        </tr>
        <tr>
          <tr-number-input-component
            labelName="card-padding-horizontal"
            v-model="padHorizontalVolatile"
          />
        </tr>
        <tr>
          <tr-number-input-component
            labelName="card-padding-top"
            v-model="padTopVolatile"
          />
        </tr>
        <tr>
          <tr-number-input-component
            labelName="card-padding-bottom"
            v-model="padBottomVolatile"
          />
        </tr>
        <tr>
          <tr-color-picker-component
            labelName="background-color"
            v-model="frontBackgroundColorVolatile"
            :useAlpha="false"
          />
        </tr>
        <tr>
          <tr-color-picker-component
            labelName="font-color"
            v-model="fontColorVolatile"
            :useAlpha="false"
          />
        </tr>
        <tr>
          <tr-number-input-component
            labelName="card-name-height"
            v-model="nameHeightVolatile"
          />
        </tr>
        <tr>
          <tr-number-input-component
            labelName="card-name-font-size"
            v-model="nameFontSizeVolatile"
          />
        </tr>
        <tr>
          <tr-color-picker-component
            labelName="card-name-background-color"
            v-model="nameBackgroundColorVolatile"
            :useAlpha="true"
          />
        </tr>
        <tr>
          <tr-number-input-component
            labelName="card-text-height"
            v-model="textHeightVolatile"
          />
        </tr>
        <tr>
          <tr-number-input-component
            labelName="card-text-font-size"
            v-model="textFontSizeVolatile"
          />
        </tr>
        <tr>
          <tr-number-input-component
            labelName="card-text-padding"
            v-model="textPaddingVolatile"
          />
        </tr>
        <tr>
          <tr-color-picker-component
            labelName="card-text-background-color"
            v-model="textBackgroundColorVolatile"
            :useAlpha="true"
          />
        </tr>
      </table>

      <card-simulator-component
        :width="width"
        :height="height"
        :padTop="padTop"
        :padHorizontal="padHorizontal"
        :padBottom="padBottom"
        :radius="radius"
        :frontBackgroundColor="frontBackgroundColor"
        :fontColor="fontColor"
        name="Emperor penguin"
        :nameHeight="nameHeight"
        :nameFontSize="nameFontSize"
        :nameBackgroundColor="nameBackgroundColor"
        :text="sampleCardText"
        :textHeight="textHeight"
        :textFontSize="textFontSize"
        :textPadding="textPadding"
        :textBackgroundColor="textBackgroundColor"
      />
    </div>
    <div class="file-box">
      <s-button
        class="s-button"
        icon="download"
        :label="$t('button.download')"
        colorStyle="skyblue"
        @click="doExport()"
      />
      <s-button
        class="s-button"
        icon="upload"
        :label="$t('button.read')"
        colorStyle="skyblue"
        @click="doImport()"
      />
    </div>
  </card-deck-sub-container-component>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import { Prop, Watch } from "vue-property-decorator";
import LifeCycle from "../../../core/decorator/LifeCycle";
import ComponentVue from "../../../core/window/ComponentVue";
import { importJson, saveJson } from "../../../core/utility/FileUtility";
import LanguageManager from "../../../../LanguageManager";
import { CardMeta } from "../../../../@types/gameObject";
import CardDeckBuilder from "./CardDeckBuilder.vue";
import VueEvent from "../../../core/decorator/VueEvent";
import CardDeckSubContainerComponent from "./CardDeckSubContainerComponent.vue";
import TrNumberInputComponent from "../../common/components/TrNumberInputComponent.vue";
import TrColorPickerComponent from "../../common/components/TrColorPickerComponent.vue";
import CardSimulatorComponent from "./CardSimulatorComponent.vue";
import SButton from "../../common/components/SButton.vue";

@Component({
  components: {
    SButton,
    CardSimulatorComponent,
    TrColorPickerComponent,
    TrNumberInputComponent,
    CardDeckSubContainerComponent
  }
})
export default class CardDeckFrameSettingComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  // width
  @Prop({ type: Number, required: true })
  private width!: number;
  private widthVolatile: number = 0;
  @Watch("width", { immediate: true })
  private onChangeWidth(value: number) {
    this.widthVolatile = value;
  }
  @Watch("widthVolatile")
  private onChangeWidthVolatile(value: number) {
    this.$emit("update:width", value);
  }

  // height
  @Prop({ type: Number, required: true })
  private height!: number;
  private heightVolatile: number = 256;
  @Watch("height", { immediate: true })
  private onChangeHeight(value: number) {
    this.heightVolatile = value;
  }
  @Watch("heightVolatile")
  private onChangeHeightVolatile(value: number) {
    this.$emit("update:height", value);
  }

  // radius
  @Prop({ type: Number, required: true })
  private radius!: number;
  private radiusVolatile: number = 0;
  @Watch("radius", { immediate: true })
  private onChangeRadius(value: number) {
    this.radiusVolatile = value;
  }
  @Watch("radiusVolatile")
  private onChangeRadiusVolatile(value: number) {
    this.$emit("update:radius", value);
  }

  // padHorizontal
  @Prop({ type: Number, required: true })
  private padHorizontal!: number;
  private padHorizontalVolatile: number = 0;
  @Watch("padHorizontal", { immediate: true })
  private onChangePadHorizontal(value: number) {
    this.padHorizontalVolatile = value;
  }
  @Watch("padHorizontalVolatile")
  private onChangePadHorizontalVolatile(value: number) {
    this.$emit("update:padHorizontal", value);
  }

  // padTop
  @Prop({ type: Number, required: true })
  private padTop!: number;
  private padTopVolatile: number = 0;
  @Watch("padTop", { immediate: true })
  private onChangePadTop(value: number) {
    this.padTopVolatile = value;
  }
  @Watch("padTopVolatile")
  private onChangePadTopVolatile(value: number) {
    this.$emit("update:padTop", value);
  }

  // padBottom
  @Prop({ type: Number, required: true })
  private padBottom!: number;
  private padBottomVolatile: number = 0;
  @Watch("padBottom", { immediate: true })
  private onChangePadBottom(value: number) {
    this.padBottomVolatile = value;
  }
  @Watch("padBottomVolatile")
  private onChangePadBottomVolatile(value: number) {
    this.$emit("update:padBottom", value);
  }

  // frontBackgroundColor
  @Prop({ type: String, required: true })
  private frontBackgroundColor!: string;
  private frontBackgroundColorVolatile: string = "#ffffff";
  @Watch("frontBackgroundColor", { immediate: true })
  private onChangeFrontBackgroundColor(value: string) {
    this.frontBackgroundColorVolatile = value;
  }
  @Watch("frontBackgroundColorVolatile")
  private onChangeFrontBackgroundColorVolatile(value: string) {
    this.$emit("update:frontBackgroundColor", value);
  }

  // fontColor
  @Prop({ type: String, required: true })
  private fontColor!: string;
  private fontColorVolatile: string = "#000000";
  @Watch("fontColor", { immediate: true })
  private onChangeFontColor(value: string) {
    this.fontColorVolatile = value;
  }
  @Watch("fontColorVolatile")
  private onChangeFontColorVolatile(value: string) {
    this.$emit("update:fontColor", value);
  }

  // nameHeight
  @Prop({ type: Number, required: true })
  private nameHeight!: number;
  private nameHeightVolatile: number = 1;
  @Watch("nameHeight", { immediate: true })
  private onChangeNameHeight(value: number) {
    this.nameHeightVolatile = value;
  }
  @Watch("nameHeightVolatile")
  private onChangeNameHeightVolatile(value: number) {
    this.$emit("update:nameHeight", value);
  }

  // nameFontSize
  @Prop({ type: Number, required: true })
  private nameFontSize!: number;
  private nameFontSizeVolatile: number = 1;
  @Watch("nameFontSize", { immediate: true })
  private onChangeNameFontSize(value: number) {
    this.nameFontSizeVolatile = value;
  }
  @Watch("nameFontSizeVolatile")
  private onChangeNameFontSizeVolatile(value: number) {
    this.$emit("update:nameFontSize", value);
  }

  // nameBackgroundColor
  @Prop({ type: String, required: true })
  private nameBackgroundColor!: string;
  private nameBackgroundColorVolatile: string = "rgba(0, 0, 0, 0)";
  @Watch("nameBackgroundColor", { immediate: true })
  private onChangeNameBackgroundColor(value: string) {
    this.nameBackgroundColorVolatile = value;
  }
  @Watch("nameBackgroundColorVolatile")
  private onChangeNameBackgroundColorVolatile(value: string) {
    this.$emit("update:nameBackgroundColor", value);
  }

  // textHeight
  @Prop({ type: Number, required: true })
  private textHeight!: number;
  private textHeightVolatile: number = 3;
  @Watch("textHeight", { immediate: true })
  private onChangeTextHeight(value: number) {
    this.textHeightVolatile = value;
  }
  @Watch("textHeightVolatile")
  private onChangeTextHeightVolatile(value: number) {
    this.$emit("update:textHeight", value);
  }

  // textFontSize
  @Prop({ type: Number, required: true })
  private textFontSize!: number;
  private textFontSizeVolatile: number = 1;
  @Watch("textFontSize", { immediate: true })
  private onChangeTextFontSize(value: number) {
    this.textFontSizeVolatile = value;
  }
  @Watch("textFontSizeVolatile")
  private onChangeTextFontSizeVolatile(value: number) {
    this.$emit("update:textFontSize", value);
  }

  // textPadding
  @Prop({ type: Number, required: true })
  private textPadding!: number;
  private textPaddingVolatile: number = 0;
  @Watch("textPadding", { immediate: true })
  private onChangeTextPadding(value: number) {
    this.textPaddingVolatile = value;
  }
  @Watch("textPaddingVolatile")
  private onChangeTextPaddingVolatile(value: number) {
    this.$emit("update:textPadding", value);
  }

  // textBackgroundColor
  @Prop({ type: String, required: true })
  private textBackgroundColor!: string;
  private textBackgroundColorVolatile: string = "rgba(0, 0, 0, 0)";
  @Watch("textBackgroundColor", { immediate: true })
  private onChangeTextBackgroundColor(value: string) {
    this.textBackgroundColorVolatile = value;
  }
  @Watch("textBackgroundColorVolatile")
  private onChangeTextBackgroundColorVolatile(value: string) {
    this.$emit("update:textBackgroundColor", value);
  }

  @LifeCycle
  private created() {
    this.setFramePreset(this.inSaneFrameSetting);
  }

  private sampleCardText =
    "It is the fifth heaviest living bird species, after only the larger varieties of ratite.\n" +
    "The emperor penguin has a circumpolar distribution in the Antarctic almost exclusively between the 66° and 77° south latitudes.";

  private inSaneFrameSetting: CardMeta = {
    width: 200,
    height: 300,
    radius: 6,
    padHorizontal: 20,
    padTop: 20,
    padBottom: 20,
    frontBackgroundColor: "#ffffff",
    backBackgroundColor: "#ffffff",
    fontColor: "#000000",
    nameHeight: 30,
    nameFontSize: 20,
    nameBackgroundColor: "rgba(0, 0, 0, 0)",
    textHeight: 100,
    textFontSize: 10,
    textPadding: 5,
    textBackgroundColor: "rgba(0, 0, 0, 0)",
    frontImage: "",
    backImage: "",
    name: "",
    text: ""
  };

  public paranoiaRebootedFrameSetting: CardMeta =
    CardDeckBuilder.DEFAULT_CARD_FRAME_PARANOIA_REBOOTED;

  private tnmFrameSetting: CardMeta = {
    width: 180,
    height: 251,
    radius: 0,
    padHorizontal: 0,
    padTop: 0,
    padBottom: 0,
    frontBackgroundColor: "#ffffff",
    backBackgroundColor: "#ffffff",
    fontColor: "#000000",
    nameHeight: 0,
    nameFontSize: 20,
    nameBackgroundColor: "rgba(0, 0, 0, 0)",
    textHeight: 0,
    textFontSize: 11,
    textPadding: 5,
    textBackgroundColor: "rgba(0, 0, 0, 0)",
    frontImage: "",
    backImage: "",
    name: "",
    text: ""
  };

  private tnxFrameSetting: CardMeta = {
    width: 179,
    height: 249,
    radius: 5,
    padHorizontal: 0,
    padTop: 0,
    padBottom: 0,
    frontBackgroundColor: "#ffffff",
    backBackgroundColor: "#ffffff",
    fontColor: "#000000",
    nameHeight: 0,
    nameFontSize: 20,
    nameBackgroundColor: "rgba(0, 0, 0, 0)",
    textHeight: 0,
    textFontSize: 11,
    textPadding: 5,
    textBackgroundColor: "rgba(0, 0, 0, 0)",
    frontImage: "",
    backImage: "",
    name: "",
    text: ""
  };

  private setFramePreset(preset: CardMeta) {
    this.widthVolatile = preset.width;
    this.heightVolatile = preset.height;
    this.radiusVolatile = preset.radius;
    this.padHorizontalVolatile = preset.padHorizontal;
    this.padTopVolatile = preset.padTop;
    this.padBottomVolatile = preset.padBottom;
    this.frontBackgroundColorVolatile = preset.frontBackgroundColor;
    this.fontColorVolatile = preset.fontColor;
    this.nameHeightVolatile = preset.nameHeight;
    this.nameFontSizeVolatile = preset.nameFontSize;
    this.nameBackgroundColorVolatile = preset.nameBackgroundColor;
    this.textHeightVolatile = preset.textHeight;
    this.textFontSizeVolatile = preset.textFontSize;
    this.textPaddingVolatile = preset.textPadding;
    this.textBackgroundColorVolatile = preset.textBackgroundColor;
  }

  @VueEvent
  private doExport() {
    const data = {
      width: this.widthVolatile,
      height: this.heightVolatile,
      radius: this.radiusVolatile,
      padHorizontal: this.padHorizontalVolatile,
      padTop: this.padTopVolatile,
      padBottom: this.padBottomVolatile,
      frontBackgroundColor: this.frontBackgroundColorVolatile,
      fontColor: this.fontColorVolatile,
      nameHeight: this.nameHeightVolatile,
      nameFontSize: this.nameFontSizeVolatile,
      nameBackgroundColor: this.nameBackgroundColorVolatile,
      textHeight: this.textHeightVolatile,
      textFontSize: this.textFontSizeVolatile,
      textPadding: this.textPaddingVolatile,
      textBackgroundColor: this.textBackgroundColorVolatile
    };
    saveJson(`Quoridorn_card_deck_frame`, "card_deck_frame", data);
  }

  @VueEvent
  private async doImport() {
    const dataContainer: any = await importJson<any>("card_deck_frame");
    if (!dataContainer) {
      alert(LanguageManager.instance.getText("label.importFailure"));
      return;
    }
    const data: any = dataContainer.data;
    this.setFramePreset(data);
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.preset-frame-container {
  @include flex-box(row, center, center, wrap);
  margin-bottom: 1rem;
}

.preset-frame {
  white-space: pre-wrap;
  border: 1px solid gray;
  border-radius: 0.5rem;
  padding: 0.3rem;
  cursor: pointer;

  &:not(:first-child) {
    margin-left: 0.5rem;
  }

  &:hover {
    background-color: var(--uni-color-cream);
  }
}

.setting-container {
  @include flex-box(row, center, center);
}

.image-picker-component {
  flex: 1;
  align-self: stretch;
  overflow: hidden;
}

.file-box {
  @include flex-box(row, center, center);
  margin-top: 1rem;
}
</style>
