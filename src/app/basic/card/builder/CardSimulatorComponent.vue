<template>
  <div class="card-simulator" :style="cardSimulationStyle">
    <div class="name-simulator" :style="nameSimulationStyle">
      <span>{{ name }}</span>
    </div>
    <div class="text-simulator" :style="textSimulationStyle">{{ text }}</div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import { Prop } from "vue-property-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import VueEvent from "@/app/core/decorator/VueEvent";

@Component
export default class CardSimulatorComponent extends Mixins<ComponentVue>(
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
  private frontBackgroundColor!: string;

  @Prop({ type: String, default: "" })
  private imageSrc!: string;

  @Prop({ type: String, required: true })
  private fontColor!: string;

  @Prop({ type: String, required: true })
  private name!: string;

  @Prop({ type: Number, required: true })
  private nameHeight!: number;

  @Prop({ type: Number, required: true })
  private nameFontSize!: number;

  @Prop({ type: String, required: true })
  private nameBackgroundColor!: string;

  @Prop({ type: String, required: true })
  private text!: string;

  @Prop({ type: Number, required: true })
  private textHeight!: number;

  @Prop({ type: Number, required: true })
  private textFontSize!: number;

  @Prop({ type: Number, required: true })
  private textPadding!: number;

  @Prop({ type: String, required: true })
  private textBackgroundColor!: string;

  @VueEvent
  private get cardSimulationStyle() {
    return {
      width: `${this.width}px`,
      height: `${this.height}px`,
      padding: `${this.padTop}px ${this.padHorizontal}px ${this.padBottom}px`,
      "border-radius": `${this.radius}px`,
      "background-color": this.frontBackgroundColor,
      "font-color": this.fontColor,
      "background-image": this.imageSrc
    };
  }

  @VueEvent
  private get nameSimulationStyle() {
    return {
      height: `${this.nameHeight}px`,
      "font-size": `${this.nameFontSize}px`,
      "background-color": this.nameBackgroundColor,
      visibility: this.nameHeight ? "visible" : "hidden"
    };
  }

  @VueEvent
  private get textSimulationStyle() {
    return {
      height: `${this.textHeight}px`,
      "font-size": `${this.textFontSize}px`,
      padding: `${this.textPadding}px`,
      "background-color": this.textBackgroundColor,
      visibility: this.textHeight ? "visible" : "hidden"
    };
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.card-simulator {
  @include flex-box(column, stretch, space-between);
  box-sizing: border-box;
  border: 1px dashed gray;
  margin-top: 2rem;
}

.name-simulator {
  @include flex-box(row, flex-start, center);
  border: 1px dashed gray;
  font-weight: bold;
  box-sizing: border-box;
  overflow: hidden;

  span {
    display: inline-block;
    vertical-align: middle;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    flex: 1;
  }
}

.text-simulator {
  white-space: pre-wrap;
  border: 1px dashed gray;
  box-sizing: border-box;
  overflow-y: auto;
}
</style>
