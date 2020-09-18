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
        @dragend="dragEnd"
      >
        {{ text }}
      </div>
    </div>

    <!-- コマ情報 -->
    <table class="info-table">
      <tr>
        <tr-number-input-component
          labelName="label.width"
          inputWidth="3em"
          v-model="widthVolatile"
          :min="1"
        />
      </tr>
      <tr>
        <tr-number-input-component
          labelName="label.height"
          inputWidth="3em"
          v-model="heightVolatile"
          :min="1"
        />
      </tr>
    </table>

    <simple-tab-component
      :windowKey="windowKey"
      :tabList="tabList"
      v-model="currentTabInfo"
    >
      <!-- 背景タブ -->
      <div v-if="currentTabInfo.target === 'background'">
        <table>
          <tr>
            <tr-string-input-component
              labelName="label.text"
              width="100%"
              v-model="textVolatile"
            />
          </tr>
          <tr>
            <tr-color-picker-component
              labelName="label.color"
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
            <tr-string-input-component
              labelName="label.tag"
              width="100%"
              v-model="tagVolatile"
            />
          </tr>
          <tr>
            <tr-string-input-component
              labelName="label.name"
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
      <other-text-edit-component
        v-if="currentTabInfo.target === 'other-text'"
        v-model="otherTextListVolatile"
        :windowKey="windowKey"
      />
    </simple-tab-component>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import TaskProcessor from "../../../core/task/TaskProcessor";
import LifeCycle from "../../../core/decorator/LifeCycle";
import ComponentVue from "../../../core/window/ComponentVue";
import { TabInfo } from "@/@types/window";
import VueEvent from "../../../core/decorator/VueEvent";
import { parseColor } from "@/app/core/utility/ColorUtility";
import TrNumberInputComponent from "../../common/components/TrNumberInputComponent.vue";
import SimpleTabComponent from "../../../core/component/SimpleTabComponent.vue";
import TrStringInputComponent from "../../common/components/TrStringInputComponent.vue";
import TrColorPickerComponent from "../../common/components/TrColorPickerComponent.vue";
import SceneLayerSelect from "../../common/components/select/SceneLayerSelect.vue";
import { StoreUseData } from "@/@types/store";
import { MemoStore } from "@/@types/gameObject";
import OtherTextEditComponent from "@/app/basic/other-text/OtherTextEditComponent.vue";

@Component({
  components: {
    OtherTextEditComponent,
    SceneLayerSelect,
    TrColorPickerComponent,
    TrStringInputComponent,
    SimpleTabComponent,
    TrNumberInputComponent
  }
})
export default class MapMaskInfoForm extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private windowKey!: string;

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

  @Prop({ type: Array, required: true })
  private otherTextList!: StoreUseData<MemoStore>[];
  private otherTextListVolatile: StoreUseData<MemoStore>[] = [];
  @Watch("otherTextList", { immediate: true })
  private onChangeOtherTextList(value: StoreUseData<MemoStore>[]) {
    this.otherTextListVolatile = value;
  }
  @Watch("otherTextListVolatile")
  private onChangeOtherTextListVolatile(value: StoreUseData<MemoStore>[]) {
    this.$emit("update:otherTextList", value);
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
    { key: "1", target: "background", text: "" },
    { key: "2", target: "additional-info", text: "" },
    { key: "3", target: "other-text", text: "" }
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
    this.tabList.forEach(t => {
      t.text = this.$t(`label.${t.target}`)!.toString();
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

  @VueEvent
  private dragEnd(event: DragEvent) {
    this.$emit("drag-end", event);
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
    height: calc(100% - 2em);
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
    padding: 0;

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
