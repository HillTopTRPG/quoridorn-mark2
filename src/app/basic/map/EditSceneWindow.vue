<template>
  <div class="container" ref="window-container">
    <simple-tab-component
      :windowKey="windowKey"
      :tabList="tabList"
      v-model="currentTabInfo"
    >
      <!-- メイン -->
      <div class="main" v-if="currentTabInfo.target === 'map' && sceneData">
        <div class="detail">
          <table class="info-table">
            <tr>
              <tr-string-input-component
                labelName="label.name"
                v-model="sceneData.name"
                inputWidth="10em"
              />
            </tr>
          </table>

          <fieldset>
            <legend v-t="'label.size'"></legend>
            <table class="info-table">
              <tr>
                <tr-number-input-component
                  labelName="label.columns"
                  v-model="sceneData.columns"
                  inputWidth="3.5em"
                  :min="1"
                />
              </tr>
              <tr>
                <tr-number-input-component
                  labelName="label.rows"
                  v-model="sceneData.rows"
                  inputWidth="3.5em"
                  :min="1"
                />
              </tr>
              <tr>
                <tr-number-input-component
                  labelName="edit-scene-window.label.grid-size"
                  v-model="sceneData.gridSize"
                  inputWidth="3.5em"
                  :min="1"
                />
              </tr>
            </table>
          </fieldset>

          <fieldset>
            <legend v-t="'label.decoration'"></legend>
            <table class="info-table">
              <tr>
                <tr-color-picker-component
                  labelName="label.font-color"
                  v-model="sceneData.fontColor"
                />
              </tr>
              <tr>
                <tr-color-picker-component
                  labelName="edit-scene-window.label.grid-line-color"
                  v-model="sceneData.gridColor"
                />
              </tr>
            </table>
          </fieldset>
        </div>

        <fieldset class="texture">
          <legend v-t="'label.texture'"></legend>
          <input-texture-component
            :key="1"
            v-model="sceneData.texture"
            :windowKey="key"
            :defaultTag="defaultTag"
          />
        </fieldset>
      </div>

      <!-- 余白 -->
      <div
        class="margin"
        v-if="currentTabInfo.target === 'margin' && sceneData"
      >
        <div class="detail">
          <fieldset>
            <legend v-t="'label.size'"></legend>
            <table class="info-table">
              <tr>
                <tr-number-input-component
                  labelName="label.columns"
                  v-model="sceneData.margin.columns"
                  inputWidth="3.5em"
                  :min="0"
                />
              </tr>
              <tr>
                <tr-number-input-component
                  labelName="label.rows"
                  v-model="sceneData.margin.rows"
                  inputWidth="3.5em"
                  :min="0"
                />
              </tr>
            </table>
          </fieldset>

          <fieldset>
            <legend v-t="'edit-scene-window.label.grid-line'"></legend>
            <table class="info-table">
              <tr>
                <tr-checkbox-component
                  labelName="edit-scene-window.label.grid-line"
                  :cLabel="$t('label.exist')"
                  :nLabel="$t('label.not-exist')"
                  v-model="sceneData.margin.isUseGrid"
                />
              </tr>
              <tr>
                <tr-color-picker-component
                  labelName="label.main"
                  v-model="sceneData.margin.gridColorBold"
                />
              </tr>
              <tr>
                <tr-color-picker-component
                  labelName="edit-scene-window.label.sub"
                  v-model="sceneData.margin.gridColorThin"
                  :disabled="!sceneData.margin.isUseGrid"
                />
              </tr>
            </table>
          </fieldset>

          <fieldset>
            <legend v-t="'edit-scene-window.label.mask'"></legend>
            <table class="info-table">
              <tr>
                <tr-color-picker-component
                  labelName="label.color"
                  v-model="sceneData.margin.maskColor"
                />
              </tr>
              <tr>
                <tr-number-input-component
                  labelName="edit-scene-window.label.blur"
                  v-model="sceneData.margin.maskBlur"
                  inputWidth="3.5em"
                  :min="0"
                />
              </tr>
            </table>
          </fieldset>

          <fieldset>
            <legend v-t="'edit-scene-window.label.frame-border'"></legend>
            <table class="info-table">
              <tr>
                <tr-number-input-component
                  labelName="label.width"
                  v-model="sceneData.margin.border.width"
                  inputWidth="3.5em"
                  :min="0"
                />
              </tr>
              <tr>
                <tr-color-picker-component
                  class="value-border-color"
                  labelName="label.color"
                  v-model="sceneData.margin.border.color"
                />
              </tr>
              <tr>
                <th>
                  <label
                    :for="`${key}-border-style`"
                    class="label-border-style label-input"
                    v-t="'label.style'"
                  >
                  </label>
                </th>
                <td>
                  <border-style-select
                    :elmId="`${key}-border-style`"
                    v-model="sceneData.margin.border.style"
                  />
                </td>
              </tr>
            </table>
          </fieldset>
        </div>

        <fieldset class="texture">
          <legend v-t="'label.texture'"></legend>
          <input-texture-component
            :key="2"
            v-model="sceneData.margin.texture"
            :windowKey="key"
            :defaultTag="defaultTag"
          />
        </fieldset>
      </div>

      <!-- 背景 -->
      <div
        class="background"
        v-if="currentTabInfo.target === 'background' && sceneData"
      >
        <fieldset class="texture">
          <legend v-t="'label.texture'"></legend>
          <input-texture-component
            :key="3"
            v-model="sceneData.background.texture"
            :windowKey="key"
            :defaultTag="defaultTag"
          />
        </fieldset>
      </div>

      <!-- レイヤー -->
      <div class="layer" v-if="currentTabInfo.target === 'layer'">
        <edit-scene-layer-chooser-component
          :sceneKey="sceneKey"
          v-model="selectedLayerKey"
          @hoverView="onHoverLayerView"
          @hoverOrder="onHoverOrderLayer"
          @hoverOrderMode="onHoverLayerOrderMode"
        />
        <edit-scene-object-chooser-component
          :sceneKey="sceneKey"
          :selectedLayerKey="selectedLayerKey"
          v-model="selectedSceneObjectKey"
          @hoverAddress="onHoverAddress"
          @hoverOrder="onHoverOrderObject"
          @hoverOrderMode="onHoverObjectOrderMode"
        />
      </div>
    </simple-tab-component>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import {
  SceneObjectStore,
  SceneStore,
  SceneAndLayerStore,
  SceneLayerStore
} from "@/@types/store-data";
import { TabInfo } from "@/@types/window";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import AddressInput from "@/app/basic/common/components/AddressInput.vue";
import EditSceneObjectChooserComponent from "@/app/basic/map/EditSceneObjectChooserComponent.vue";
import SeekBarComponent from "@/app/basic/cut-in/bgm/SeekBarComponent.vue";
import SocketFacade, {
  permissionCheck
} from "@/app/core/api/app-server/SocketFacade";
import ColorPickerComponent from "@/app/core/component/ColorPickerComponent.vue";
import TrColorPickerComponent from "@/app/basic/common/components/table-item/TrColorPickerComponent.vue";
import BorderStyleSelect from "@/app/basic/common/components/select/BorderStyleSelect.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import InputTextureComponent from "@/app/basic/map/InputTextureComponent.vue";
import TaskManager from "@/app/core/task/TaskManager";
import TrCheckboxComponent from "@/app/basic/common/components/table-item/TrCheckboxComponent.vue";
import WindowVue from "@/app/core/window/WindowVue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import TrStringInputComponent from "@/app/basic/common/components/table-item/TrStringInputComponent.vue";
import BackgroundTypeRadio from "@/app/basic/common/components/radio/BackgroundTypeRadio.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import LanguageManager from "@/LanguageManager";
import EditSceneLayerChooserComponent from "@/app/basic/map/EditSceneLayerChooserComponent.vue";
import SceneLayerSelect from "@/app/basic/common/components/select/SceneLayerSelect.vue";
import TrNumberInputComponent from "@/app/basic/common/components/table-item/TrNumberInputComponent.vue";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";

@Component({
  components: {
    TrCheckboxComponent,
    EditSceneObjectChooserComponent,
    EditSceneLayerChooserComponent,
    TrColorPickerComponent,
    TrNumberInputComponent,
    TrStringInputComponent,
    AddressInput,
    BorderStyleSelect,
    InputTextureComponent,
    BackgroundTypeRadio,
    SceneLayerSelect,
    SimpleTabComponent,
    ColorPickerComponent,
    SeekBarComponent,
    CtrlButton
  }
})
export default class EditSceneWindow extends Mixins<WindowVue<string, never>>(
  WindowVue
) {
  private isMounted: boolean = false;
  private isProcessed: boolean = false;
  private sceneKey: string | null = null;
  private oldSceneKey: string | null = null;
  private defaultTag: string = LanguageManager.instance.getText("type.map");

  private sceneList = GameObjectManager.instance.sceneList;
  private layerList = GameObjectManager.instance.sceneLayerList;
  private sceneAndLayerList = GameObjectManager.instance.sceneAndLayerList;
  private sceneObjectList = GameObjectManager.instance.sceneObjectList;

  private cc = SocketFacade.instance.sceneListCC();

  private sceneInfo: StoreUseData<SceneStore> | null = null;
  private sceneData: SceneStore | null = null;
  private sceneAndLayerInfoList:
    | StoreUseData<SceneAndLayerStore>[]
    | null = null;
  private sceneObjectInfoList: StoreUseData<SceneObjectStore>[] | null = null;
  private layerInfoList: StoreUseData<SceneLayerStore>[] | null = null;

  private selectedLayerKey: string = "";
  private selectedSceneObjectKey: string = "";

  @Watch("sceneObjectList", { deep: true })
  @Watch("selectedLayerKey")
  private async onChangeSceneObjectInfoList() {
    setTimeout(async () => {
      type SceneObjectList = StoreUseData<SceneObjectStore>[];
      const oldList: SceneObjectList = [];

      if (this.sceneObjectInfoList) {
        oldList.push(...this.sceneObjectInfoList.concat());
      }
      this.sceneObjectInfoList = this.sceneObjectList.filter(
        mo => mo.data!.layerKey === this.selectedLayerKey
      );

      const clearFocusList: SceneObjectList = oldList.filter(
        o => this.sceneObjectInfoList!.findIndex(so => so.key === o.key) < 0
      );
      const setFocusList: SceneObjectList = this.sceneObjectInfoList!.filter(
        so => oldList.findIndex(o => o.key === so.key) < 0
      );

      const focusFunc = async (
        key: string,
        isFocus: boolean
      ): Promise<void> => {
        await EditSceneWindow.changeFocus(key, isFocus);
      };

      // 直列の非同期で全部実行する
      await clearFocusList
        .map(obj => () => focusFunc(obj.key, false))
        .reduce((prev, curr) => prev.then(curr), Promise.resolve());

      // 直列の非同期で全部実行する
      await setFocusList
        .map(obj => () => focusFunc(obj.key, true))
        .reduce((prev, curr) => prev.then(curr), Promise.resolve());
    });
  }

  @Watch("selectedLayerKey")
  private async onChangeSelectedLayerKey() {
    this.selectedSceneObjectKey = "";
  }

  @Watch("selectedSceneObjectKey")
  private async onChangeSelectedSceneObjectKey(newVal: string, oldVal: string) {
    const focusFunc = async (key: string, isFocus: boolean): Promise<void> => {
      await EditSceneWindow.changeFocus(key, isFocus);
    };

    await focusFunc(oldVal, false);

    if (!this.sceneObjectInfoList) {
      await focusFunc(newVal, true);
      return;
    }

    type SceneObjectList = StoreUseData<SceneObjectStore>[];

    const clearFocusList: SceneObjectList = this.sceneObjectInfoList.filter(
      so => so.key !== newVal
    );

    // 直列の非同期で全部実行する
    await clearFocusList
      .map(obj => () => focusFunc(obj.key, false))
      .reduce((prev, curr) => prev.then(curr), Promise.resolve());

    if (this.sceneObjectInfoList.findIndex(so => so.key === newVal) < 0) {
      await focusFunc(newVal, true);
    }

    this.sceneObjectInfoList = null;
  }

  @Watch("windowInfo.status")
  private async onChangeWindowInfoStatus() {
    await this.focusAll(false);
    if (this.windowInfo.status === "window") {
      setTimeout(async () => {
        await this.focusAll(true);
      });
    }
  }

  @Watch("currentTabInfo.target")
  private async onChangeTabTarget() {
    if (this.currentTabInfo && this.currentTabInfo.target !== "layer") {
      await this.focusAll(false);
    } else {
      this.selectedLayerKey = "";
    }
  }

  private async focusAll(isFocus: boolean) {
    const targetList: string[] = this.sceneObjectInfoList
      ? this.sceneObjectInfoList.map(so => so.key)
      : [];
    if (this.selectedSceneObjectKey)
      targetList.push(this.selectedSceneObjectKey);

    // 直列の非同期で全部実行する
    await targetList
      .map(key => () => EditSceneWindow.changeFocus(key, isFocus))
      .reduce((prev, curr) => prev.then(curr), Promise.resolve());
  }

  private static async changeFocus(key: string, isFocus: boolean) {
    if (!key) return;
    await TaskManager.instance.ignition<
      { key: string; isFocus: boolean },
      never
    >({
      type: "change-focus-scene-object",
      owner: "Quoridorn",
      value: {
        key,
        isFocus
      }
    });
  }

  @Watch("sceneData", { deep: true })
  private async onChangeSceneData(
    _newValue: SceneStore,
    oldValue: SceneStore | null
  ) {
    if (oldValue === null) return;

    try {
      await this.cc.update([
        {
          key: this.sceneKey!,
          data: this.sceneData!,
          continuous: true
        }
      ]);
    } catch (err) {
      console.log("==========");
      console.log(err);
    }
  }

  private tabList: TabInfo[] = [
    { key: "1", target: "map", text: "", isDisabled: false },
    { key: "2", target: "margin", text: "", isDisabled: false },
    { key: "3", target: "background", text: "", isDisabled: false },
    { key: "4", target: "layer", text: "", isDisabled: false }
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
  private async mounted() {
    await this.init();
    this.isMounted = true;
    this.sceneKey = this.windowInfo.args!;
    this.sceneInfo = this.sceneList.filter(map => map.key === this.sceneKey)[0];
    this.sceneData = this.sceneInfo.data!;

    this.oldSceneKey = GameObjectManager.instance.roomData.sceneKey;
    GameObjectManager.instance.roomData.sceneKey = this.sceneKey;

    setTimeout(() => {
      GameObjectManager.instance.isSceneEditing = true;
    });

    this.sceneAndLayerInfoList = this.sceneAndLayerList
      .filter(map => map.data!.sceneKey === this.sceneKey)
      .sort((m1, m2) => {
        if (m1.order < m2.order) return -1;
        if (m1.order > m2.order) return 1;
        return 0;
      });
    this.layerInfoList = this.sceneAndLayerInfoList
      .map(ml => this.layerList.filter(l => l.key === ml.data!.layerKey)[0])
      .filter(l => l);

    if (this.windowInfo.status === "window") {
      // 排他チェック
      if (this.sceneInfo.exclusionOwner) {
        this.isProcessed = true;
        await this.close();
        return;
      }

      // パーミッションチェック
      if (!permissionCheck(this.sceneInfo, "edit")) {
        this.isProcessed = true;
        await this.close();
        return;
      }
    }

    // this.foreColor = sceneData.grkeyBorderColor;

    if (this.windowInfo.status === "window") {
      try {
        await this.cc.touchModify([this.sceneKey]);
      } catch (err) {
        this.isProcessed = true;
        console.warn(err);
        await this.close();
      }
    }
  }

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing2(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value !== this.windowInfo.key) return;
    await this.focusAll(false);
    GameObjectManager.instance.isSceneEditing = false;

    GameObjectManager.instance.roomData.sceneKey =
      GameObjectManager.instance.sceneEditingUpdateSceneKey ||
      this.oldSceneKey!;
    GameObjectManager.instance.sceneEditingUpdateSceneKey = null;
    if (!this.isProcessed) {
      try {
        await this.cc!.releaseTouch([this.sceneKey!]);
      } catch (err) {
        // nothing
      }
    }
  }

  private setHoverWindowMessage(isHover: boolean, messageType: string) {
    this.windowInfo.message = isHover
      ? this.$t(
          `${this.windowInfo.type}.message-select.${messageType}`
        )!.toString()
      : "";
  }

  @VueEvent
  private onHoverLayerView(isHover: boolean) {
    this.setHoverWindowMessage(isHover, "layer-view");
  }

  @VueEvent
  private onHoverAddress(isHover: boolean) {
    this.setHoverWindowMessage(isHover, "original-address");
  }

  @VueEvent
  private onHoverOrderLayer(isHover: boolean) {
    this.setHoverWindowMessage(isHover, "layer-order");
  }

  @VueEvent
  private onHoverOrderObject(isHover: boolean) {
    this.setHoverWindowMessage(isHover, "object-order");
  }

  @VueEvent
  private onHoverLayerOrderMode(isHover: boolean, dragMode: boolean) {
    const messageType = `layer-order-mode-${dragMode ? "off" : "on"}`;
    this.setHoverWindowMessage(isHover, messageType);
  }

  @VueEvent
  private onHoverObjectOrderMode(isHover: boolean, dragMode: boolean) {
    const messageType = `object-order-mode-${dragMode ? "off" : "on"}`;
    this.setHoverWindowMessage(isHover, messageType);
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.container {
  height: 100%;
}

.value-name {
  width: 10em;
}

.value-rows,
.value-columns,
.value-grid-size,
.value-margin-rows,
.value-margin-columns,
.value-mask-blur {
  width: 3.5em;
}

.simple-tab-component {
  height: 100%;

  > *:not(:first-child) {
    @include flex-box(row, flex-start, stretch);
    width: 100%;
    flex: 1;
    border: 1px solid gray;
    box-sizing: border-box;
    padding: 0.5rem;
    overflow: auto;
  }

  table {
    box-sizing: border-box;

    th,
    td {
      box-sizing: border-box;
      padding: 0;
    }

    th {
      text-align: right;
    }
    td {
      text-align: left;
    }
  }

  input[type="checkbox"] {
    display: inline-block;
    margin: 0;
    height: calc(2em - 2px);
  }

  fieldset {
    margin: 0;
    box-sizing: border-box;
    padding: 0.25rem;
    border: 1px solid lightgray;
    overflow-x: auto;
    overflow-y: auto;

    > :not(legend) {
      height: calc(100% - 1.5em);
    }
  }

  .background {
    width: 100%;
    height: 100%;

    .texture {
      width: 100%;
      height: 100%;
    }
  }

  .main,
  .margin {
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: auto 1fr;

    .detail {
      grid-row: 1 / 2;
      grid-column: 1 / 2;
      @include flex-box(column, flex-start, stretch);
      margin-right: 0.5rem;
    }

    .texture {
      grid-row: 1 / 2;
      grid-column: 2 / 3;
    }
  }
}
</style>
