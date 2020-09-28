<template>
  <div class="container" ref="window-container">
    <resource-master-info-form
      :windowKey="windowKey"
      :isAdd="false"
      :systemColumnType="systemColumnType"
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

    <div class="button-area">
      <ctrl-button @click="commit()" :disabled="isDuplicate || !name">
        <span v-t="'button.modify'"></span>
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
import { Task, TaskResult } from "task";
import LifeCycle from "../../core/decorator/LifeCycle";
import TaskProcessor from "../../core/task/TaskProcessor";
import ResourceMasterAddWindow from "./ResourceMasterAddWindow.vue";
import SocketFacade, {
  permissionCheck
} from "../../core/api/app-server/SocketFacade";
import { ResourceMasterStore } from "@/@types/store-data";
import VueEvent from "../../core/decorator/VueEvent";
import WindowVue from "../../core/window/WindowVue";
import CtrlButton from "../../core/component/CtrlButton.vue";
import LanguageManager from "../../../LanguageManager";
import ResourceMasterInfoForm from "./ResourceMasterInfoForm.vue";
import {
  Direction,
  RefProperty,
  ResourceType
} from "@/@types/store-data-optional";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { findRequireByKey } from "@/app/core/utility/Utility";

@Component({
  components: {
    ResourceMasterInfoForm,
    CtrlButton
  }
})
export default class ResourceMasterEditWindow extends Mixins<
  WindowVue<DataReference, never>
>(WindowVue) {
  private docKey: string = "";
  private cc = SocketFacade.instance.resourceMasterCC();
  private isMounted: boolean = false;
  private isProcessed: boolean = false;

  private name: string = LanguageManager.instance.getText("label.resource");
  private resourceType: ResourceType = "no-contents";
  private systemColumnType: "name" | "initiative" | null = null;
  private isAutoAddActor: boolean = false;
  private isAutoAddMapObject: boolean = true;
  private iconImageKey: string | null = null;
  private iconImageTag: string | null = null;
  private iconImageDirection: Direction | null = null;
  private refProperty: RefProperty | null = null;
  private min: number | null = null;
  private max: number | null = null;
  private interval: number | null = null;
  private selectionStr: string | null = null;
  private defaultValueStr: string = "";
  private defaultValueNumber: number = 0;
  private defaultValueBoolean: boolean = false;
  private defaultValueColor: string = "#000000";

  private resourceMasterList = GameObjectManager.instance.resourceMasterList;

  @LifeCycle
  public async mounted() {
    await this.init();
    this.docKey = this.windowInfo.args!.key;
    const data = (await this.cc!.findSingle("key", this.docKey))!.data!;

    if (this.windowInfo.status === "window") {
      // 排他チェック
      if (data.exclusionOwner) {
        this.isProcessed = true;
        await this.close();
        return;
      }

      // パーミッションチェック
      if (!permissionCheck(data, "edit")) {
        this.isProcessed = true;
        await this.close();
        return;
      }
    }

    this.name = data.data!.label;
    this.resourceType = data.data!.type;
    this.isAutoAddActor = data.data!.isAutoAddActor;
    this.isAutoAddMapObject = data.data!.isAutoAddMapObject;
    this.systemColumnType = data.data!.systemColumnType;
    this.iconImageKey = data.data!.icon.mediaKey;
    this.iconImageTag = data.data!.icon.mediaTag;
    this.iconImageDirection = data.data!.icon.imageDirection;
    this.refProperty = data.data!.refProperty;
    this.min = data.data!.min;
    this.max = data.data!.max;
    this.interval = data.data!.interval;
    this.selectionStr = data.data!.selectionStr;

    const defaultInfo = ResourceMasterAddWindow.getDefaultValueFromValue(
      this.resourceType,
      data.data!.defaultValue
    );
    this.defaultValueStr = defaultInfo.str;
    this.defaultValueNumber = defaultInfo.num;
    this.defaultValueBoolean = defaultInfo.bool;
    this.defaultValueColor = defaultInfo.color;

    if (this.windowInfo.status === "window") {
      try {
        await this.cc.touchModify([this.docKey]);
      } catch (err) {
        console.warn(err);
        this.isProcessed = true;
        await this.close();
      }
    }
    this.isMounted = true;
  }

  @VueEvent
  private get isDuplicate(): boolean {
    return this.resourceMasterList.some(
      rm => rm.data!.label === this.name && rm.key !== this.docKey
    );
  }

  @Watch("isDuplicate")
  private onChangeIsDuplicate() {
    if (this.docKey === null) return;
    const resourceMaster = findRequireByKey(
      this.resourceMasterList,
      this.docKey
    );
    this.windowInfo.message = this.isDuplicate
      ? this.$t("message.name-duplicate")!.toString()
      : this.$t("message.original")!
          .toString()
          .replace("$1", resourceMaster.data!.label);
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
    await this.cc!.update([
      {
        key: this.docKey,
        data: this.resourceMasterData
      }
    ]);
    this.isProcessed = true;
    await this.close();
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
      systemColumnType: this.systemColumnType,
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
    };
  }

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing2(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value !== this.windowInfo.key) return;
    if (!this.isProcessed) {
      this.isProcessed = true;
      await this.rollback();
    }
  }

  @VueEvent
  private async rollback() {
    try {
      await this.cc!.releaseTouch([this.docKey]);
    } catch (err) {
      // nothing
    }
    if (!this.isProcessed) {
      this.isProcessed = true;
      await this.close();
    }
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
  @include inline-flex-box(row, center, center);
  width: 100%;
}
</style>
