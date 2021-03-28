<template>
  <div class="container" ref="window-container">
    <resource-master-info-form
      :windowKey="windowKey"
      :isAdd="true"
      :systemColumnType="null"
      initTabTarget="basic"
      :name.sync="name"
      :resourceType.sync="resourceType"
      :isAutoAddActor.sync="isAutoAddActor"
      :isAutoAddMapObject.sync="isAutoAddMapObject"
      :iconImageKey.sync="iconImageKey"
      :iconImageTag.sync="iconImageTag"
      :iconImageDirection.sync="iconImageDirection"
      :refProperty.sync="refProperty"
      :min.sync="min"
      :max.sync="max"
      :interval.sync="interval"
      :selectionStr.sync="selectionStr"
      :defaultValueStr.sync="defaultValueStr"
      :defaultValueNumber.sync="defaultValueNumber"
      :defaultValueBoolean.sync="defaultValueBoolean"
      :defaultValueColor.sync="defaultValueColor"
    />

    <button-area
      :is-commit-able="isCommitAble()"
      commit-text="add"
      @commit="commit()"
      @rollback="rollback()"
    />
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { ResourceMasterStore } from "@/@types/store-data";
import {
  Direction,
  RefProperty,
  ResourceType
} from "@/@types/store-data-optional";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import {
  convertBooleanFalse,
  convertNumberZero
} from "@/app/core/utility/PrimaryDataUtility";
import WindowVue from "@/app/core/window/WindowVue";
import LanguageManager from "@/LanguageManager";
import ResourceMasterInfoForm from "@/app/basic/initiative/ResourceMasterInfoForm.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import { parseColor } from "@/app/core/utility/ColorUtility";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import AddWindowDelegator, {
  AddWindow
} from "@/app/core/window/AddWindowDelegator";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";

@Component({ components: { ButtonArea, ResourceMasterInfoForm } })
export default class ResourceMasterAddWindow
  extends Mixins<WindowVue<ResourceMasterStore, boolean>>(WindowVue)
  implements AddWindow<ResourceMasterStore> {
  private addWindowDelegator = new AddWindowDelegator<
    ResourceMasterStore,
    "name"
  >(
    this,
    SocketFacade.instance.resourceMasterCC().collectionNameSuffix,
    "name"
  );

  private name: string = LanguageManager.instance.getText("label.resource");
  private resourceType: ResourceType = "no-contents";
  private isAutoAddActor: boolean = false;
  private isAutoAddMapObject: boolean = true;
  private iconImageKey: string | null = null;
  private iconImageTag: string | null = null;
  private iconImageDirection: Direction = "none";
  private refProperty: RefProperty | null = null;
  private min: number | null = null;
  private max: number | null = null;
  private interval: number | null = null;
  private selectionStr: string | null = null;
  private defaultValueStr: string = "";
  private defaultValueNumber: number = 0;
  private defaultValueBoolean: boolean = false;
  private defaultValueColor: string = "#000000";

  @LifeCycle
  public async mounted() {
    await this.addWindowDelegator.init();
    this.inputEnter("input:not([type='button'])", this.commit);
  }

  public isCommitAble(): boolean {
    return !!this.name && !this.isDuplicate();
  }

  public isDuplicate(): boolean {
    return this.addWindowDelegator.isDuplicateBasic(this.name);
  }

  @Watch("name")
  private onChangeIsDuplicate() {
    this.windowInfo.message = this.addWindowDelegator.onChangeIsDuplicateBasic();
  }

  @VueEvent
  private async commit() {
    await this.addWindowDelegator.commit();
  }

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing2(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    return await this.addWindowDelegator.windowCloseClosing(task);
  }

  @VueEvent
  private async rollback() {
    await this.addWindowDelegator.rollback();
  }

  public setStoreData(data: ResourceMasterStore): void {
    this.name = data.name;
    this.resourceType = data.type;
    this.isAutoAddActor = data.isAutoAddActor;
    this.isAutoAddMapObject = data.isAutoAddMapObject;
    this.iconImageKey = data.icon.mediaKey;
    this.iconImageTag = data.icon.mediaTag;
    this.iconImageDirection = data.icon.imageDirection!;
    this.refProperty = data.refProperty;
    this.min = data.min;
    this.max = data.max;
    this.interval = data.interval;
    this.selectionStr = data.selectionStr;
    this.setDefaultValueFromType(data.type, data.defaultValue);
  }

  public async getStoreDataList(): Promise<
    DelegateStoreData<ResourceMasterStore>[]
  > {
    const isNumber = this.resourceType === "number";
    const isRef =
      this.resourceType === "ref-normal" || this.resourceType === "ref-owner";
    const isSelection =
      this.resourceType === "select" || this.resourceType === "combo";
    return [
      {
        collection: SocketFacade.instance.resourceMasterCC()
          .collectionNameSuffix,
        data: {
          name: this.name,
          type: this.resourceType,
          systemColumnType: null,
          isAutoAddActor: this.isAutoAddActor,
          isAutoAddMapObject: this.isAutoAddMapObject,
          icon: {
            mediaKey: this.iconImageKey,
            mediaTag: this.iconImageTag,
            imageDirection: this.iconImageDirection
          },
          refProperty: isRef ? this.refProperty : null,
          min: isNumber ? this.min : null,
          max: isNumber ? this.max : null,
          interval: isNumber ? this.interval : null,
          selectionStr: isSelection ? this.selectionStr : null,
          defaultValue: ResourceMasterAddWindow.getDefaultValueFromType(
            this.resourceType,
            this.defaultValueStr,
            this.defaultValueNumber,
            this.defaultValueBoolean,
            this.defaultValueColor
          )
        }
      }
    ];
  }

  @Watch("resourceType")
  private onChangeResourceType() {
    if (this.resourceType === "combo" || this.resourceType === "select") {
      if (this.selectionStr === null) {
        this.selectionStr = "";
      }
    }
    if (this.resourceType === "number") {
      if (this.min === null || this.max === null || this.interval === null) {
        this.min = 0;
        this.max = 100;
        this.interval = 1;
      }
    }
    if (
      this.resourceType === "ref-owner" ||
      this.resourceType === "ref-normal"
    ) {
      if (this.refProperty === null) {
        this.refProperty = "name";
      }
    }
  }

  public static getDefaultValueFromType(
    type: ResourceType,
    str: string,
    num: number,
    bool: boolean,
    color: string
  ): string {
    switch (type) {
      case "text":
      case "input-text":
      case "select":
      case "combo":
        return str;
      case "number":
        return num.toString(10);
      case "check":
        return bool.toString();
      case "color":
        return color;
      default:
    }
    return "";
  }

  public setDefaultValueFromType(type: ResourceType, value: string): void {
    switch (type) {
      case "text":
      case "input-text":
      case "select":
      case "combo":
        this.defaultValueStr = value;
        return;
      case "number":
        this.defaultValueNumber = convertNumberZero(value);
        return;
      case "check":
        this.defaultValueBoolean = convertBooleanFalse(value);
        return;
      case "color":
        this.defaultValueColor = value;
        return;
      default:
    }
    return;
  }

  public static getDefaultValueFromValue(
    type: ResourceType,
    value: string
  ): { str: string; num: number; bool: boolean; color: string } {
    const result = {
      str: "",
      num: 0,
      bool: false,
      color: "#000000"
    };
    switch (type) {
      case "text":
      case "input-text":
      case "select":
      case "combo":
        result.str = value;
        break;
      case "number":
        result.num = convertNumberZero(value);
        break;
      case "check":
        result.bool = convertBooleanFalse(value);
        break;
      case "color":
        result.color = parseColor(value).getRGBA();
        break;
      default:
    }
    return result;
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.container {
  @include inline-flex-box(column, flex-start, flex-start);
  width: 100%;
  height: 100%;
}

.button-area {
  @include inline-flex-box(row, center, flex-start);
  width: 100%;
}
</style>
