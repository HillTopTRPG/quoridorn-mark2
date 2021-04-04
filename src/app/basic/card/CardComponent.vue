<template>
  <div
    class="card-component"
    :class="isTurnOff ? 'back' : 'front'"
    :style="containerStyle"
    @mousedown.left="$emit('leftDown', $event)"
    @touchstart="$emit('leftDown', $event)"
    @mousedown.right.stop="$emit('rightDown', $event)"
    @mouseenter="$emit('hover', true)"
    @mouseleave="$emit('hover', false)"
    ref="elm"
  >
    <div class="card" :style="cardStyle">
      <div class="face front-face" :style="frontStyle">
        <div
          class="name"
          :style="{
            height: cardMeta.data.nameHeight + 'px',
            backgroundColor: cardMeta.data.nameBackgroundColor
          }"
        >
          {{ cardMeta.data.name }}
        </div>
        <div
          class="text"
          :style="{
            height: cardMeta.data.textHeight + 'px',
            backgroundColor: cardMeta.data.textBackgroundColor
          }"
        >
          {{ cardMeta.data.text }}
        </div>
      </div>
      <div class="face back-face" :style="backStyle"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import ComponentVue from "../../core/window/ComponentVue";
import { createSize } from "../../core/utility/CoordinateUtility";
import { CardMetaStore } from "@/@types/store-data";
import VueEvent from "../../core/decorator/VueEvent";
import { Size } from "@/@types/store-data-optional";

@Component
export default class CardComponent extends Mixins<ComponentVue>(ComponentVue) {
  @Prop({ type: Object, required: true })
  private cardMeta!: StoreData<CardMetaStore>;

  @Prop({ type: Object, required: true })
  private size!: Size;

  @Prop({ type: Boolean, required: true })
  private isTurnOff!: boolean;

  @VueEvent
  private get containerStyle() {
    return {
      width: `${this.size.width}px`,
      height: `${this.size.height}px`
    };
  }

  @VueEvent
  private get cardStyle() {
    const cardRawSize = createSize(
      this.cardMeta.data!.width,
      this.cardMeta.data!.height
    );
    const cardSizeRatio = Math.min(
      this.size.width / cardRawSize.width,
      this.size.height / cardRawSize.height
    );
    return {
      transform: `scale(${cardSizeRatio})`
    };
  }

  @VueEvent
  private get frontStyle() {
    const cm = this.cardMeta.data!;
    return {
      backgroundImage: cm.frontImage,
      backgroundColor: cm.frontBackgroundColor,
      color: cm.fontColor,
      padding: `${cm.padTop}px ${cm.padHorizontal}px ${cm.padBottom}px`,
      borderRadius: `${cm.radius}px`,
      width: `${cm.width}px`,
      height: `${cm.height}px`
    };
  }

  @VueEvent
  private get backStyle() {
    const cm = this.cardMeta.data!;
    return {
      backgroundImage: cm.backImage,
      backgroundColor: cm.backBackgroundColor,
      color: cm.fontColor,
      borderRadius: `${cm.radius}px`,
      width: `${cm.width}px`,
      height: `${cm.height}px`
    };
  }

  private get elm(): HTMLElement {
    return this.$refs.elm as HTMLElement;
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.card-component {
  @include flex-box(column, stretch, flex-start);
  position: relative;
  -webkit-font-smoothing: subpixel-antialiased;
}
.card {
  display: inline-block;
  width: 100%;
  height: 100%;
  perspective: 20rem;
  transform-origin: left top;
}
.face {
  @include flex-box(column, stretch, space-between);
  box-sizing: border-box;
  backface-visibility: hidden;
  transition: all 0.5s ease-in-out;
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: center center;
  background-repeat: no-repeat;
  background-size: contain;
  background-position: center;
}
.front {
  .front-face {
    transform: rotateY(0deg);
  }
  .back-face {
    transform: rotateY(180deg);
  }
}
.back {
  .front-face {
    transform: rotateY(-180deg);
  }
  .back-face {
    transform: rotateY(0deg);
  }
}
.name {
  @include inline-flex-box(row, flex-start, center);
  overflow: hidden;
}
.text {
  @include inline-flex-box(row, flex-start, flex-start, wrap);
  overflow: hidden;
  white-space: pre-line;
  text-align: left;
}
</style>
