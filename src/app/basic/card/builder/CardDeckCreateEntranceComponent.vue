<template>
  <card-deck-sub-container-component
    message="create-deck-entrance"
    :isFirst="true"
    @next="$emit('next')"
  >
    <fieldset class="special-area">
      <legend v-t="'label.special-process'"></legend>
      <div class="special-process-contents">
        <s-button
          class="s-button"
          icon="upload"
          :label="$t('card-deck-builder.button.import-text-paranoia-rebooted')"
          colorStyle="pink"
          @hover="onHoverParanoiaRebooted"
          @click="importParanoiaRebooted()"
        />
      </div>
    </fieldset>
    <div class="description" v-if="description">
      <div class="text">{{ description }}</div>
    </div>
  </card-deck-sub-container-component>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import { Prop, Watch } from "vue-property-decorator";
import CardDeckSubContainerComponent from "./CardDeckSubContainerComponent.vue";
import ComponentVue from "../../../core/window/ComponentVue";
import GameObjectManager from "../../GameObjectManager";
import { createEmptyStoreUseData } from "@/app/core/utility/Utility";
import SButton from "../../common/components/SButton.vue";
import BaseInput from "../../../core/component/BaseInput.vue";
import { CardMetaStore } from "@/@types/store-data";
import CardDeckBuilder from "./CardDeckBuilder.vue";
import { importText } from "@/app/core/utility/FileUtility";
import VueEvent from "../../../core/decorator/VueEvent";
const uuid = require("uuid");

@Component({
  components: { SButton, CardDeckSubContainerComponent, BaseInput }
})
export default class CardDeckCreateEntranceComponent extends Mixins<
  ComponentVue
>(ComponentVue) {
  @Prop({ type: Array, required: true })
  private cardList!: StoreData<CardMetaStore>[];

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

  // backBackgroundColor
  @Prop({ type: String, required: true })
  private backBackgroundColor!: string;
  private backBackgroundColorVolatile: string = "#ffffff";
  @Watch("backBackgroundColor", { immediate: true })
  private onChangeBackBackgroundColor(value: string) {
    this.backBackgroundColorVolatile = value;
  }
  @Watch("backBackgroundColorVolatile")
  private onChangeBackBackgroundColorVolatile(value: string) {
    this.$emit("update:backBackgroundColor", value);
  }

  // backImageKey
  @Prop({ type: String, required: true })
  private backImageKey!: string;
  private backImageKeyVolatile: string = "";
  @Watch("backImageKey", { immediate: true })
  private onChangeBackImageKey(value: string) {
    this.backImageKeyVolatile = value;
  }
  @Watch("backImageKeyVolatile")
  private onChangeBackImageKeyVolatile(value: string) {
    this.$emit("update:backImageKey", value);
  }

  // imageTag
  @Prop({ required: true })
  private imageTag!: string | null;
  private imageTagVolatile: string | null = null;
  @Watch("imageTag", { immediate: true })
  private onChangeImageTag(value: string | null) {
    this.imageTagVolatile = value;
  }
  @Watch("imageTagVolatile")
  private onChangeImageTagVolatile(value: string | null) {
    this.$emit("update:imageTag", value);
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

  private mediaList = GameObjectManager.instance.mediaList;
  private description: string = "";

  @VueEvent
  private onHoverParanoiaRebooted(isHover: boolean) {
    this.description = isHover
      ? this.$t(
          "card-deck-builder.description.import-text-paranoia-rebooted"
        )!.toString()
      : "";
  }

  @VueEvent
  private async importParanoiaRebooted() {
    const text = await importText();
    const failure = (reason: string) => {
      alert(this.$t("label.importFailure"));
      console.warn(`import failure. [${reason}]`);
      this.cardList.splice(0, this.cardList.length);
    };
    if (!text) return failure("text is empty");
    const getFileName = (path: string) => {
      return path.replace(/^.+\//, "");
    };
    const getImageUrl = (
      name: string
    ): { key: string; tag: string; url: string } | null => {
      const media = this.mediaList.filter(m => m.data!.name.endsWith(name))[0];
      return media
        ? {
            key: media.key,
            tag: media.data!.tag,
            url: `url(${media.data!.url})`
          }
        : null;
    };
    const lines = text.split(/\r?\n/g);
    if (lines[0] !== "image") return failure("init line is not 'image'");

    let backImageUrl: string = "";

    const regExp1 = new RegExp("[!！。.][ 　]*", "g");
    const regExp2 = new RegExp("[◇●◆]", "g");
    const regExp3 = new RegExp("\\n\\n", "g");
    const regExp4 = new RegExp("\\n$");

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const words = line.split(/\t/g);
      let imageUrl = getImageUrl(getFileName(words[0]));
      if (!imageUrl) {
        imageUrl = getImageUrl(getFileName(words[0].replace("0", "")));
      }
      let name = words[1];
      let contents = words[2] || "";

      if (!imageUrl) return failure("imageUrl is empty");
      if (i === 1) {
        backImageUrl = imageUrl.url;
        this.backImageKeyVolatile = imageUrl.key;
        this.imageTagVolatile = imageUrl.tag;
        continue;
      }

      const key: string = uuid.v4();
      const base = CardDeckBuilder.DEFAULT_CARD_FRAME_PARANOIA_REBOOTED;
      this.setFramePreset(base);

      contents = contents
        .replace(regExp1, (c: string) => `${c}\n`)
        .replace(regExp2, (c: string) => `\n${c}`)
        .replace(regExp3, "\n")
        .replace(regExp4, "");

      const nameSplit = name.split(" ■");
      name = nameSplit[0];
      if (nameSplit[1]) contents = `■${nameSplit[1]}\n${contents}`;

      this.cardList.push(
        createEmptyStoreUseData(key, {
          width: base.width,
          height: base.height,
          padHorizontal: base.padHorizontal,
          padTop: base.padTop,
          padBottom: base.padBottom,
          radius: base.radius,
          frontImage: imageUrl.url,
          frontBackgroundColor: base.frontBackgroundColor,
          backImage: backImageUrl,
          backBackgroundColor: base.backBackgroundColor,
          fontColor: base.fontColor,
          name,
          nameHeight: base.nameHeight,
          nameFontSize: base.nameFontSize,
          nameBackgroundColor: base.nameBackgroundColor,
          text: contents,
          textHeight: base.textHeight,
          textFontSize: base.textFontSize,
          textPadding: base.textPadding,
          textBackgroundColor: base.textBackgroundColor
        })
      );
    }
    this.$emit("import-direct");
  }

  private setFramePreset(preset: CardMetaStore) {
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
    this.backBackgroundColorVolatile = preset.backBackgroundColor;
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.special-area {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translateX(-50%);
}

.description {
  @include flex-box(row, center, center);
  position: absolute;
  top: calc(30% + 8em);
  left: 0;
  width: 100%;

  .text {
    display: block;
    white-space: pre-wrap;
    border: 1px solid gray;
    line-height: 1.5em;
    padding: 0.5rem;
  }
}
</style>
