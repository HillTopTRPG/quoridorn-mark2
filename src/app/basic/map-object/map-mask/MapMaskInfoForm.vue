<template>
  <div class="map-mask-info-form">
    <!-- 掴む -->
    <div class="object-cell">
      <div
        class="object"
        :class="{ 'type-add': isAdd }"
        ref="object"
        :draggable="isAdd"
        @dragstart="dragStart"
      >
        {{ text }}
      </div>
    </div>

    <!-- コマ情報 -->
    <table class="info-table">
      <tr>
        <number-input-tr-component
          labelName="width"
          inputWidth="3em"
          v-model="widthVolatile"
          :min="1"
        />
      </tr>
      <tr>
        <number-input-tr-component
          labelName="height"
          inputWidth="3em"
          v-model="heightVolatile"
          :min="1"
        />
      </tr>
    </table>

    <simple-tab-component :tabList="tabList" v-model="currentTabInfo">
      <!-- 背景タブ -->
      <div v-if="currentTabInfo.target === 'background'">
        <table>
          <tr>
            <string-input-tr-component
              labelName="text"
              width="100%"
              v-model="textVolatile"
            />
          </tr>
          <tr>
            <color-picker-tr-component
              labelName="color"
              v-model="colorVolatile"
            />
          </tr>
        </table>
      </div>
      <!-- 追加情報タブ -->
      <div
        class="layer-block"
        v-if="currentTabInfo.target === 'additional-info'"
      >
        <table>
          <tr>
            <string-input-tr-component
              labelName="tag"
              width="100%"
              v-model="tagVolatile"
            />
          </tr>
          <tr>
            <string-input-tr-component
              labelName="name"
              width="100%"
              v-model="nameVolatile"
            />
          </tr>
          <tr>
            <th>
              <label
                :for="`${key}-layer`"
                class="label-layer label-input"
                v-t="'label.layer'"
              ></label>
            </th>
            <td class="value-cell">
              <scene-layer-select
                v-model="layerIdVolatile"
                :id="`${key}-layer`"
              />
            </td>
          </tr>
        </table>
      </div>

      <!-- その他欄タブ -->
      <textarea
        v-if="currentTabInfo.target === 'other-text'"
        v-model="otherTextVolatile"
      ></textarea>
    </simple-tab-component>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { parseColor } from "@/app/core/Utility";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import ColorPickerComponent from "@/app/core/component/ColorPickerComponent.vue";
import BaseInput from "@/app/core/component/BaseInput.vue";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import VueEvent from "@/app/core/decorator/VueEvent";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import SeekBarComponent from "@/app/basic/music/SeekBarComponent.vue";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import LanguageManager from "@/LanguageManager";
import { TabInfo } from "@/@types/window";
import SceneLayerSelect from "@/app/basic/common/components/select/SceneLayerSelect.vue";
import StringInputTrComponent from "@/app/basic/common/components/StringInputTrComponent.vue";
import NumberInputTrComponent from "@/app/basic/common/components/NumberInputTrComponent.vue";
import ColorPickerTrComponent from "@/app/basic/common/components/ColorPickerTrComponent.vue";
import ComponentVue from "@/app/core/window/ComponentVue";

@Component({
  components: {
    ColorPickerTrComponent,
    NumberInputTrComponent,
    StringInputTrComponent,
    SceneLayerSelect,
    SimpleTabComponent,
    ColorPickerComponent,
    BaseInput,
    SeekBarComponent,
    CtrlButton
  }
})
export default class MapMaskInfoForm extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, default: "image" })
  private initTabTarget!: string;

  @Prop({ type: Boolean, required: true })
  private isAdd!: boolean;

  private isMounted: boolean = false;

  @Prop({ type: String, required: true })
  private name!: string;

  private nameVolatile: string = "";
  @Watch("name", { immediate: true })
  private onChangeName(value: string) {
    this.nameVolatile = value;
  }
  @Watch("nameVolatile")
  private onChangeNameVolatile(value: string) {
    this.$emit("update:name", value);
  }

  @Prop({ type: String, required: true })
  private text!: string;

  private textVolatile: string = "";
  @Watch("text", { immediate: true })
  private onChangeText(value: string) {
    this.textVolatile = value;
  }
  @Watch("textVolatile")
  private onChangeTextVolatile(value: string) {
    this.$emit("update:text", value);
  }

  @Prop({ type: String, required: true })
  private color!: string;

  private colorVolatile: string = "";
  @Watch("color", { immediate: true })
  private onChangeColor(value: string) {
    this.colorVolatile = value;
  }
  @Watch("colorVolatile")
  private onChangeColorVolatile(value: string) {
    this.$emit("update:color", value);
  }

  @Prop({ type: String, required: true })
  private tag!: string;

  private tagVolatile: string = "";
  @Watch("tag", { immediate: true })
  private onChangeTag(value: string) {
    this.tagVolatile = value;
  }
  @Watch("tagVolatile")
  private onChangeTagVolatile(value: string) {
    this.$emit("update:tag", value);
  }

  @Prop({ type: String, required: true })
  private otherText!: string;

  private otherTextVolatile: string = "";
  @Watch("otherText", { immediate: true })
  private onChangeOtherText(value: string) {
    this.otherTextVolatile = value;
  }
  @Watch("otherTextVolatile")
  private onChangeOtherTextVolatile(value: string) {
    this.$emit("update:otherText", value);
  }

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

  @Prop({ type: Number, required: true })
  private height!: number;

  private heightVolatile: number = 0;
  @Watch("height", { immediate: true })
  private onChangeHeight(value: number) {
    this.heightVolatile = value;
  }
  @Watch("heightVolatile")
  private onChangeHeightVolatile(value: number) {
    this.$emit("update:height", value);
  }

  @Prop({ type: String, required: true })
  private layerId!: string;

  private layerIdVolatile: string = "";
  @Watch("layerId", { immediate: true })
  private onChangeLayerId(value: string) {
    this.layerIdVolatile = value;
  }
  @Watch("layerIdVolatile")
  private onChangeLayerIdVolatile(value: string) {
    this.$emit("update:layerId", value);
  }

  private tabList: TabInfo[] = [
    { target: "background", text: "" },
    { target: "additional-info", text: "" },
    { target: "other-text", text: "" }
  ];
  private currentTabInfo: TabInfo | null = this.tabList[0];

  @TaskProcessor("language-change-finished")
  private async languageChangeFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    this.createTabInfoList();
    task.resolve();
  }

  @LifeCycle
  private async created() {
    this.createTabInfoList();
  }

  private createTabInfoList() {
    const getText = LanguageManager.instance.getText.bind(
      LanguageManager.instance
    );
    this.tabList.forEach(t => {
      t.text = getText(`label.${t.target}`);
    });
  }

  @LifeCycle
  public async mounted() {
    this.isMounted = true;
  }

  private get objectElm(): HTMLElement {
    return this.$refs.object as HTMLElement;
  }

  @VueEvent
  private dragStart(event: DragEvent) {
    this.$emit("drag-start", event);
  }

  @Watch("isMounted")
  @Watch("width")
  @Watch("height")
  private onChangeSize() {
    if (!this.isMounted) return;
    let ratio: number = Math.min(4 / this.width, 4 / this.height, 1);
    this.objectElm.style.setProperty(
      "--width-ratio",
      (this.width * ratio).toString()
    );
    this.objectElm.style.setProperty(
      "--height-ratio",
      (this.height * ratio).toString()
    );
  }

  @Watch("isMounted")
  @Watch("color")
  private onChangeColor2() {
    if (!this.isMounted) return;
    const colorObj = parseColor(this.color);
    const backColor = colorObj.getRGBA();
    this.objectElm.style.setProperty("--back-color", backColor);
    const fontColor = colorObj.getRGBReverse();
    this.objectElm.style.setProperty("--font-color", fontColor);
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.map-mask-info-form {
  display: contents;
}

.object {
  @include flex-box(row, center, center);
  width: calc(var(--width-ratio) * 3em);
  height: calc(var(--height-ratio) * 3em);
  background-color: var(--back-color);
  color: var(--font-color);
  white-space: normal;
  box-sizing: border-box;
  word-break: break-all;
  text-align: center;

  &.type-add {
    cursor: grab;

    &:active {
      cursor: grabbing;
    }
  }
}

.simple-tab-component {
  grid-row: 1 / 3;
  grid-column: 2 / 3;

  > *:not(:first-child) {
    width: 100%;
    flex: 1;
  }

  table {
    box-sizing: border-box;

    th {
      text-align: right;
    }

    td {
      text-align: left;
    }
  }

  > div:not(.image-picker-container) {
    border: solid 1px gray;
    box-sizing: border-box;
    padding: 0.2rem;
  }

  textarea {
    resize: none;
    padding: 0;
    box-sizing: border-box;
  }
}

.object-cell {
  grid-row: 1 / 2;
  grid-column: 1 / 2;
  @include flex-box(row, center, center);
}

> table {
  grid-row: 2 / 3;
  grid-column: 1 / 2;

  th,
  td {
    > div {
      @include flex-box(row, flex-start, center);
    }
    label {
      @include inline-flex-box(row, flex-start, center);
    }
  }

  th {
    text-align: right;
    padding: 0;
    white-space: nowrap;
    width: 1px;
  }

  td {
    text-align: left;
    padding: 0;

    input {
      margin: 0;
    }
  }
}
</style>
