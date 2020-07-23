<template>
  <div class="container" ref="window-container">
    <resource-master-info-form
      :windowKey="windowKey"
      :isAdd="true"
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
import { Component } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import LifeCycle from "../../core/decorator/LifeCycle";
import {
  convertBooleanFalse,
  convertNumberZero
} from "../../core/utility/PrimaryDataUtility";
import SocketFacade from "../../core/api/app-server/SocketFacade";
import { ResourceMasterStore, ResourceType } from "../../../@types/gameObject";
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
  WindowVue<string, never>
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
  private refProperty: string = "name";
  private min: number = 0;
  private max: number = 100;
  private interval: number = 1;
  private selectionStr: string = "";
  private defaultValueStr: string = "";
  private defaultValueNumber: number = 0;
  private defaultValueBoolean: boolean = false;
  private defaultValueColor: string = "#000000";

  @LifeCycle
  public async mounted() {
    await this.init();
    this.isMounted = true;
  }

  @VueEvent
  private async commit() {
    // TODO 同名プロパティチェック
    await this.cc!.addDirect([this.resourceMasterData]);
    await this.close();
  }

  public static getDefaultValueFromType(
    type: ResourceType,
    str: string,
    num: number,
    bool: boolean,
    color: string
  ): string {
    if (["text", "input-type", "combo"].indexOf(type) > -1) return str;
    if (["number"].indexOf(type) > -1) return num.toString(10);
    if (["check"].indexOf(type) > -1) return bool.toString();
    if (["color"].indexOf(type) > -1) return color;
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
    if (["text", "input-type", "combo"].indexOf(type) > -1) {
      result.str = value;
    }
    if (["number"].indexOf(type) > -1) {
      result.num = convertNumberZero(value);
    }
    if (["check"].indexOf(type) > -1) {
      result.bool = convertBooleanFalse(value);
    }
    if (["color"].indexOf(type) > -1) {
      result.color = parseColor(value).getRGBA();
    }
    return result;
  }

  private get resourceMasterData(): ResourceMasterStore {
    const isNumber = ["number"].indexOf(this.resourceType) > -1;
    return {
      label: this.name,
      type: this.resourceType,
      isSystem: false,
      isInitiative: false,
      isAutoAddActor: this.isAutoAddActor,
      isAutoAddMapObject: this.isAutoAddMapObject,
      iconImageId: this.iconImageId,
      iconImageTag: this.iconImageTag,
      iconImageDirection: this.iconImageDirection,
      refProperty: this.resourceType.startsWith("ref-") ? this.refProperty : "",
      min: isNumber ? this.min : null,
      max: isNumber ? this.max : null,
      interval: isNumber ? this.interval : null,
      selectionStr: this.selectionStr,
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
    await this.close();
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
