<template>
  <div class="container" ref="window-container">
    <resource-master-info-form
      :windowKey="windowKey"
      :isAdd="false"
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
import { DataReference } from "@/@types/data";
import { Direction } from "@/@types/room";
import SocketFacade, {
  permissionCheck
} from "@/app/core/api/app-server/SocketFacade";
import { ResourceType } from "@/@types/gameObject";
import VueEvent from "@/app/core/decorator/VueEvent";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import WindowVue from "@/app/core/window/WindowVue";
import ResourceMasterInfoForm from "@/app/basic/initiative/ResourceMasterInfoForm.vue";
import LanguageManager from "@/LanguageManager";
import ResourceMasterAddWindow from "@/app/basic/initiative/ResourceMasterAddWindow.vue";

@Component({
  components: {
    ResourceMasterInfoForm,
    CtrlButton
  }
})
export default class ResourceMasterEditWindow extends Mixins<
  WindowVue<DataReference, never>
>(WindowVue) {
  private docId: string = "";
  private cc = SocketFacade.instance.resourceMasterCC();
  private isMounted: boolean = false;
  private isProcessed: boolean = false;

  private name: string = LanguageManager.instance.getText("label.resource");
  private resourceType: ResourceType = "no-contents";
  private isAutoAddActor: boolean = false;
  private isAutoAddMapObject: boolean = true;
  private iconImageId: string | null = null;
  private iconImageTag: string | null = null;
  private iconImageDirection: Direction | null = null;
  private refProperty: string = "name";
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
    this.docId = this.windowInfo.args!.docId;
    const data = (await this.cc!.getData(this.docId))!;

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
    this.iconImageId = data.data!.iconImageId;
    this.iconImageTag = data.data!.iconImageTag;
    this.iconImageDirection = data.data!.iconImageDirection;
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
        await this.cc.touchModify([this.docId]);
      } catch (err) {
        window.console.warn(err);
        this.isProcessed = true;
        await this.close();
      }
    }
    this.isMounted = true;
  }

  @Watch("resourceType")
  private onChangeResourceType() {
    if (["combo", "radio"].indexOf(this.resourceType) > -1) {
      if (this.selectionStr === null) {
        this.selectionStr = "";
      }
    }
    if (["number"].indexOf(this.resourceType) > -1) {
      if (this.min === null || this.max === null || this.interval === null) {
        this.min = 0;
        this.max = 100;
        this.interval = 1;
      }
    }
    if (["ref-actor", "ref-map-object"].indexOf(this.resourceType) > -1) {
      if (this.refProperty === "") {
        this.refProperty = "name";
      }
    }
  }

  @VueEvent
  private async commit() {
    // TODO 同名プロパティチェック
    const data = (await this.cc!.getData(this.docId))!;
    data.data!.label = this.name;
    data.data!.type = this.resourceType;
    data.data!.isAutoAddActor = this.isAutoAddActor;
    data.data!.isAutoAddMapObject = this.isAutoAddMapObject;
    data.data!.iconImageId = this.iconImageId;
    data.data!.iconImageTag = this.iconImageTag;
    data.data!.iconImageDirection = this.iconImageDirection;
    data.data!.refProperty = this.refProperty;
    data.data!.min = this.min;
    data.data!.max = this.max;
    data.data!.interval = this.interval;
    data.data!.selectionStr = this.selectionStr;
    data.data!.defaultValue = ResourceMasterAddWindow.getDefaultValueFromType(
      this.resourceType,
      this.defaultValueStr,
      this.defaultValueNumber,
      this.defaultValueBoolean,
      this.defaultValueColor
    );
    await this.cc!.update([this.docId], [data.data!]);
    this.isProcessed = true;
    await this.close();
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
      await this.cc!.releaseTouch([this.docId]);
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
