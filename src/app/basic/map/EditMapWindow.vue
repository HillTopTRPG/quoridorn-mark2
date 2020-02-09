<template>
  <div class="container" ref="window">
    <simple-tab-component :tabList="tabList" v-model="currentTabInfo">
      <!-- メイン -->
      <div class="main" v-if="currentTabInfo.target === 'map' && screenData">
        <div class="detail">
          <table class="info-table">
            <tr>
              <th>
                <label
                  :for="`${key}-name`"
                  class="label-name label-input"
                  v-t="'label.name'"
                ></label>
              </th>
              <td class="value-cell">
                <base-input
                  :id="`${key}-name`"
                  class="value-name"
                  type="text"
                  :value="screenData.name"
                  @input="screenData.name = $event.target.value"
                />
              </td>
            </tr>
          </table>

          <fieldset>
            <legend v-t="'label.size'"></legend>
            <table class="info-table">
              <tr>
                <th>
                  <label
                    :for="`${key}-columns`"
                    class="label-columns label-input"
                    v-t="'label.columns'"
                  ></label>
                </th>
                <td class="value-cell">
                  <base-input
                    :id="`${key}-columns`"
                    class="value-columns"
                    type="number"
                    :value="screenData.columns"
                    @input="screenData.columns = $event.target.valueAsNumber"
                    min="1"
                  />
                </td>
              </tr>
              <tr>
                <th>
                  <label
                    :for="`${key}-rows`"
                    class="label-rows label-input"
                    v-t="'label.rows'"
                  ></label>
                </th>
                <td class="value-cell">
                  <base-input
                    :id="`${key}-rows`"
                    class="value-rows"
                    type="number"
                    :value="screenData.rows"
                    @input="screenData.rows = $event.target.valueAsNumber"
                    min="1"
                  />
                </td>
              </tr>
              <tr>
                <th>
                  <label
                    :for="`${key}-grid-size`"
                    class="label-grid-size label-input"
                    v-t="'label.grid-size'"
                  ></label>
                </th>
                <td class="value-cell">
                  <base-input
                    :id="`${key}-grid-size`"
                    class="value-grid-size"
                    type="number"
                    :value="screenData.gridSize"
                    @input="screenData.gridSize = $event.target.valueAsNumber"
                    min="1"
                  />
                </td>
              </tr>
            </table>
          </fieldset>

          <fieldset>
            <legend v-t="'label.decoration'"></legend>
            <table class="info-table">
              <tr>
                <th>
                  <label
                    :for="`${key}-font-color`"
                    class="label-font-color label-input"
                    v-t="'label.font-color'"
                  ></label>
                </th>
                <td>
                  <color-picker-component
                    :key="`${key}-font-color`"
                    :id="`${key}-font-color`"
                    class="value-font-color"
                    v-model="screenData.fontColor"
                    :use-alpha="true"
                  />
                </td>
              </tr>
              <tr>
                <th>
                  <label
                    :for="`${key}-grid-color`"
                    class="label-grid-color label-input"
                    v-t="'label.grid-line-color'"
                  ></label>
                </th>
                <td>
                  <color-picker-component
                    :key="`${key}-grid-color`"
                    :id="`${key}-grid-color`"
                    class="value-grid-color"
                    v-model="screenData.gridColor"
                    :use-alpha="true"
                  />
                </td>
              </tr>
            </table>
          </fieldset>
        </div>

        <fieldset class="texture">
          <legend v-t="'label.texture'"></legend>
          <input-texture-component
            :key="1"
            v-model="screenData.texture"
            :windowKey="key"
            :defaultTag="defaultTag"
          />
        </fieldset>
      </div>

      <!-- 余白 -->
      <div
        class="margin"
        v-if="currentTabInfo.target === 'margin' && screenData"
      >
        <div class="detail">
          <fieldset>
            <legend v-t="'label.size'"></legend>
            <table class="info-table">
              <tr>
                <th>
                  <label
                    :for="`${key}-margin-columns`"
                    class="label-margin-columns label-input"
                    v-t="'label.columns'"
                  ></label>
                </th>
                <td class="value-cell">
                  <base-input
                    :id="`${key}-margin-columns`"
                    class="value-margin-columns"
                    type="number"
                    :value="screenData.margin.columns"
                    @input="
                      screenData.margin.columns = $event.target.valueAsNumber
                    "
                    min="0"
                  />
                </td>
              </tr>
              <tr>
                <th>
                  <label
                    :for="`${key}-margin-rows`"
                    class="label-margin-rows label-input"
                    v-t="'label.rows'"
                  ></label>
                </th>
                <td class="value-cell">
                  <base-input
                    :id="`${key}-margin-rows`"
                    class="value-margin-rows"
                    type="number"
                    :value="screenData.margin.rows"
                    @input="
                      screenData.margin.rows = $event.target.valueAsNumber
                    "
                    min="0"
                  />
                </td>
              </tr>
            </table>
          </fieldset>

          <fieldset>
            <legend v-t="'label.grid-line'"></legend>
            <table class="info-table">
              <tr>
                <th>
                  <label
                    :for="`${key}-grid-check`"
                    class="label-color label-input"
                    v-t="'label.grid-line'"
                  ></label>
                </th>
                <td>
                  <base-input
                    :id="`${key}-grid-check`"
                    type="checkbox"
                    :checked="screenData.margin.isUseGrid"
                    @input="screenData.margin.isUseGrid = $event.target.checked"
                  />
                </td>
              </tr>
              <tr>
                <th>
                  <label
                    :for="`${key}-grid-color-main`"
                    class="label-color label-input"
                    v-t="'label.main'"
                  >
                  </label>
                </th>
                <td>
                  <color-picker-component
                    :key="`${key}-grid-color-main`"
                    :id="`${key}-grid-color-main`"
                    class="value-grid-color-main"
                    v-model="screenData.margin.gridColorBold"
                    :disabled="!screenData.margin.isUseGrid"
                    :use-alpha="true"
                  />
                </td>
              </tr>
              <tr>
                <th>
                  <label
                    :for="`${key}-grid-color-sub`"
                    class="label-color label-input"
                    v-t="'label.sub'"
                  >
                  </label>
                </th>
                <td>
                  <color-picker-component
                    :key="`${key}-grid-color-sub`"
                    :id="`${key}-grid-color-sub`"
                    class="value-grid-color-sub"
                    v-model="screenData.margin.gridColorThin"
                    :disabled="!screenData.margin.isUseGrid"
                    :use-alpha="true"
                  />
                </td>
              </tr>
            </table>
          </fieldset>

          <fieldset>
            <legend v-t="'label.mask'"></legend>
            <table class="info-table">
              <tr>
                <th>
                  <label
                    :for="`${key}-mask-color`"
                    class="label-mask-color label-input"
                    v-t="'label.color'"
                  >
                  </label>
                </th>
                <td>
                  <color-picker-component
                    :key="`${key}-mask-color`"
                    :id="`${key}-mask-color`"
                    class="value-mask-color"
                    v-model="screenData.margin.maskColor"
                    :use-alpha="true"
                  />
                </td>
              </tr>
              <tr>
                <th>
                  <label
                    :for="`${key}-mask-blur`"
                    class="label-mask-blur label-input"
                    v-t="'label.blur'"
                  ></label>
                </th>
                <td>
                  <base-input
                    :id="`${key}-mask-blur`"
                    class="value-mask-blur"
                    type="number"
                    :value="screenData.margin.maskBlur"
                    @input="
                      screenData.margin.maskBlur = $event.target.valueAsNumber
                    "
                    min="0"
                  />
                </td>
              </tr>
            </table>
          </fieldset>

          <fieldset>
            <legend v-t="'label.frame-border'"></legend>
            <table class="info-table">
              <tr>
                <th>
                  <label
                    :for="`${key}-border-width`"
                    class="label-border-width label-input"
                    v-t="'label.width'"
                  ></label>
                </th>
                <td>
                  <base-input
                    :id="`${key}-border-width`"
                    class="value-border-width"
                    type="number"
                    :value="screenData.margin.border.width"
                    @input="
                      screenData.margin.border.width =
                        $event.target.valueAsNumber
                    "
                    min="0"
                  />
                </td>
              </tr>
              <tr>
                <th>
                  <label
                    :for="`${key}-border-color`"
                    class="label-border-color label-input"
                    v-t="'label.color'"
                  >
                  </label>
                </th>
                <td>
                  <color-picker-component
                    :key="`${key}-border-color`"
                    :id="`${key}-border-color`"
                    class="value-border-color"
                    v-model="screenData.margin.border.color"
                    :use-alpha="true"
                  />
                </td>
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
                    :id="`${key}-border-style`"
                    v-model="screenData.margin.border.style"
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
            v-model="screenData.margin.texture"
            :windowKey="key"
            :defaultTag="defaultTag"
          />
        </fieldset>
      </div>

      <!-- 背景 -->
      <div
        class="background"
        v-if="currentTabInfo.target === 'background' && screenData"
      >
        <fieldset class="texture">
          <legend v-t="'label.texture'"></legend>
          <input-texture-component
            :key="3"
            v-model="screenData.background.texture"
            :windowKey="key"
            :defaultTag="defaultTag"
          />
        </fieldset>
      </div>

      <!-- レイヤー -->
      <div class="layer" v-if="currentTabInfo.target === 'layer'"></div>
    </simple-tab-component>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import ColorPickerComponent from "@/app/core/component/ColorPickerComponent.vue";
import BaseInput from "@/app/core/component/BaseInput.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import WindowVue from "@/app/core/window/WindowVue";
import SeekBarComponent from "@/app/basic/music/SeekBarComponent.vue";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import MapLayerSelect from "@/app/basic/common/components/select/MapLayerSelect.vue";
import SocketFacade, {
  permissionCheck
} from "@/app/core/api/app-server/SocketFacade";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { TabInfo } from "@/@types/window";
import LanguageManager from "@/LanguageManager";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import BackgroundTypeRadio from "@/app/basic/common/components/radio/BackgroundTypeRadio.vue";
import ImagePickerComponent from "@/app/core/component/ImagePickerComponent.vue";
import { StoreUseData } from "@/@types/store";
import { Screen, Texture } from "@/@types/room";
import InputTextureComponent from "@/app/basic/map/InputTextureComponent.vue";
import BorderStyleSelect from "@/app/basic/common/components/select/BorderStyleSelect.vue";

@Component({
  components: {
    BorderStyleSelect,
    InputTextureComponent,
    ImagePickerComponent,
    BackgroundTypeRadio,
    MapLayerSelect,
    SimpleTabComponent,
    ColorPickerComponent,
    BaseInput,
    SeekBarComponent,
    CtrlButton
  }
})
export default class EditMapWindow extends Mixins<WindowVue<string, never>>(
  WindowVue
) {
  private isMounted: boolean = false;
  private cc = SocketFacade.instance.screenListCC();
  private isProcessed: boolean = false;
  private imageList = GameObjectManager.instance.imageList;
  private screenList = GameObjectManager.instance.screenList;

  private mapId: string | null = null;
  private screenInfo: StoreUseData<Screen> | null = null;
  private screenData: Screen | null = null;

  private defaultTag: string = LanguageManager.instance.getText("type.map");

  @Watch("screenData", { deep: true })
  private async onChangeMapData(newValue: Screen, oldValue: Screen | null) {
    if (oldValue === null) return;

    try {
      await this.cc.update(this.mapId!, this.screenData!, undefined, true);
    } catch (err) {
      window.console.log("==========");
      window.console.log(err);
    }
  }

  // @Watch("marginRows")
  // private async onChangeMarginRows(newValue: number, oldValue: number | null) {
  //   if (oldValue === null) return;
  //   this.mapInfo!.data!.margin.row = newValue;
  //   await this.updateMap();
  // }
  //
  // private async updateMap() {
  //   try {
  //     await this.cc.update(this.mapId!, this.screenData!, true);
  //   } catch (err) {
  //     window.console.log("==========");
  //     window.console.log(err);
  //   }
  // }

  private tabList: TabInfo[] = [
    { target: "map", text: "" },
    { target: "margin", text: "" },
    { target: "background", text: "" },
    { target: "layer", text: "" }
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
    const getText = LanguageManager.instance.getText.bind(
      LanguageManager.instance
    );
    this.tabList.forEach(t => {
      t.text = getText(`label.${t.target}`);
    });
  }

  @LifeCycle
  private async mounted() {
    await this.init();
    this.isMounted = true;
    this.mapId = this.windowInfo.args!;
    this.screenInfo = this.screenList.filter(map => map.id === this.mapId)[0];
    this.screenData = this.screenInfo.data!;

    if (this.windowInfo.status === "window") {
      // 排他チェック
      if (this.screenInfo.exclusionOwner) {
        this.isProcessed = true;
        await this.close();
        return;
      }

      // パーミッションチェック
      if (!permissionCheck(this.screenInfo, "edit")) {
        this.isProcessed = true;
        await this.close();
        return;
      }
    }

    // this.foreColor = screenData.gridBorderColor;

    if (this.windowInfo.status === "window") {
      try {
        await this.cc.touchModify(this.mapId);
      } catch (err) {
        this.isProcessed = true;
        window.console.warn(err);
        await this.close();
      }
    }
  }

  private static getBgObj(info: Texture): Texture {
    if (info.type === "image") {
      return {
        type: "image",
        imageId: info.imageId,
        imageTag: info.imageTag,
        direction: info.direction,
        backgroundSize: info.backgroundSize
      };
    } else {
      return {
        type: "color",
        backgroundColor: info.backgroundColor,
        fontColor: info.fontColor,
        text: info.text
      };
    }
  }

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing2(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value !== this.windowInfo.key) return;
    if (!this.isProcessed) {
      try {
        await this.cc!.releaseTouch(this.mapId!);
      } catch (err) {
        // nothing
      }
    }
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
.value-border-width,
.value-mask-blur {
  width: 3.5em;
}

.simple-tab-component {
  height: 100%;

  > *:not(:first-child) {
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
