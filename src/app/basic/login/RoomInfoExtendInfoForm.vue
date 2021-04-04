<template>
  <div class="room-info-extend-info-form">
    <simple-tab-component
      :windowKey="windowKey"
      :tabList="tabList"
      v-model="currentTabInfo"
    >
      <!-- 共有設定タブ -->
      <div
        class="block room-share-setting"
        v-if="currentTabInfo.target === 'room-share-setting'"
      >
        <table>
          <tr>
            <tr-checkbox-component
              labelName="type.visitor"
              :readonly="!isGm"
              :cLabel="$t('label.allow')"
              :nLabel="$t('label.none')"
              v-model="roomInfoExtend.visitable"
            />
          </tr>
          <tr>
            <tr-checkbox-component
              labelName="selection.is-fit-grid.label"
              :readonly="!isGm"
              :cLabel="$t('selection.is-fit-grid.fit')"
              :nLabel="$t('selection.is-fit-grid.non-fit')"
              v-model="roomInfoExtend.isFitGrid"
            />
          </tr>
          <tr>
            <tr-checkbox-component
              labelName="label.grid-line"
              :readonly="!isGm"
              :cLabel="$t('selection.view-type.view')"
              :nLabel="$t('selection.view-type.hide')"
              v-model="roomInfoExtend.isDrawGridLine"
            />
          </tr>
          <tr>
            <tr-checkbox-component
              labelName="label.grid-address"
              :readonly="!isGm"
              :cLabel="$t('selection.view-type.view')"
              :nLabel="$t('selection.view-type.hide')"
              v-model="roomInfoExtend.isDrawGridId"
            />
          </tr>
          <tr>
            <tr-checkbox-component
              labelName="label.map-rotate"
              :readonly="!isGm"
              :cLabel="$t('label.allow')"
              :nLabel="$t('label.none')"
              v-model="roomInfoExtend.mapRotatable"
            />
          </tr>
          <!--
          <tr>
            <tr-checkbox-component
              labelName="label.dice"
              :readonly="!isGm"
              :cLabel="$t('selection.view-type.view')"
              :nLabel="$t('selection.view-type.hide')"
              v-model="roomInfoExtend.isViewDice"
            />
          </tr>
          <tr>
            <tr-checkbox-component
              labelName="type.stand-image"
              :readonly="!isGm"
              :cLabel="$t('selection.view-type.view')"
              :nLabel="$t('selection.view-type.hide')"
              v-model="roomInfoExtend.isShowStandImage"
            />
          </tr>
          <tr>
            <tr-checkbox-component
              labelName="label.map-object-rotate-marker"
              :readonly="!isGm"
              :cLabel="$t('selection.view-type.view')"
              :nLabel="$t('selection.view-type.hide')"
              v-model="roomInfoExtend.isShowRotateMarker"
            />
          </tr>
          -->
        </table>
      </div>
      <!-- 画面設定タブ -->
      <div
        class="block room-window-setting"
        v-if="currentTabInfo.target === 'room-window-setting'"
      >
        <table>
          <tr>
            <tr-general-type-select-component
              :label-text="$t('chat-window.window-title')"
              :readonly="!isGm"
              type="window-view-setting"
              v-model="roomInfoExtend.windowSettings['chat']"
              :value-list="['free', 'init-view', 'always-open', 'not-use']"
            />
          </tr>
          <tr>
            <tr-general-type-select-component
              :label-text="$t('initiative-window.window-title')"
              :readonly="!isGm"
              type="window-view-setting"
              v-model="roomInfoExtend.windowSettings['initiative']"
              :value-list="['free', 'init-view', 'always-open', 'not-use']"
            />
          </tr>
          <tr>
            <tr-general-type-select-component
              :label-text="$t('chat-palette-window.window-title')"
              :readonly="!isGm"
              type="window-view-setting"
              v-model="roomInfoExtend.windowSettings['chat-palette']"
              :value-list="['free', 'init-view', 'always-open', 'not-use']"
            />
          </tr>
          <tr>
            <tr-general-type-select-component
              :label-text="$t('counter-remocon-window.window-title')"
              :readonly="!isGm"
              type="window-view-setting"
              v-model="roomInfoExtend.windowSettings['counter-remocon']"
              :value-list="['free', 'init-view', 'always-open', 'not-use']"
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
import { TabInfo } from "@/@types/window";
import { RoomInfoExtend } from "@/@types/store-data-optional";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import ComponentVue from "@/app/core/window/ComponentVue";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import TrCheckboxComponent from "@/app/basic/common/components/table-item/TrCheckboxComponent.vue";
import TrGeneralTypeSelectComponent from "@/app/basic/common/components/table-item/TrGeneralTypeSelectComponent.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";

const uuid = require("uuid");

@Component({
  components: {
    TrGeneralTypeSelectComponent,
    TrCheckboxComponent,
    SimpleTabComponent
  }
})
export default class RoomInfoExtendInfoForm extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private windowKey!: string;

  @Prop({ type: Object, required: true })
  private roomInfoExtend!: RoomInfoExtend;

  private isMounted: boolean = false;

  @LifeCycle
  public async mounted() {
    this.isMounted = true;
    this.currentTabInfo = this.tabList.find(
      t => t.target === this.initTabTarget
    )!;
  }

  private tabList: TabInfo[] = [
    // { key: "1", target: "private-setting", text: "", isDisabled: false },
    { key: "2", target: "room-share-setting", text: "", isDisabled: false },
    { key: "3", target: "room-window-setting", text: "", isDisabled: false }
  ];
  private currentTabInfo: TabInfo = this.tabList[0];
  private initTabTarget = "room-share-setting";

  private get isGm() {
    return GameObjectManager.instance.isGm;
  }

  @TaskProcessor("language-change-finished")
  private async languageChangeFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    this.createTabInfoList();
    task.resolve();
  }

  @Watch("roomInfoExtend", { immediate: true, deep: true })
  private onChangeRoomInfoExtend() {
    console.log(JSON.stringify(this.roomInfoExtend, null, "  "));
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
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.room-info-extend-info-form {
  display: contents;
}

.simple-tab-component {
  flex: 1;
  width: 100%;
  overflow: hidden;

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
  table-layout: fixed;
  align-self: flex-end;

  th,
  td {
    label {
      @include inline-flex-box(row, flex-start, center);
    }
  }

  th {
    text-align: left;
    width: 1px;
    white-space: nowrap;

    :first-child {
      display: inline-block;
      width: calc(100% - 1em);
    }
  }

  td {
    text-align: left;
    padding: 0;
  }
}
</style>
