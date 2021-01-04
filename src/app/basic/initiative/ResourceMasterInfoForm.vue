<template>
  <div class="resource-master-info-form">
    <simple-tab-component
      :windowKey="windowKey"
      :tabList="tabList"
      v-model="currentTabInfo"
    >
      <!-- 追加情報タブ -->
      <div class="basic-block" v-if="currentTabInfo.target === 'basic'">
        <table>
          <tr>
            <tr-string-input-component
              labelName="label.name"
              width="100%"
              v-model="nameVolatile"
            />
          </tr>
          <tr>
            <tr-checkbox-component
              labelName="resource-master-info-form.label.auto-add-actor"
              width="100%"
              c-label=""
              n-label=""
              v-model="isAutoAddActorVolatile"
            />
          </tr>
          <tr>
            <tr-checkbox-component
              labelName="resource-master-info-form.label.auto-add-map-object"
              width="100%"
              c-label=""
              n-label=""
              v-model="isAutoAddMapObjectVolatile"
            />
          </tr>
          <tr>
            <tr-resource-type-select-component
              labelName="selection.resource-type.label"
              width="100%"
              :readonly="!!systemColumnType"
              v-model="resourceTypeVolatile"
            />
          </tr>
          <tr>
            <tr-ref-property-select-component
              v-if="
                resourceType === 'ref-normal' || resourceType === 'ref-owner'
              "
              :readonly="!!systemColumnType"
              labelName="selection.ref-property.label"
              width="100%"
              v-model="refPropertyVolatile"
            />
          </tr>
          <tr>
            <tr-number-input-component
              v-if="resourceType === 'number'"
              labelName="resource-master-info-form.label.value-min"
              width="100%"
              v-model="minVolatile"
            />
          </tr>
          <tr>
            <tr-number-input-component
              v-if="resourceType === 'number'"
              labelName="resource-master-info-form.label.value-max"
              width="100%"
              v-model="maxVolatile"
            />
          </tr>
          <tr>
            <tr-number-input-component
              v-if="resourceType === 'number'"
              labelName="resource-master-info-form.label.value-interval"
              width="100%"
              v-model="intervalVolatile"
            />
          </tr>
          <tr>
            <tr-string-input-component
              v-if="resourceType === 'select' || resourceType === 'combo'"
              labelName="resource-master-info-form.label.value-selection"
              width="100%"
              v-model="selectionStrVolatile"
            />
          </tr>
          <tr>
            <tr-selection-value-select-component
              v-if="resourceType === 'select'"
              labelName="resource-master-info-form.label.value-selection-value"
              :selection="selectionStrVolatile"
              width="100%"
              v-model="defaultValueStrVolatile"
            />
          </tr>
          <tr>
            <tr-string-input-component
              v-if="resourceType === 'text'"
              labelName="label.char"
              width="100%"
              v-model="defaultValueStrVolatile"
            />
          </tr>
          <tr>
            <tr-string-input-component
              v-if="resourceType === 'input-text' || resourceType === 'combo'"
              labelName="resource-master-info-form.label.value-default"
              width="100%"
              v-model="defaultValueStrVolatile"
            />
          </tr>
          <tr>
            <tr-number-input-component
              v-if="resourceType === 'number'"
              labelName="resource-master-info-form.label.value-default"
              width="100%"
              v-model="defaultValueNumberVolatile"
            />
          </tr>
          <tr>
            <tr-checkbox-component
              v-if="resourceType === 'check'"
              labelName="resource-master-info-form.label.value-default"
              width="100%"
              c-label=""
              n-label=""
              v-model="defaultValueBooleanVolatile"
            />
          </tr>
          <tr>
            <tr-color-picker-component
              v-if="resourceType === 'color'"
              labelName="resource-master-info-form.label.value-default"
              width="100%"
              :useAlpha="false"
              v-model="defaultValueColorVolatile"
            />
          </tr>
        </table>
      </div>

      <!-- 画像タブ -->
      <image-picker-component
        v-if="currentTabInfo.target === 'icon'"
        v-model="iconImageKeyVolatile"
        :windowKey="key"
        :mediaTag.sync="iconImageTagVolatile"
        :direction.sync="iconImageDirectionVolatile"
        ref="imagePicker"
        :is-simple.sync="isSimple"
      />
    </simple-tab-component>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import TaskProcessor from "../../core/task/TaskProcessor";
import LifeCycle from "../../core/decorator/LifeCycle";
import ComponentVue from "../../core/window/ComponentVue";
import { Direction, ResourceType } from "@/@types/store-data-optional";
import TrColorPickerComponent from "../common/components/TrColorPickerComponent.vue";
import TrRefPropertySelectComponent from "../common/components/TrRefPropertySelectComponent.vue";
import TrCheckboxComponent from "../common/components/TrCheckboxComponent.vue";
import ImagePickerComponent from "../../core/component/ImagePickerComponent.vue";
import TrResourceTypeSelectComponent from "../common/components/TrResourceTypeSelectComponent.vue";
import TrStringInputComponent from "../common/components/TrStringInputComponent.vue";
import { TabInfo } from "@/@types/window";
import TrNumberInputComponent from "../common/components/TrNumberInputComponent.vue";
import SimpleTabComponent from "../../core/component/SimpleTabComponent.vue";
import TrSelectionValueSelectComponent from "../common/components/TrSelectionValueSelectComponent.vue";

@Component({
  components: {
    TrSelectionValueSelectComponent,
    ImagePickerComponent,
    TrColorPickerComponent,
    TrNumberInputComponent,
    TrRefPropertySelectComponent,
    TrResourceTypeSelectComponent,
    TrCheckboxComponent,
    TrStringInputComponent,
    SimpleTabComponent
  }
})
export default class ResourceMasterInfoForm extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private windowKey!: string;

  @Prop({ type: String, default: "basic" })
  private initTabTarget!: string;

  @Prop({ type: String, default: null })
  private systemColumnType!: "name" | "initiative" | null;

  @Prop({ type: Boolean, required: true })
  private isAdd!: boolean;

  private isMounted: boolean = false;
  private isSimple: boolean = true;

  // name
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

  // resourceType
  @Prop({ type: String, required: true })
  private resourceType!: ResourceType;
  private resourceTypeVolatile: ResourceType = "no-contents";
  @Watch("resourceType", { immediate: true })
  private onChangeResourceType(value: ResourceType) {
    this.resourceTypeVolatile = value;
  }
  @Watch("resourceTypeVolatile")
  private onChangeResourceTypeVolatile(value: ResourceType) {
    this.$emit("update:resourceType", value);
  }

  // isAutoAddActor
  @Prop({ type: Boolean, required: true })
  private isAutoAddActor!: boolean;
  private isAutoAddActorVolatile: boolean = false;
  @Watch("isAutoAddActor", { immediate: true })
  private onChangeIsAutoAddActor(value: boolean) {
    this.isAutoAddActorVolatile = value;
  }
  @Watch("isAutoAddActorVolatile")
  private onChangeIsAutoAddActorVolatile(value: boolean) {
    this.$emit("update:isAutoAddActor", value);
  }

  // isAutoAddMapObject
  @Prop({ type: Boolean, required: true })
  private isAutoAddMapObject!: boolean;
  private isAutoAddMapObjectVolatile: boolean = true;
  @Watch("isAutoAddMapObject", { immediate: true })
  private onChangeIsAutoAddMapObject(value: boolean) {
    this.isAutoAddMapObjectVolatile = value;
  }
  @Watch("isAutoAddMapObjectVolatile")
  private onChangeIsAutoAddMapObjectVolatile(value: boolean) {
    this.$emit("update:isAutoAddMapObject", value);
  }

  // iconImageKey
  @Prop({ type: String, default: null })
  private iconImageKey!: string | null;
  private iconImageKeyVolatile: string | null = null;
  @Watch("iconImageKey", { immediate: true })
  private onChangeIconImageKey(value: string | null) {
    this.iconImageKeyVolatile = value;
  }
  @Watch("iconImageKeyVolatile")
  private onChangeIconImageKeyVolatile(value: string | null) {
    this.$emit("update:iconImageKey", value);
  }

  // iconImageTag
  @Prop({ type: String, default: null })
  private iconImageTag!: string | null;
  private iconImageTagVolatile: string | null = null;
  @Watch("iconImageTag", { immediate: true })
  private onChangeIconImageTag(value: string | null) {
    this.iconImageTagVolatile = value;
  }
  @Watch("iconImageTagVolatile")
  private onChangeIconImageTagVolatile(value: string | null) {
    this.$emit("update:iconImageTag", value);
  }

  // iconImageDirection
  @Prop({ type: String, default: "none" })
  private iconImageDirection!: Direction;
  private iconImageDirectionVolatile: Direction = "none";
  @Watch("iconImageDirection", { immediate: true })
  private onChangeIconImageDirection(value: Direction) {
    this.iconImageDirectionVolatile = value;
  }
  @Watch("iconImageDirectionVolatile")
  private onChangeIconImageDirectionVolatile(value: Direction) {
    this.$emit("update:iconImageDirection", value);
  }

  // refProperty
  @Prop({ type: String, default: null })
  private refProperty!: string | null;
  private refPropertyVolatile: string | null = null;
  @Watch("refProperty", { immediate: true })
  private onChangeRefProperty(value: string | null) {
    this.refPropertyVolatile = value;
  }
  @Watch("refPropertyVolatile")
  private onChangeRefPropertyVolatile(value: string | null) {
    this.$emit("update:refProperty", value);
  }

  // min
  @Prop({ type: Number, default: null })
  private min!: number | null;
  private minVolatile: number | null = null;
  @Watch("min", { immediate: true })
  private onChangeMin(value: number | null) {
    this.minVolatile = value;
  }
  @Watch("minVolatile")
  private onChangeMinVolatile(value: number | null) {
    this.$emit("update:min", value);
  }

  // max
  @Prop({ type: Number, default: null })
  private max!: number | null;
  private maxVolatile: number | null = 100;
  @Watch("max", { immediate: true })
  private onChangeMax(value: number | null) {
    this.maxVolatile = value;
  }
  @Watch("maxVolatile")
  private onChangeMaxVolatile(value: number | null) {
    this.$emit("update:max", value);
  }

  // interval
  @Prop({ type: Number, default: null })
  private interval!: number | null;
  private intervalVolatile: number | null = 1;
  @Watch("interval", { immediate: true })
  private onChangeInterval(value: number | null) {
    this.intervalVolatile = value;
  }
  @Watch("intervalVolatile")
  private onChangeIntervalVolatile(value: number | null) {
    this.$emit("update:interval", value);
  }

  // selectionStr
  @Prop({ type: String, default: null })
  private selectionStr!: string | null;
  private selectionStrVolatile: string | null = "";
  @Watch("selectionStr", { immediate: true })
  private onChangeSelectionStr(value: string | null) {
    this.selectionStrVolatile = value;
  }
  @Watch("selectionStrVolatile")
  private onChangeSelectionStrVolatile(value: string | null) {
    this.$emit("update:selectionStr", value);
  }

  // defaultValueStr
  @Prop({ type: String, default: null })
  private defaultValueStr!: string | null;
  private defaultValueStrVolatile: string | null = "";
  @Watch("defaultValueStr", { immediate: true })
  private onChangeDefaultValueStr(value: string | null) {
    this.defaultValueStrVolatile = value;
  }
  @Watch("defaultValueStrVolatile")
  private onChangeDefaultValueStrVolatile(value: string | null) {
    this.$emit("update:defaultValueStr", value);
  }

  // defaultValueNumber
  @Prop({ type: Number, default: null })
  private defaultValueNumber!: number | null;
  private defaultValueNumberVolatile: number | null = 0;
  @Watch("defaultValueNumber", { immediate: true })
  private onChangeDefaultValueNumber(value: number | null) {
    this.defaultValueNumberVolatile = value;
  }
  @Watch("defaultValueNumberVolatile")
  private onChangeDefaultValueNumberVolatile(value: number | null) {
    this.$emit("update:defaultValueNumber", value);
  }

  // defaultValueBoolean
  @Prop({ type: Boolean, default: false })
  private defaultValueBoolean!: boolean | null;
  private defaultValueBooleanVolatile: boolean | null = null;
  @Watch("defaultValueBoolean", { immediate: true })
  private onChangeDefaultValueBoolean(value: boolean | null) {
    this.defaultValueBooleanVolatile = value;
  }
  @Watch("defaultValueBooleanVolatile")
  private onChangeDefaultValueBooleanVolatile(value: boolean | null) {
    this.$emit("update:defaultValueBoolean", value);
  }

  // defaultValueColor
  @Prop({ type: String, default: null })
  private defaultValueColor!: string | null;
  private defaultValueColorVolatile: string | null = null;
  @Watch("defaultValueColor", { immediate: true })
  private onChangeDefaultValueColor(value: string | null) {
    this.defaultValueColorVolatile = value;
  }
  @Watch("defaultValueColorVolatile")
  private onChangeDefaultValueColorVolatile(value: string | null) {
    this.$emit("update:defaultValueColor", value);
  }

  private tabList: TabInfo[] = [
    { key: "1", target: "basic", text: "", isDisabled: false },
    { key: "2", target: "icon", text: "", isDisabled: false }
  ];
  private currentTabInfo: TabInfo = this.tabList[0];

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
    this.currentTabInfo = this.tabList.find(
      t => t.target === this.initTabTarget
    )!;
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.resource-master-info-form {
  display: contents;
}

.simple-tab-component {
  width: 100%;
  height: 100%;

  > *:not(:first-child) {
    width: 100%;
    height: calc(100% - 2em);
    flex: 1;
  }

  > div:not(.image-picker-component) {
    border: solid 1px gray;
    box-sizing: border-box;
    padding: 0.2rem;
  }
}

table {
  width: 100%;

  th,
  td {
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
