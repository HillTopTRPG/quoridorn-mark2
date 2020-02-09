<template>
  <div class="container" ref="window">
    <div class="map-mask-cell">
      <div class="map-mask" ref="mapMask" draggable="false">
        {{ text }}
      </div>
    </div>
    <simple-tab-component :tabList="tabList" v-model="currentTabInfo">
      <div v-if="currentTabInfo.target === 'background'">
        <table>
          <tr>
            <th>
              <label
                :for="`${key}-text`"
                class="label-text label-input"
                v-t="'label.text'"
              ></label>
            </th>
            <td>
              <base-input
                :id="`${key}-text`"
                class="value-text"
                type="text"
                :value="text"
                @input="text = $event.target.value"
              />
            </td>
          </tr>
          <tr>
            <th>
              <label
                :for="`${key}-color`"
                class="label-color label-input"
                v-t="'label.background-color'"
              ></label>
            </th>
            <td>
              <color-picker-component
                :id="`${key}-color`"
                class="value-color"
                v-model="color"
                :use-alpha="false"
              />
            </td>
          </tr>
          <tr>
            <th>
              <label
                :for="`${key}-alpha`"
                class="label-alpha label-input"
                v-t="'label.alpha'"
              ></label>
            </th>
            <td>
              <base-input
                :id="`${key}-alpha`"
                class="value-alpha"
                type="range"
                min="0"
                max="1"
                step="0.1"
                :value="alpha"
                @input="alpha = $event.target.value"
              />
            </td>
          </tr>
        </table>
      </div>
      <textarea
        v-if="currentTabInfo.target === 'other-text'"
        v-model="otherText"
      ></textarea>
      <div class="layer-block" v-if="currentTabInfo.target === 'layer'">
        <label>
          <span v-t="'label.add-target'" class="label-input"></span>
          <map-layer-select v-model="layerId" />
        </label>
      </div>
    </simple-tab-component>
    <table class="info-table">
      <tr>
        <th>
          <label
            :for="`${key}-width`"
            class="label-width label-input"
            v-t="'label.width'"
          ></label>
        </th>
        <td class="value-cell">
          <base-input
            :id="`${key}-width`"
            class="value-width"
            type="number"
            :value="width"
            @input="width = $event.target.valueAsNumber"
            min="1"
          />
        </td>
      </tr>
      <tr>
        <th>
          <label
            :for="`${key}-height`"
            class="label-height label-input"
            v-t="'label.height'"
          ></label>
        </th>
        <td class="value-cell">
          <base-input
            :id="`${key}-height`"
            class="value-height"
            type="number"
            :value="height"
            @input="height = $event.target.valueAsNumber"
            min="1"
          />
        </td>
      </tr>
    </table>

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
import { parseColor } from "@/app/core/Utility";
import { Mixins } from "vue-mixin-decorator";
import { DataReference } from "@/@types/data";
import { MapMaskStore } from "@/@types/gameObject";
import { Task, TaskResult } from "task";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import ColorPickerComponent from "@/app/core/component/ColorPickerComponent.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import WindowVue from "@/app/core/window/WindowVue";
import SeekBarComponent from "@/app/basic/music/SeekBarComponent.vue";
import SocketFacade, {
  permissionCheck
} from "@/app/core/api/app-server/SocketFacade";
import NekostoreCollectionController from "@/app/core/api/app-server/NekostoreCollectionController";
import BaseInput from "@/app/core/component/BaseInput.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import { TabInfo } from "@/@types/window";
import GameObjectManager from "@/app/basic/GameObjectManager";
import LanguageManager from "@/LanguageManager";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import MapLayerSelect from "@/app/basic/common/components/select/MapLayerSelect.vue";

@Component({
  components: {
    MapLayerSelect,
    SimpleTabComponent,
    ColorPickerComponent,
    BaseInput,
    SeekBarComponent,
    CtrlButton
  }
})
export default class EditMapMaskWindow extends Mixins<
  WindowVue<DataReference, never>
>(WindowVue) {
  private docId: string = "";
  private cc: NekostoreCollectionController<MapMaskStore> | null = null;

  private text: string = "";
  private color: string = "#ff0000";
  private height: number = 1;
  private width: number = 1;
  private alpha: number = 1;
  private isMounted: boolean = false;

  private isProcessed: boolean = false;
  private layerId: string = GameObjectManager.instance.mapLayerList.filter(
    ml => ml.data!.type === "map-mask"
  )[0].id!;
  private otherText: string = "";

  private tabList: TabInfo[] = [
    { target: "background", text: "" },
    { target: "layer", text: "" },
    { target: "other-text", text: "" }
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
  public async mounted() {
    await this.init();
    this.isMounted = true;
    const type = this.windowInfo.args!.type;
    this.docId = this.windowInfo.args!.docId;
    this.cc = SocketFacade.instance.getCC(type);
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

    const texture = data.data!.textures[data.data!.useBackGround];
    if (texture.type === "color") {
      this.text = texture.text;
      const colorObj = parseColor(texture.backgroundColor);
      this.color = colorObj.getColorCode();
      this.alpha = colorObj.a;
    }
    this.width = data.data!.columns;
    this.height = data.data!.rows;
    this.otherText = data.data!.otherText;
    this.layerId = data.data!.layerId;

    if (this.windowInfo.status === "window") {
      try {
        await this.cc.touchModify(this.docId);
      } catch (err) {
        window.console.warn(err);
        this.isProcessed = true;
        await this.close();
      }
    }
  }

  private get mapMaskElm(): HTMLElement {
    return this.$refs.mapMask as HTMLElement;
  }

  @VueEvent
  private async commit() {
    const data = (await this.cc!.getData(this.docId))!.data!;
    const texture = data.textures[data.useBackGround];
    if (texture.type === "color") {
      texture.text = this.text;
      texture.backgroundColor = this.colorObj.getRGBA();
      texture.fontColor = this.colorObj.getRGBReverse();
    }
    data.rows = this.height;
    data.columns = this.width;
    data.otherText = this.otherText;
    data.layerId = this.layerId;
    await this.cc!.update(this.docId, data);
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
      await this.cc!.releaseTouch(this.docId);
    } catch (err) {
      // nothing
    }
    if (!this.isProcessed) {
      this.isProcessed = true;
      await this.close();
    }
  }

  @Watch("isMounted")
  @Watch("width")
  @Watch("height")
  private onChangeWidth() {
    if (!this.isMounted) return;
    let ratio: number = Math.min(4 / this.width, 4 / this.height, 1);
    this.mapMaskElm.style.setProperty(
      "--width-ratio",
      (this.width * ratio).toString()
    );
    this.mapMaskElm.style.setProperty(
      "--height-ratio",
      (this.height * ratio).toString()
    );
  }

  @Watch("isMounted")
  @Watch("color")
  @Watch("alpha")
  private onChangeColor() {
    if (!this.isMounted) return;
    const backColor = this.colorObj.getRGBA();
    this.mapMaskElm.style.setProperty("--back-color", backColor);
    const fontColor = this.colorObj.getRGBReverse();
    this.mapMaskElm.style.setProperty("--font-color", fontColor);
  }

  private get colorObj() {
    const colorObj = parseColor(this.color);
    colorObj.a = this.alpha;
    return colorObj;
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.map-mask {
  @include flex-box(row, center, center);
  width: calc(var(--width-ratio) * 3em);
  height: calc(var(--height-ratio) * 3em);
  background-color: var(--back-color);
  color: var(--font-color);
  white-space: normal;
  box-sizing: border-box;
  word-break: break-all;
  text-align: center;
}

.value-alpha {
  transform: rotate(180deg);
  transform-origin: center;
}

.value-width,
.value-height {
  width: 3em;
}

.container {
  display: grid;
  grid-template-rows: 12em 1fr calc(2em + 0.5rem);
  grid-template-columns: 12em 1fr;
  width: 100%;
  height: 100%;

  .simple-tab-component {
    grid-row: 1 / 3;
    grid-column: 2 / 3;

    > *:not(:first-child) {
      width: 100%;
      flex: 1;
    }

    table {
      box-sizing: border-box;

      th {
        text-align: right;
      }

      td {
        text-align: left;
      }
    }

    > div:not(.image-picker-container) {
      border: solid 1px gray;
      box-sizing: border-box;
      padding: 0.2rem;
    }

    textarea {
      resize: none;
      padding: 0;
      box-sizing: border-box;
    }
  }

  .map-mask-cell {
    grid-row: 1 / 2;
    grid-column: 1 / 2;
    @include flex-box(row, center, center);
  }

  > table {
    grid-row: 2 / 3;
    grid-column: 1 / 2;

    th,
    td {
      > div {
        @include flex-box(row, flex-start, center);
      }
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

  .button-area {
    grid-row: 3 / 4;
    grid-column: 1 / 3;
  }
}
</style>
