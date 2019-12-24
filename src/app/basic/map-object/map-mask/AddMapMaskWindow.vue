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
          <div
            class="map-mask"
            ref="mapMask"
            draggable="true"
            @dragstart="dragStart"
          >
            {{ text }}
          </div>
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
          <label class="multi-create">
            <base-input
              type="checkbox"
              :value="isMulti"
              @input="isMulti = $event.target.value"
            />
            <span v-t="'label.multi-create'"></span>
          </label>
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

@Component({
  components: { ColorPickerComponent, BaseInput, SeekBarComponent, CtrlButton }
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
      otherText: "",
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
