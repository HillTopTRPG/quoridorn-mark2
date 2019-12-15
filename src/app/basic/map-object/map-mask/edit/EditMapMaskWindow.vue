<template>
  <div class="container" ref="window">
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
        <td rowspan="7" class="map-mask-cell">
          <div class="map-mask" ref="mapMask" draggable="false">{{ text }}</div>
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
          <input
            :id="`${key}-alpha`"
            class="value-alpha"
            type="range"
            min="0"
            max="1"
            step="0.1"
            :value="alpha"
            @input="alpha = $event.target.value"
            @keydown.enter.stop
            @keyup.enter.stop
            @keydown.229.stop
            @keyup.229.stop
          />
        </td>
      </tr>
      <tr>
        <th>
          <label
            :for="`${key}-width`"
            class="label-width label-input"
            v-t="'label.width'"
          ></label>
        </th>
        <td>
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
        <td>
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
          <div class="button-area">
            <ctrl-button @click="commit()">
              <span v-t="'button.modify'"></span>
            </ctrl-button>
            <ctrl-button @click="rollback()">
              <span v-t="'button.reject'"></span>
            </ctrl-button>
          </div>
        </td>
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import WindowVue from "@/app/core/window/WindowVue";
import { parseColor } from "@/app/core/Utility";
import SeekBarComponent from "@/app/basic/music/SeekBarComponent.vue";
import { Mixins } from "vue-mixin-decorator";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import VueEvent from "@/app/core/decorator/VueEvent";
import BaseInput from "@/app/core/component/BaseInput.vue";
import ColorPickerComponent from "@/app/core/component/ColorPickerComponent.vue";
import { DataReference } from "@/@types/data";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import NekostoreCollectionController from "@/app/core/api/app-server/NekostoreCollectionController";
import { MapMaskStore } from "@/@types/gameObject";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "@/@types/task";

@Component({
  components: { ColorPickerComponent, BaseInput, SeekBarComponent, CtrlButton }
})
export default class EditMapMaskWindow extends Mixins<
  WindowVue<DataReference, never>
>(WindowVue) {
  private type: string = "";
  private docId: string = "";
  private cc: NekostoreCollectionController<MapMaskStore> | null = null;

  private text: string = "";
  private color: string = "#ff0000";
  private height: number = 1;
  private width: number = 1;
  private alpha: number = 0.5;
  private isMounted: boolean = false;

  private isProcessed: boolean = false;

  @LifeCycle
  public async mounted() {
    await this.init();
    this.isMounted = true;
    this.type = this.windowInfo.args!.type;
    this.docId = this.windowInfo.args!.docId;
    this.cc = SocketFacade.instance.getCC(this.type);
    const data = (await this.cc!.getData(this.docId))!;
    const backgroundInfo = data.data!.backgroundList[data.data!.useBackGround];
    if (backgroundInfo.backgroundType === "color") {
      this.text = backgroundInfo.text;
      const colorObj = parseColor(backgroundInfo.backgroundColor);
      this.color = colorObj.getColorCode();
      this.alpha = colorObj.a;
    }
    this.width = data.data!.columns;
    this.height = data.data!.rows;
    try {
      await this.cc.touchModify(this.docId);
    } catch (err) {
      window.console.warn(err);
      this.isProcessed = true;
      await this.close();
    }
  }

  private get mapMaskElm(): HTMLElement {
    return this.$refs.mapMask as HTMLElement;
  }

  @VueEvent
  private async commit() {
    const data = (await this.cc!.getData(this.docId))!;
    const backgroundInfo = data.data!.backgroundList[data.data!.useBackGround];
    if (backgroundInfo.backgroundType === "color") {
      backgroundInfo.text = this.text;
      backgroundInfo.backgroundColor = this.colorObj.getRGBA();
      backgroundInfo.fontColor = this.colorObj.getRGBReverse();
    }
    data.data!.rows = this.height;
    data.data!.columns = this.width;
    await this.cc!.update(this.docId, data.data!);
    this.isProcessed = true;
    await this.close();
  }

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing2(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value !== this.windowInfo.key) return;
    if (!this.isProcessed) {
      await this.rollback();
    }
  }

  @VueEvent
  private async rollback() {
    await this.cc!.releaseTouch(this.docId);
    this.isProcessed = true;
    await this.close();
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
@import "../../../../../assets/common";

.map-mask {
  @include inline-flex-box(row, center, center);
  width: calc(var(--width-ratio) * 3em);
  height: calc(var(--height-ratio) * 3em);
  background-color: var(--back-color);
  color: var(--font-color);
  white-space: pre-wrap;
}

.container {
  width: 100%;
  height: 100%;

  table {
    border-collapse: collapse;
    border-spacing: 0;
    width: 100%;
  }

  th {
    text-align: right;
    padding: 0;
  }

  td {
    text-align: left;
    padding: 0;

    label {
      @include flex-box(row, flex-start, center);
    }

    input {
      margin: 0;

      &.value-width,
      &.value-height {
        width: 3em;
      }

      &.value-alpha {
        transform: rotate(180deg);
        transform-origin: center;
      }
    }

    &.map-mask-cell {
      width: 100%;
      text-align: center;
      vertical-align: middle;
    }
  }
}
</style>
