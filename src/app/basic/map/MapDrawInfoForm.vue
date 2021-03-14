<template>
  <div class="map-draw-info-form">
    <!-- コマ情報 -->
    <table class="info-table">
      <tr>
        <tr-general-type-select-component
          type="map-draw-type"
          v-model="typeVolatile"
          :value-list="['line', 'polygon', 'text']"
          :readonly="disabled || !isAdd"
        />
      </tr>
      <tr>
        <tr-scene-layer-select-component
          labelName="label.layer"
          width="100%"
          v-model="sceneLayerKeyVolatile"
          :disabled="disabled"
        />
      </tr>
      <tr v-if="typeVolatile === 'text'">
        <tr-string-input-component
          labelName="label.text"
          v-model="valueVolatile"
          :multiline="true"
          :disabled="disabled"
          min-height="3em"
        />
      </tr>
      <tr v-if="typeVolatile !== 'text'">
        <tr-number-input-component
          labelName="label.line-width"
          inputWidth="3em"
          v-model="lineWidthVolatile"
          :min="1"
          :disabled="disabled"
        />
      </tr>
      <tr v-if="typeVolatile === 'polygon'">
        <tr-number-input-component
          labelName="label.vertex-num"
          inputWidth="3em"
          v-model="vertexNumVolatile"
          :min="3"
          :disabled="disabled"
        />
      </tr>
      <tr v-if="typeVolatile === 'text'">
        <tr-number-input-component
          labelName="label.font-size"
          inputWidth="3em"
          v-model="fontSizeVolatile"
          :min="8"
          :disabled="disabled"
        />
      </tr>
      <tr v-if="typeVolatile === 'text'">
        <tr-general-type-select-component
          type="text-style"
          v-model="styleDataVolatile"
          :value-list="['normal', 'bold', 'italic']"
          :readonly="disabled"
        />
      </tr>
      <tr v-if="typeVolatile !== 'text'">
        <tr-color-picker-component
          labelName="label.line-color"
          v-model="strokeStyleVolatile"
          :useAlpha="true"
          :disabled="disabled"
        />
      </tr>
      <tr v-if="typeVolatile !== 'line'">
        <tr-color-picker-component
          :labelName="
            typeVolatile === 'polygon'
              ? 'label.background-color'
              : 'label.font-color'
          "
          v-model="fillStyleVolatile"
          :useAlpha="true"
          :disabled="disabled"
        />
      </tr>
      <tr v-if="typeVolatile === 'text'">
        <tr-general-type-select-component
          type="anchor"
          v-model="textAnchorVolatile"
          :value-list="[
            'left-top',
            'left-center',
            'left-bottom',
            'center-top',
            'center',
            'center-bottom',
            'right-top',
            'right-center',
            'right-bottom'
          ]"
          :readonly="disabled"
        />
      </tr>
      <tr v-if="typeVolatile === 'text'">
        <tr-number-input-component
          labelName="map-draw-info-form.label.correct-x"
          inputWidth="3em"
          v-model="correctionText.x"
          :disabled="disabled"
        />
      </tr>
      <tr v-if="typeVolatile === 'text'">
        <tr-number-input-component
          labelName="map-draw-info-form.label.correct-y"
          inputWidth="3em"
          v-model="correctionText.y"
          :disabled="disabled"
        />
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import OtherTextEditComponent from "@/app/basic/other-text/OtherTextEditComponent.vue";
import ComponentVue from "@/app/core/window/ComponentVue";
import ImagePickerComponent from "@/app/core/component/ImagePickerComponent.vue";
import BackgroundLocationSelect from "@/app/basic/common/components/select/BackgroundLocationSelect.vue";
import TrStringInputComponent from "@/app/basic/common/components/table-item/TrStringInputComponent.vue";
import SceneLayerSelect from "@/app/basic/common/components/select/SceneLayerSelect.vue";
import TrNumberInputComponent from "@/app/basic/common/components/table-item/TrNumberInputComponent.vue";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import TrColorPickerComponent from "@/app/basic/common/components/table-item/TrColorPickerComponent.vue";
import TrGeneralTypeSelectComponent from "@/app/basic/common/components/table-item/TrGeneralTypeSelectComponent.vue";
import { Anchor } from "address";
import { Point } from "@/@types/store-data-optional";
import { createPoint } from "@/app/core/utility/CoordinateUtility";
import { MapDrawType } from "@/@types/store-data";
import TrSceneLayerSelectComponent from "@/app/basic/common/components/table-item/TrSceneLayerSelectComponent.vue";

@Component({
  components: {
    TrSceneLayerSelectComponent,
    TrGeneralTypeSelectComponent,
    TrColorPickerComponent,
    OtherTextEditComponent,
    SceneLayerSelect,
    TrStringInputComponent,
    ImagePickerComponent,
    SimpleTabComponent,
    BackgroundLocationSelect,
    TrNumberInputComponent
  }
})
export default class MapDrawInfoForm extends Mixins<ComponentVue>(
  ComponentVue
) {
  // type
  @Prop({ type: String, required: true })
  private type!: MapDrawType;
  private typeVolatile: MapDrawType = "line";
  @Watch("type", { immediate: true })
  private onChangeType(value: MapDrawType) {
    this.typeVolatile = value;
  }
  @Watch("typeVolatile")
  private onChangeTypeVolatile(value: MapDrawType) {
    this.$emit("update:type", value);
    if (value === "text") {
      this.styleDataVolatile = "normal";
    } else {
      this.styleDataVolatile = "solid";
    }
  }

  // sceneLayerKey
  @Prop({ type: String, required: true })
  private sceneLayerKey!: string;
  private sceneLayerKeyVolatile: string = "";
  @Watch("sceneLayerKey", { immediate: true })
  private onChangeSceneLayerKey(value: string) {
    this.sceneLayerKeyVolatile = value;
  }
  @Watch("sceneLayerKeyVolatile")
  private onChangeSceneLayerKeyVolatile(value: string) {
    this.$emit("update:sceneLayerKey", value);
  }

  @Prop({ type: Boolean, required: true })
  private isAdd!: boolean;
  @Prop({ type: Boolean, default: false })
  private disabled!: boolean;

  // lineWidth
  @Prop({ type: Number, required: true })
  private lineWidth!: number;
  private lineWidthVolatile: number = 1;
  @Watch("lineWidth", { immediate: true })
  private onChangeLineWidth(value: number) {
    this.lineWidthVolatile = value;
  }
  @Watch("lineWidthVolatile")
  private onChangeLineWidthVolatile(value: number) {
    this.$emit("update:lineWidth", value);
  }

  // fillStyle
  @Prop({ type: String, required: true })
  private fillStyle!: string;
  private fillStyleVolatile: string = "#000000";
  @Watch("fillStyle", { immediate: true })
  private onChangeFillStyle(value: string) {
    this.fillStyleVolatile = value;
  }
  @Watch("fillStyleVolatile")
  private onChangeFillStyleVolatile(value: string) {
    this.$emit("update:fillStyle", value);
  }

  // strokeStyle
  @Prop({ type: String, required: true })
  private strokeStyle!: string;
  private strokeStyleVolatile: string = "#000000";
  @Watch("strokeStyle", { immediate: true })
  private onChangeStrokeStyle(value: string) {
    this.strokeStyleVolatile = value;
  }
  @Watch("strokeStyleVolatile")
  private onChangeStrokeStyleVolatile(value: string) {
    this.$emit("update:strokeStyle", value);
  }

  // value
  @Prop({ type: String, required: true })
  private value!: string;
  private valueVolatile: string = "";
  @Watch("value", { immediate: true })
  private onChangeValue(value: string) {
    this.valueVolatile = value;
  }
  @Watch("valueVolatile")
  private onChangeValueVolatile(value: string) {
    this.$emit("update:value", value);
  }

  // vertexNum
  @Prop({ type: Number, required: true })
  private vertexNum!: number;
  private vertexNumVolatile: number = 3;
  @Watch("vertexNum", { immediate: true })
  private onChangeVertexNum(value: number) {
    this.vertexNumVolatile = value;
  }
  @Watch("vertexNumVolatile")
  private onChangeVertexNumVolatile(value: number) {
    this.$emit("update:vertexNum", value);
  }

  // fontSize
  @Prop({ type: Number, required: true })
  private fontSize!: number;
  private fontSizeVolatile: number = 24;
  @Watch("fontSize", { immediate: true })
  private onChangeFontSize(value: number) {
    this.fontSizeVolatile = value;
  }
  @Watch("fontSizeVolatile")
  private onChangeFontSizeVolatile(value: number) {
    this.$emit("update:fontSize", value);
  }

  // textAnchor
  @Prop({ type: String, required: true })
  private textAnchor!: Anchor;
  private textAnchorVolatile: Anchor = "center";
  @Watch("textAnchor", { immediate: true })
  private onChangeTextAnchor(value: Anchor) {
    this.textAnchorVolatile = value;
  }
  @Watch("textAnchorVolatile")
  private onChangeTextAnchorVolatile(value: Anchor) {
    this.$emit("update:textAnchor", value);
  }

  // styleData
  @Prop({ type: String, required: true })
  private styleData!: string;
  private styleDataVolatile: string = "";
  @Watch("styleData", { immediate: true })
  private onChangeStyleData(value: string) {
    this.styleDataVolatile = value;
  }
  @Watch("styleDataVolatile")
  private onChangeStyleDataVolatile(value: string) {
    this.$emit("update:styleData", value);
  }

  // correctionText
  @Prop({ type: Object, required: true })
  private correctionText!: Point;
  private correctionTextVolatile: Point = createPoint(0, 0);
  @Watch("correctionText", { immediate: true })
  private onChangeCorrectionText(value: Point) {
    this.correctionTextVolatile = value;
  }
  @Watch("correctionTextVolatile")
  private onChangeCorrectionTextVolatile(value: Point) {
    this.$emit("update:correctionText", value);
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.map-draw-info-form {
  display: contents;
}
</style>
