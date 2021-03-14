<template>
  <div id="map-draw-controller" @wheel.stop>
    <label>
      <span v-t="'label.layer'" class="label-input"></span>
      <scene-layer-select v-model="sceneLayerKey" />
      <s-button
        class="close-button"
        icon="cross"
        colorStyle="skyblue"
        @click="onClose"
      />
    </label>
    <div class="map-draw-box">
      <div
        class="map-draw"
        v-for="mapDraw in useMapDrawList.concat().reverse()"
        :key="mapDraw.key"
        :class="{
          editting: mapDraw.exclusionOwner,
          selected: mapDraw.key === selectedMapDrawKey
        }"
        @click="onClickMapDraw(mapDraw.key)"
      >
        <span class="label">{{ getMapDrawLabel(mapDraw) }}</span>
        <span
          class="map-draw-model"
          :class="mapDraw.data.type"
          :style="{
            color: mapDraw.data.fillStyle,
            borderColor: mapDraw.data.strokeStyle,
            borderWidth: mapDraw.data.lineWidth + 'px',
            backgroundColor: mapDraw.data.fillStyle
          }"
          >{{ mapDraw.data.type === "text" ? mapDraw.data.value : "" }}</span
        >
      </div>
      <div
        class="space"
        :class="useMapDrawList.length % 2 === 0 ? 'odd' : 'even'"
      ></div>
    </div>
    <div class="button-area">
      <ctrl-button @click="deleteMapDraw()" :disabled="!selectedMapDrawKey">
        <span v-t="`button.delete`"></span>
      </ctrl-button>
      <ctrl-button @click="moveMapDraw(2)" :disabled="!getIsMovable(2)"
        >↑↑</ctrl-button
      >
      <ctrl-button @click="moveMapDraw(1)" :disabled="!getIsMovable(1)"
        >↑</ctrl-button
      >
      <ctrl-button @click="moveMapDraw(-1)" :disabled="!getIsMovable(-1)"
        >↓️</ctrl-button
      >
      <ctrl-button @click="moveMapDraw(-2)" :disabled="!getIsMovable(-2)"
        >↓↓</ctrl-button
      >
    </div>
    <fieldset :class="isEditOpen ? 'open' : 'close'">
      <legend>
        <span v-t="'button.edit'"></span>
        <a @click="toggleOpen()">（{{ isEditOpen ? "close" : "open" }}）</a>
      </legend>
      <map-draw-info-form
        :is-add="false"
        :disabled="!selectedMapDrawKey"
        :sceneLayerKey.sync="editData.sceneLayerKey"
        :type.sync="editData.type"
        :value.sync="editData.value"
        :lineWidth.sync="editData.lineWidth"
        :strokeStyle.sync="editData.strokeStyle"
        :fillStyle.sync="editData.fillStyle"
        :fontSize.sync="editData.fontSize"
        :textAnchor.sync="editData.textAnchor"
        :correctionText.sync="editData.correctionText"
        :style-data.sync="editData.style"
        :vertex-num.sync="vertexNumEdit"
      />
      <ctrl-button
        @click="addContinuousMapDraw()"
        v-if="editData.type === 'line'"
        :disabled="!selectedMapDrawKey"
      >
        <span v-t="'button.add-continuous-line'"></span>
      </ctrl-button>
    </fieldset>
    <fieldset class="open">
      <legend v-t="'button.add'"></legend>
      <map-draw-info-form
        :is-add="true"
        :sceneLayerKey.sync="addData.sceneLayerKey"
        :type.sync="addData.type"
        :value.sync="addData.value"
        :lineWidth.sync="addData.lineWidth"
        :strokeStyle.sync="addData.strokeStyle"
        :fillStyle.sync="addData.fillStyle"
        :fontSize.sync="addData.fontSize"
        :textAnchor.sync="addData.textAnchor"
        :correctionText.sync="addData.correctionText"
        :style-data.sync="addData.style"
        :vertex-num.sync="vertexNumAdd"
      />
      <ctrl-button @click="addMapDrawSimple()">
        <span v-t="'button.add'"></span>
      </ctrl-button>
    </fieldset>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import SceneLayerSelect from "@/app/basic/common/components/select/SceneLayerSelect.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import VueEvent from "@/app/core/decorator/VueEvent";
import { MapDrawStore, RoomDataStore } from "@/@types/store-data";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import TaskManager from "@/app/core/task/TaskManager";
import { SelectMapDrawInfo } from "task-info";
import MapDrawInfoForm from "@/app/basic/map/MapDrawInfoForm.vue";
import { Point } from "@/@types/store-data-optional";
import { createPoint } from "@/app/core/utility/CoordinateUtility";
import {
  findRequireByKey,
  replaceArrayElements,
  setOrderByListOrder
} from "@/app/core/utility/Utility";
import { clone } from "@/app/core/utility/PrimaryDataUtility";
import SButton from "@/app/basic/common/components/SButton.vue";
import { ModeInfo } from "mode";

@Component({
  components: { SButton, MapDrawInfoForm, CtrlButton, SceneLayerSelect }
})
export default class MapDrawController extends Mixins<ComponentVue>(
  ComponentVue
) {
  private roomData: RoomDataStore = GameObjectManager.instance.roomData;

  private isEditOpen = true;
  private toggleOpen() {
    this.isEditOpen = !this.isEditOpen;
  }

  private addData: MapDrawStore = {
    sceneLayerKey: "",
    pointList: [],
    type: "line",
    value: "",
    lineWidth: 1,
    strokeStyle: "rgb(0, 0, 0)",
    fillStyle: "rgba(255, 255, 0, 0.5)",
    fontSize: 24,
    textAnchor: "center-bottom",
    correctionText: createPoint(0, 0),
    style: ""
  };
  private vertexNumAdd: number = 3;

  @Watch("sceneLayerKey")
  private onChangeSceneLayerKey(value: string) {
    this.addData.sceneLayerKey = value;
    if (this.editData.sceneLayerKey !== value) {
      this.selectedMapDrawKey = null;
    }
  }

  @Watch("addData.sceneLayerKey")
  private onChangeAddDataSceneLayerKey(value: string) {
    this.sceneLayerKey = value;
  }

  private editData: MapDrawStore = {
    sceneLayerKey: "",
    pointList: [],
    type: "line",
    value: "",
    lineWidth: 1,
    strokeStyle: "rgb(0, 0, 0)",
    fillStyle: "rgba(255, 255, 0, 0.5)",
    fontSize: 24,
    textAnchor: "center-bottom",
    correctionText: createPoint(0, 0),
    style: ""
  };
  private isEditDataSetting: boolean = false;
  private vertexNumEdit: number = 3;

  private get sceneKey(): string {
    return this.roomData.sceneKey;
  }

  private sceneLayerKey: string = "";

  private selectedMapDrawKey: string | null = null;

  private sceneList = GameObjectManager.instance.sceneList;
  private sceneAndLayerList = GameObjectManager.instance.sceneAndLayerList;
  private sceneLayerList = GameObjectManager.instance.sceneLayerList;
  private mapDrawList = GameObjectManager.instance.mapDrawList;

  private get useMapDrawList() {
    return this.mapDrawList.filter(
      md => md.data!.sceneLayerKey === this.sceneLayerKey
    );
  }

  private get selectedIndex(): number {
    return this.useMapDrawList.findIndex(
      md => md.key === this.selectedMapDrawKey
    );
  }

  @VueEvent
  private async deleteMapDraw() {
    if (!this.selectedMapDrawKey) return;
    const deleteKey = this.selectedMapDrawKey;
    this.selectedMapDrawKey = null;
    await SocketFacade.instance.mapDrawListCC().deletePackage([deleteKey]);
  }

  private getIsMovable(n: number) {
    const selectedIndex = this.useMapDrawList.findIndex(
      md => md.key === this.selectedMapDrawKey
    );
    if (n < 0) return selectedIndex > 0;
    return selectedIndex >= 0 && selectedIndex < this.useMapDrawList.length - 1;
  }

  @VueEvent
  private async onClose() {
    await TaskManager.instance.ignition<ModeInfo, never>({
      type: "mode-change",
      owner: "Quoridorn",
      value: { type: "screen-mode", value: "normal" }
    });
  }

  @VueEvent
  private moveMapDraw(n: number) {
    const targetIdx = this.useMapDrawList.findIndex(
      md => md.key === this.selectedMapDrawKey
    );
    const target = this.useMapDrawList[targetIdx];
    const otherList = this.useMapDrawList.filter(
      md => md.key !== this.selectedMapDrawKey
    );
    const orderedList: StoreData<MapDrawStore>[] = [];
    switch (n) {
      case -2:
        orderedList.push(target, ...otherList);
        break;
      case -1:
        orderedList.push(
          ...replaceArrayElements(this.useMapDrawList, targetIdx - 1, targetIdx)
        );
        break;
      case 1:
        orderedList.push(
          ...replaceArrayElements(this.useMapDrawList, targetIdx + 1, targetIdx)
        );
        break;
      case 2:
        orderedList.push(...otherList, target);
        break;
      default:
    }
    setOrderByListOrder(orderedList);
    SocketFacade.instance.mapDrawListCC().updatePackage(
      orderedList.map(md => ({
        key: md.key,
        order: md.order,
        data: md.data!
      }))
    );
  }

  @VueEvent
  private getMapDrawLabel(obj: StoreData<MapDrawStore>): string {
    const prefix: string = this.$t(
      `selection.map-draw-type.${obj.data!.type}`
    ).toString();

    let suffix = "";
    switch (obj.data!.type) {
      case "text":
        suffix = obj.data!.value.split("\n")[0];
        break;
      case "line":
        const roundFunc = (num: number) => {
          return Math.round(num * 10) / 10;
        };
        const x = roundFunc(obj.data!.pointList[0].x);
        const y = roundFunc(obj.data!.pointList[0].y);
        suffix = `${x}, ${y}`;
        break;
      case "polygon":
        const vertexNum = obj.data!.pointList.length;
        suffix = `${this.$t("label.vertex-num")}: ${vertexNum}`;
        break;
      default:
    }
    return `${prefix}（${suffix}）`;
  }

  @LifeCycle
  private async beforeDestroy() {
    await TaskManager.instance.ignition<SelectMapDrawInfo, never>({
      type: "select-map-draw",
      owner: "Quoridorn",
      value: {
        sceneLayerKey: this.sceneLayerKey,
        mapDrawKey: null
      }
    });
  }

  @VueEvent
  private onClickMapDraw(key: string) {
    this.selectedMapDrawKey =
      this.selectedMapDrawKey && this.selectedMapDrawKey === key ? null : key;
  }

  @Watch("selectedMapDrawKey")
  private async onChangeSelectedMapDrawKey() {
    this.isEditOpen = true;
    await TaskManager.instance.ignition<SelectMapDrawInfo, never>({
      type: "select-map-draw",
      owner: "Quoridorn",
      value: {
        sceneLayerKey: this.sceneLayerKey,
        mapDrawKey: this.selectedMapDrawKey
      }
    });
    if (this.selectedMapDrawKey) {
      const mapDraw = findRequireByKey(
        this.mapDrawList,
        this.selectedMapDrawKey
      );
      this.isEditDataSetting = true;
      this.vertexNumEdit = mapDraw.data!.pointList.length;
      this.editData.pointList = mapDraw.data!.pointList;
      this.editData.fillStyle = mapDraw.data!.fillStyle;
      this.editData.type = mapDraw.data!.type;
      this.editData.strokeStyle = mapDraw.data!.strokeStyle;
      this.editData.lineWidth = mapDraw.data!.lineWidth;
      this.editData.value = mapDraw.data!.value;
      this.editData.sceneLayerKey = mapDraw.data!.sceneLayerKey;
      this.isEditDataSetting = false;
    } else {
      this.editData.type = "line";
      this.editData.strokeStyle = "#000000";
      this.editData.lineWidth = 1;
    }
  }

  @Watch("editData", { deep: true })
  @Watch("vertexNumEdit")
  private async onChangeEditData() {
    if (this.isEditDataSetting) return;
    if (!this.selectedMapDrawKey) return;
    const mapDraw = findRequireByKey(this.mapDrawList, this.selectedMapDrawKey);
    const pointList = clone(mapDraw.data!.pointList)!;
    if (this.editData.type === "polygon") {
      if (this.vertexNumEdit < pointList.length) {
        pointList.splice(this.vertexNumEdit, pointList.length);
      }
      for (let i = pointList.length; i < this.vertexNumEdit; i++) {
        const lastPoint = pointList[pointList.length - 1];
        pointList.push(createPoint(lastPoint.x + 30, lastPoint.y + 30));
      }
    }
    const updateData: MapDrawStore = {
      ...this.editData
    };
    updateData.pointList = pointList;
    await SocketFacade.instance.mapDrawListCC().updatePackage([
      {
        key: this.selectedMapDrawKey,
        data: updateData
      }
    ]);
    this.sceneLayerKey = this.editData.sceneLayerKey;
    await TaskManager.instance.ignition<SelectMapDrawInfo, never>({
      type: "select-map-draw",
      owner: "Quoridorn",
      value: {
        sceneLayerKey: this.sceneLayerKey,
        mapDrawKey: this.selectedMapDrawKey
      }
    });
  }

  @VueEvent
  private async addMapDrawSimple() {
    const pointList: Point[] = [createPoint(20, 20)];
    let addNum: number = 0;
    switch (this.addData.type) {
      case "text":
        addNum = 0;
        break;
      case "line":
        addNum = 1;
        break;
      case "polygon":
        addNum = this.vertexNumAdd - 1;
        break;
      default:
    }
    new Array(addNum).fill(null).forEach((_, i) => {
      pointList.push(
        createPoint(
          pointList[0].x + 30 * (i + 1),
          pointList[0].y + 30 * (i + 1)
        )
      );
    });
    this.addData.sceneLayerKey = this.sceneLayerKey;
    this.addData.pointList = pointList;
    this.vertexNumEdit = this.vertexNumAdd;
    this.selectedMapDrawKey = (
      await SocketFacade.instance
        .mapDrawListCC()
        .addDirect([{ data: this.addData }])
    )[0];
  }

  @VueEvent
  private async addContinuousMapDraw() {
    const mapDraw = findRequireByKey(this.mapDrawList, this.selectedMapDrawKey);
    const addData: MapDrawStore = {
      ...this.editData
    };
    addData.pointList = clone(mapDraw.data!.pointList)!;
    addData.sceneLayerKey = this.sceneLayerKey;
    addData.pointList[0].x = addData.pointList[1].x;
    addData.pointList[0].y = addData.pointList[1].y;
    addData.pointList[1].x += 30;
    addData.pointList[1].y += 30;
    this.selectedMapDrawKey = (
      await SocketFacade.instance.mapDrawListCC().addDirect([{ data: addData }])
    )[0];
  }

  @LifeCycle
  private created() {
    const useSceneAndLayerList = this.sceneAndLayerList.filter(
      sal => sal.data!.sceneKey === this.sceneKey && sal.data!.isUse
    );
    const useSceneLayerList = this.sceneLayerList.filter(sl =>
      useSceneAndLayerList.some(sal => sal.data!.layerKey === sl.key)
    );
    this.sceneLayerKey = useSceneLayerList[0]?.key || "";
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

#map-draw-controller {
  @include flex-box(column, flex-start, flex-start);
  position: fixed;
  box-sizing: border-box;
  top: var(--menu-bar-height);
  bottom: 0;
  left: 0;
  background-color: rgba(164, 133, 251, 0.8);
  padding: 0.5rem;

  > label {
    @include flex-box(row, flex-start, flex-start, wrap);
    align-self: stretch;
  }
}

/*
.close-button {
  position: absolute;
  right: 0.5rem;
  top: 0.5rem;
}
*/

.map-draw-box {
  @include flex-box(column, stretch, flex-start);
  align-self: stretch;
  overflow-y: scroll;
  min-height: 5em;
  background-color: var(--uni-color-white);
  flex: 1;

  .map-draw {
    @include flex-box(row, space-between, center);
    height: 2em;
    min-height: 2em;
    cursor: pointer;

    &:nth-child(odd) {
      background-color: rgba(247, 247, 247, 1);
    }

    &.selected {
      background-color: var(--uni-color-skyblue);
    }
    &.editted {
      background-color: var(--uni-color-gray);
    }

    .label {
      flex: 1;
      overflow: hidden;
      padding-right: 0.2rem;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .map-draw-model {
      width: 3em;
      min-width: 3em;

      &.text {
        content: attr(data-value);
        border: none;
        background-color: transparent !important;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      &.line {
        height: 0;
        border-bottom-style: solid;
      }

      &.polygon {
        height: 1em;
        border-style: solid;
      }
    }
  }

  .space {
    flex: 1;

    &.even {
      background-size: calc(var(--table-row-height) * 2)
        calc(var(--table-row-height) * 2);
      background-image: linear-gradient(
        0deg,
        rgb(247, 247, 247) 50%,
        white 51%
      );
    }
    &.odd {
      background-size: calc(var(--table-row-height) * 2)
        calc(var(--table-row-height) * 2);
      background-image: linear-gradient(
        0deg,
        white 50%,
        rgb(247, 247, 247) 51%
      );
    }
  }
}

fieldset {
  min-width: 0;
  box-sizing: border-box;
  margin: 0.5rem 0 0 0;
  padding: 0 0.5rem 0.5rem;
  background-color: white;

  &.close {
    height: 5em;
    overflow-y: hidden;
  }

  legend {
    background-color: inherit;
    border: inherit;
    line-height: 2em;
    box-sizing: border-box;

    a {
      color: var(--uni-color-blue);
      cursor: pointer;
    }
  }

  div {
    line-height: 2em;
  }
}
</style>
