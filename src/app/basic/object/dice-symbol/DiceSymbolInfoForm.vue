<template>
  <div class="dice-symbol-info-form">
    <!-- 掴む -->
    <div class="object-cell">
      <div
        class="object"
        :class="{ 'type-add': isAdd }"
        ref="object"
        :draggable="isAdd"
        @dragstart="dragStart"
        @dragend="dragEnd"
      ></div>
    </div>

    <!-- コマ情報 -->
    <table class="info-table">
      <tr>
        <tr-dice-select-component
          labelName="label.dice-type"
          v-model="diceTypeIdVolatile"
        />
      </tr>
      <tr>
        <tr-pips-select-component
          labelName="label.pips"
          :diceTypeId="diceTypeIdVolatile"
          v-model="pipsVolatile"
        />
      </tr>
      <tr>
        <tr-number-input-component
          labelName="label.size"
          inputWidth="3em"
          v-model="sizeVolatile"
          :min="1"
        />
      </tr>
    </table>

    <simple-tab-component
      :windowKey="windowKey"
      :tabList="tabList"
      v-model="currentTabInfo"
    >
      <!-- 追加情報タブ -->
      <div
        class="layer-block"
        v-if="currentTabInfo.target === 'additional-info'"
      >
        <table>
          <tr>
            <tr-color-picker-component
              labelName="label.background-color"
              v-model="colorVolatile"
            />
          </tr>
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
            <tr-scene-layer-select-component
              labelName="label.layer"
              width="100%"
              v-model="layerIdVolatile"
            />
          </tr>
        </table>
      </div>
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
import TrSceneLayerSelectComponent from "@/app/basic/common/components/TrSceneLayerSelectComponent.vue";
import TrDiceSelectComponent from "@/app/basic/common/components/TrDiceSelectComponent.vue";
import TrPipsSelectComponent from "@/app/basic/common/components/TrPipsSelectComponent.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { findRequireById } from "@/app/core/utility/Utility";

@Component({
  components: {
    TrPipsSelectComponent,
    TrDiceSelectComponent,
    TrSceneLayerSelectComponent,
    SceneLayerSelect,
    TrColorPickerComponent,
    TrStringInputComponent,
    SimpleTabComponent,
    TrNumberInputComponent
  }
})
export default class DiceSymbolInfoForm extends Mixins<ComponentVue>(
  ComponentVue
) {
  private diceAndPipsList = GameObjectManager.instance.diceAndPipsList;
  private mediaList = GameObjectManager.instance.mediaList;

  @Prop({ type: String, required: true })
  private windowKey!: string;

  @Prop({ type: String, default: "image" })
  private initTabTarget!: string;

  @Prop({ type: Boolean, required: true })
  private isAdd!: boolean;

  private isMounted: boolean = false;
  private diceImageUrl: string = "";

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

  // size
  @Prop({ type: Number, required: true })
  private size!: number;
  private sizeVolatile: number = 1;
  @Watch("size", { immediate: true })
  private onChangeSize(value: number) {
    this.sizeVolatile = value;
  }
  @Watch("sizeVolatile")
  private onChangeSizeVolatile(value: number) {
    this.$emit("update:size", value);
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

  // diceTypeId
  @Prop({ type: String, required: true })
  private diceTypeId!: string;
  private diceTypeIdVolatile: string = "6";
  @Watch("diceTypeId", { immediate: true })
  private onChangeDiceTypeId(value: string) {
    this.diceTypeIdVolatile = value;
  }
  @Watch("diceTypeIdVolatile")
  private onChangeDiceTypeIdVolatile(value: string) {
    const pipsList = this.diceAndPipsList
      .filter(dap => dap.data!.diceTypeId === this.diceTypeIdVolatile)
      .map(dap => dap.data!.pips);
    if (!pipsList.some(p => p === this.pipsVolatile)) {
      this.pipsVolatile = pipsList.find(p => p === "1") || pipsList[0];
    }
    this.$emit("update:diceTypeId", value);
    this.updateDiceImage();
  }

  // pips
  @Prop({ type: String, required: true })
  private pips!: string;
  private pipsVolatile: string = "1";
  @Watch("pips", { immediate: true })
  private onChangePips(value: string) {
    this.pipsVolatile = value;
  }
  @Watch("pipsVolatile")
  private onChangePipsVolatile(value: string) {
    this.$emit("update:pips", value);
    this.updateDiceImage();
  }

  private tabList: TabInfo[] = [
    { key: "1", target: "additional-info", text: "" }
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
    this.updateDiceImage();
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
  @Watch("size")
  private onChangeSize2() {
    if (!this.isMounted) return;
    let ratio: number = Math.min(4 / this.size, 4 / this.size, 1);
    this.objectElm.style.setProperty(
      "--width-ratio",
      (this.size * ratio).toString()
    );
    this.objectElm.style.setProperty(
      "--height-ratio",
      (this.size * ratio).toString()
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

  private updateDiceImage() {
    const diceAndPips = this.diceAndPipsList.find(
      dap =>
        dap.data!.diceTypeId === this.diceTypeIdVolatile &&
        dap.data!.pips === this.pipsVolatile
    );
    const mediaId = diceAndPips!.data!.mediaId;
    const media = findRequireById(this.mediaList, mediaId);
    this.diceImageUrl = media.data!.url;
    this.objectElm.style.setProperty("--imageSrc", `url(${this.diceImageUrl})`);
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.dice-symbol-info-form {
  display: contents;
}

.object {
  @include flex-box(row, center, center);
  width: calc(var(--width-ratio) * 3em);
  height: calc(var(--height-ratio) * 3em);
  background-image: var(--imageSrc);
  background-position: center;
  background-size: contain;
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
