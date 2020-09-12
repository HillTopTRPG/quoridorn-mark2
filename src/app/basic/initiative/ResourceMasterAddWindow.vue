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
      :iconImageId.sync="iconImageId"
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

    <div class="button-area">
      <ctrl-button @click="commit()">
        <span v-t="'button.add'"></span>
      </ctrl-button>
      <ctrl-button @click="rollback()">
        <span v-t="'button.reject'"></span>
      </ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import LifeCycle from "../../core/decorator/LifeCycle";
import {
  convertBooleanFalse,
  convertNumberZero
} from "../../core/utility/PrimaryDataUtility";
import SocketFacade from "../../core/api/app-server/SocketFacade";
import {
  RefProperty,
  ResourceMasterStore,
  ResourceType
} from "../../../@types/gameObject";
import VueEvent from "../../core/decorator/VueEvent";
import { parseColor } from "../../core/utility/ColorUtility";
import WindowVue from "../../core/window/WindowVue";
import CtrlButton from "../../core/component/CtrlButton.vue";
import LanguageManager from "../../../LanguageManager";
import ResourceMasterInfoForm from "./ResourceMasterInfoForm.vue";
import { Direction } from "../../../@types/room";

@Component({
  components: {
    CtrlButton,
    ResourceMasterInfoForm
  }
})
export default class ResourceMasterAddWindow extends Mixins<
  WindowVue<string, boolean>
>(WindowVue) {
  private isMounted: boolean = false;
  private cc = SocketFacade.instance.resourceMasterCC();

  private name: string = LanguageManager.instance.getText("label.resource");
  private resourceType: ResourceType = "no-contents";
  private isAutoAddActor: boolean = false;
  private isAutoAddMapObject: boolean = true;
  private iconImageId: string | null = null;
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
    await this.init();
    this.isMounted = true;
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

  @VueEvent
  private async commit() {
    // TODO 同名プロパティチェック
    await this.cc!.addDirect([this.resourceMasterData]);
    await this.finally(true);
  }

  private get resourceMasterData(): ResourceMasterStore {
    const isNumber = this.resourceType === "number";
    const isRef =
      this.resourceType === "ref-normal" || this.resourceType === "ref-owner";
    const isSelection =
      this.resourceType === "select" || this.resourceType === "combo";
    return {
      label: this.name,
      type: this.resourceType,
      systemColumnType: null,
      isAutoAddActor: this.isAutoAddActor,
      isAutoAddMapObject: this.isAutoAddMapObject,
      iconImageId: this.iconImageId,
      iconImageTag: this.iconImageTag,
      iconImageDirection: this.iconImageDirection,
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
    };
  }

  @VueEvent
  private async rollback() {
    await this.finally();
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
