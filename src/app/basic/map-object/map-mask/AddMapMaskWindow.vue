<template>
  <div class="container" ref="window">
    <div class="map-mask-cell">
      <div
        class="map-mask"
        ref="mapMask"
        draggable="true"
        @dragstart="dragStart"
      >
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
        v-if="currentTabInfo.target === 'text'"
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
            @input="width = $event.target.value"
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
            @input="height = $event.target.value"
            min="1"
          />
        </td>
      </tr>
      <tr>
        <td colspan="2">
          <div>
            <label class="multi-create">
              <base-input
                type="checkbox"
                :value="isMulti"
                @input="isMulti = $event.target.value"
              />
              <span v-t="'label.multi-create'"></span>
            </label>
          </div>
        </td>
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { parseColor } from "@/app/core/Utility";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "@/@types/task";
import { MapMaskStore } from "@/@types/gameObject";
import { AddObjectInfo } from "@/@types/data";
import ColorPickerComponent from "@/app/core/component/ColorPickerComponent.vue";
import BaseInput from "@/app/core/component/BaseInput.vue";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import VueEvent from "@/app/core/decorator/VueEvent";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import WindowVue from "@/app/core/window/WindowVue";
import SeekBarComponent from "@/app/basic/music/SeekBarComponent.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import LanguageManager from "@/LanguageManager";
import { TabInfo } from "@/@types/window";
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
export default class AddMapMaskWindow extends Mixins<WindowVue<string, never>>(
  WindowVue
) {
  private text: string = "";
  private color: string = "#ff0000";
  private height: number = 1;
  private width: number = 1;
  private alpha: number = 1;
  private isMulti: boolean = false;
  private isMounted: boolean = false;
  private layerId: string = GameObjectManager.instance.mapLayerList.filter(
    ml => ml.data!.type === "map-mask"
  )[0].id!;
  private otherText: string = "";

  private tabList: TabInfo[] = [
    {
      text: LanguageManager.instance.getText("label.background"),
      target: "background"
    },
    {
      text: LanguageManager.instance.getText("label.layer"),
      target: "layer"
    },
    {
      text: LanguageManager.instance.getText("label.other-text"),
      target: "text"
    }
  ];

  @TaskProcessor("language-change-finished")
  private async languageChangeFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    const getText = LanguageManager.instance.getText.bind(
      LanguageManager.instance
    );
    this.tabList[0].text = getText("label.background");
    this.tabList[1].text = getText("label.layer");
    this.tabList[2].text = getText("label.other-text");
    task.resolve();
  }
  private currentTabInfo: TabInfo | null = this.tabList[0];

  @LifeCycle
  public async mounted() {
    await this.init();
    this.isMounted = true;
  }

  private get mapMaskElm(): HTMLElement {
    return this.$refs.mapMask as HTMLElement;
  }

  @VueEvent
  private dragStart(event: DragEvent) {
    event.dataTransfer!.setData("dropType", "map-mask");
    event.dataTransfer!.setData("dropWindow", this.key);
  }

  @TaskProcessor("added-object-finished")
  private async addedObjectFinished(
    task: Task<AddObjectInfo, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value!.dropWindow !== this.key) return;
    const point = task.value!.point;

    const owner = GameObjectManager.instance.mySelfId;
    const backgroundColor = this.colorObj.getRGBA();
    const fontColor = this.colorObj.getRGBReverse();
    const mapMaskInfo: MapMaskStore = {
      x: point.x,
      y: point.y,
      owner,
      columns: this.width,
      rows: this.height,
      place: "field",
      isHideBorder: false,
      isHideHighlight: false,
      isLock: false,
      otherText: this.otherText,
      layerId: this.layerId,
      backgroundList: [
        {
          backgroundType: "color",
          backgroundColor,
          fontColor,
          text: this.text
        }
      ],
      useBackGround: 0,
      angle: 0
    };
    const mapMaskCC = SocketFacade.instance.mapMaskCC();
    const docId = await mapMaskCC.touch();
    await mapMaskCC.add(docId, mapMaskInfo);

    if (!this.isMulti) await this.close();
    task.resolve();
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
  grid-template-rows: 12em 1fr;
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
}
</style>
