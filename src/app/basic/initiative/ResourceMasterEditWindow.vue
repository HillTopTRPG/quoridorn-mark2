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

    <button-area
      :is-commit-able="isCommitAble()"
      commit-text="modify"
      @commit="commit()"
      @rollback="rollback()"
    />
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import { ResourceMasterStore } from "@/@types/store-data";
import {
  Direction,
  RefProperty,
  ResourceType
} from "@/@types/store-data-optional";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { findRequireByKey } from "@/app/core/utility/Utility";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import ResourceMasterAddWindow from "@/app/basic/initiative/ResourceMasterAddWindow.vue";
import WindowVue from "@/app/core/window/WindowVue";
import LanguageManager from "@/LanguageManager";
import ResourceMasterInfoForm from "@/app/basic/initiative/ResourceMasterInfoForm.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import EditWindowDelegator, {
  EditWindow
} from "@/app/core/window/EditWindowDelegator";

@Component({ components: { ButtonArea, ResourceMasterInfoForm } })
export default class ResourceMasterEditWindow
  extends Mixins<WindowVue<DataReference, never>>(WindowVue)
  implements EditWindow<ResourceMasterStore> {
  private editWindowDelegator = new EditWindowDelegator<ResourceMasterStore>(
    this
  );

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

  @LifeCycle
  public async mounted() {
    await this.editWindowDelegator.init();
    this.inputEnter("input:not([type='button'])", this.commit);
  }

  public isCommitAble(): boolean {
    return !this.isDuplicate && !!this.name;
  }

  @VueEvent
  private async commit() {
    await this.editWindowDelegator.commit();
  }

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing2(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    return await this.editWindowDelegator.windowCloseClosing(task);
  }

  @VueEvent
  private async rollback() {
    await this.editWindowDelegator.rollback();
  }

  public pullStoreData(data: StoreData<ResourceMasterStore>): void {
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
  }

  public async pushStoreData(
    data: StoreData<ResourceMasterStore>
  ): Promise<void> {
    const type = this.resourceType;
    const isNumber = type === "number";
    const isRef = type === "ref-normal" || type === "ref-owner";
    const isSelection = type === "select" || type === "combo";
    data.data!.label = this.name;
    data.data!.type = type;
    data.data!.systemColumnType = this.systemColumnType;
    data.data!.isAutoAddActor = this.isAutoAddActor;
    data.data!.isAutoAddMapObject = this.isAutoAddMapObject;
    data.data!.icon.mediaKey = this.iconImageKey;
    data.data!.icon.mediaTag = this.iconImageTag;
    data.data!.icon.imageDirection = this.iconImageDirection;
    data.data!.refProperty = isRef ? this.refProperty : null;
    data.data!.min = isNumber ? this.min : null;
    data.data!.max = isNumber ? this.max : null;
    data.data!.interval = isNumber ? this.interval : null;
    data.data!.selectionStr = isSelection ? this.selectionStr : null;
    data.data!.defaultValue = ResourceMasterAddWindow.getDefaultValueFromType(
      this.resourceType,
      this.defaultValueStr,
      this.defaultValueNumber,
      this.defaultValueBoolean,
      this.defaultValueColor
    );
  }

  @VueEvent
  private get isDuplicate(): boolean {
    return GameObjectManager.instance.resourceMasterList.some(
      rm =>
        rm.data!.label === this.name &&
        rm.key !== this.editWindowDelegator.docKey
    );
  }

  @Watch("isDuplicate")
  private onChangeIsDuplicate() {
    if (!this.editWindowDelegator.docKey) return;
    const resourceMaster = findRequireByKey(
      GameObjectManager.instance.resourceMasterList,
      this.editWindowDelegator.docKey
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
