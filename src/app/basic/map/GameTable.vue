<template>
  <div id="gameTableContainer">
    <div
      @dragover.prevent
      @drop.prevent="drop"
      dropzone="move"
      id="gameTable"
      @keydown.enter.stop="globalEnter"
      @keyup.enter.stop
      @keydown.229.stop
      @keyup.229.stop
    >
      <div id="table-background-container">
        <div id="table-background"></div>
      </div>
      <div id="grid-paper"></div>

      <div
        id="mapBoardFrame"
        @contextmenu.prevent
        @mousedown.left="leftDown"
        @mousedown.right="rightDown"
        @touchstart="leftDown"
      >
        <map-board :screen="screen" />

        <map-layer-component
          v-for="layer in useLayerList"
          :key="layer.id"
          :layer="layer"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import MapBoard from "./MapBoard.vue";
import AddressCalcMixin from "@/app/basic/common/mixin/AddressCalcMixin.vue";

import MapMask from "@/app/basic/map-object/map-mask/MapMask.vue";
import Chit from "@/app/basic/map-object/chit/Chit.vue";

import { Component } from "vue-mixin-decorator";
import { Watch } from "vue-property-decorator";
import {
  arrangeAngle,
  createPoint,
  getEventPoint
} from "@/app/core/Coordinate";
import { Point } from "@/@types/address";
import { Task, TaskResult } from "@/@types/task";
import TaskManager, { MouseMoveParam } from "@/app/core/task/TaskManager";
import Logging from "@/app/core/logger/Logging";
import { ContextTaskInfo } from "@/@types/context";
import TaskProcessor, {
  TaskProcessorSimple
} from "@/app/core/task/TaskProcessor";
import VueEvent from "@/app/core/decorator/VueEvent";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import { StoreUseData } from "@/@types/store";
import { ApplicationError } from "@/app/core/error/ApplicationError";
import { MapLayer, Screen, RoomData, Texture } from "@/@types/room";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { AddObjectInfo } from "@/@types/data";
import MapLayerComponent from "@/app/basic/map/MapLayerComponent.vue";
import CssManager from "@/app/core/css/CssManager";

@Component({
  components: {
    MapLayerComponent,
    MapBoard,
    MapMask,
    Chit
  }
})
export default class GameTable extends AddressCalcMixin {
  private mapLayerList = GameObjectManager.instance.mapLayerList;
  private mapAndLayerList = GameObjectManager.instance.mapAndLayerList;

  private useLayerList: StoreUseData<MapLayer>[] = [];

  private getMapLayerList() {
    return this.mapAndLayerList
      .filter(mal => mal.data && mal.data.mapId === this.mapId)
      .map(mal => mal.data!.layerId)
      .map(layerId => this.mapLayerList.filter(ml => ml.id === layerId)[0])
      .filter(ml => ml);
  }

  private wheelTimer: number | null = null;
  private wheel: number = 0;

  private key = "game-table";

  private mapId: string | null = null;
  private screen: Screen | null = null;
  private isMounted: boolean = false;

  private get appElm(): HTMLElement {
    return document.getElementById("app")!;
  }

  private get gameTableContainerElm(): HTMLElement {
    return document.getElementById("gameTableContainer")!;
  }

  private get gameTableElm(): HTMLElement {
    return document.getElementById("gameTable")!;
  }

  private get gridPaperElm(): HTMLElement {
    return document.getElementById("grid-paper")!;
  }

  private get tableBackElm(): HTMLElement {
    return document.getElementById("table-background")!;
  }

  private get mapCanvasBackElm(): HTMLElement {
    return document.getElementById("map-canvas-background")!;
  }

  private get backScreenElm(): HTMLElement {
    return document.getElementById("back-screen")!;
  }

  @VueEvent
  private async mounted() {
    const screenListCC = SocketFacade.instance.screenListCC();
    const roomDataCC = SocketFacade.instance.roomDataCC();
    const roomData: StoreUseData<RoomData> = (
      await roomDataCC.getList(false)
    )[0];
    if (!roomData) throw new ApplicationError("No such roomData.");

    this.mapId = roomData.data!.mapId;
    const screenData = await screenListCC.getData(this.mapId);
    await screenListCC.setSnapshot(this.key, this.mapId, async snapshot => {
      if (snapshot.data!.status === "modified") {
        const screen = snapshot.data!.data!;
        CssManager.instance.propMap.totalColumn = screen.columns;
        CssManager.instance.propMap.totalRow = screen.rows;
        CssManager.instance.propMap.gridSize = screen.gridSize!;
        CssManager.instance.propMap.marginColumn = screen.margin.columns;
        CssManager.instance.propMap.marginRow = screen.margin.rows;
        CssManager.instance.propMap.marginBorderWidth =
          screen.margin.border.width;
        await this.setCss(screen);
        this.screen = screen;
      }
    });
    if (!screenData) throw new ApplicationError("No such mapData.");
    this.screen = screenData.data!;
    CssManager.instance.propMap.totalColumn = this.screen!.columns;
    CssManager.instance.propMap.totalRow = this.screen!.rows;
    CssManager.instance.propMap.gridSize = this.screen!.gridSize!;
    CssManager.instance.propMap.marginColumn = this.screen!.margin.columns;
    CssManager.instance.propMap.marginRow = this.screen!.margin.rows;
    CssManager.instance.propMap.marginBorderWidth = this.screen!.margin.border.width;
    CssManager.instance.propMap.wheel = 0;
    CssManager.instance.propMap.currentAngle = 0;
    const totalLeftX = Math.round(this.point.x + this.pointDiff.x);
    const totalLeftY = Math.round(this.point.y + this.pointDiff.y);
    CssManager.instance.propMap.totalLeftX = totalLeftX;
    CssManager.instance.propMap.totalLeftY = totalLeftY;

    this.useLayerList = await this.getMapLayerList();

    this.isMounted = true;
    this.gameTableContainerElm.style.transform = `translateZ(${0})`;
    await this.setCss(this.screen);
  }

  private async setCss(screen: Screen) {
    if (!this.isMounted) return;
    const margin = screen.margin;
    const background = screen.background;
    await GameTable.setBackground(this.mapCanvasBackElm, screen.texture);
    await GameTable.setBackground(this.backScreenElm, background.texture);
    await GameTable.setBackground(this.tableBackElm, margin.texture);
    this.gridPaperElm.style.backgroundSize = `${screen.gridSize!}px ${screen.gridSize!}px`;
    this.gridPaperElm.style.backgroundColor = margin.maskColor;
    this.tableBackElm.style.filter = `blur(${margin.maskBlur}px)`;
    this.backScreenElm.style.filter = `blur(${background.maskBlur}px)`;
    this.gridPaperElm.style.setProperty(
      "--margin-grid-color-bold",
      margin.isUseGrid ? margin.gridColorBold : "transparent"
    );
    this.gridPaperElm.style.setProperty(
      "--margin-grid-color-thin",
      margin.isUseGrid ? margin.gridColorThin : "transparent"
    );
    const marginColumns = margin.columns;
    const marginRows = margin.rows;
    const columns = CssManager.instance.propMap.totalColumn;
    const rows = CssManager.instance.propMap.totalRow;
    const gridSize = CssManager.instance.propMap.gridSize;

    const gameTableSizeW = (columns + marginColumns * 2) * gridSize;
    const gameTableSizeH = (rows + marginRows * 2) * gridSize;
    this.gameTableElm.style.width = `${gameTableSizeW}px`;
    this.gameTableElm.style.height = `${gameTableSizeH}px`;
    this.gridPaperElm.style.width = `${gameTableSizeW}px`;
    this.gridPaperElm.style.height = `${gameTableSizeH}px`;
    this.gameTableElm.style.borderWidth = `${margin.border.width}px`;
    this.gameTableElm.style.borderColor = margin.border.color;
    this.gameTableElm.style.borderStyle = margin.border.style;
  }

  public static changeImagePath(path: string) {
    if (path.startsWith("/")) return `..${path}`;
    if (path.startsWith("./")) return `.${path}`;
    return path;
  }

  private static async setBackground(elm: HTMLElement, info: Texture) {
    let direction: string = "";
    let backgroundColor: string = "transparent";
    let backgroundImage: string = "none";
    if (info.type === "color") {
      backgroundColor = info.backgroundColor;
    } else {
      const imageData = await SocketFacade.instance
        .imageDataCC()
        .getData(info.imageId);
      if (imageData && imageData.data) {
        backgroundImage = `url("${GameTable.changeImagePath(
          imageData.data.data
        )}")`;
      }
      if (info.direction === "horizontal") direction = "scale(-1, 1)";
      if (info.direction === "vertical") direction = "scale(1, -1)";
      if (info.direction === "180") direction = "rotate(180deg)";
    }
    elm.style.backgroundColor = backgroundColor;
    elm.style.backgroundImage = backgroundImage;
    elm.style.transform = direction;
  }

  @Watch("isMounted")
  @Watch("currentAngle")
  private onChangeCurrentAngle() {
    const currentAngle = this.currentAngle;
    CssManager.instance.propMap.currentAngle = currentAngle;
    const totalLeftX = CssManager.instance.propMap.totalLeftX;
    const totalLeftY = CssManager.instance.propMap.totalLeftY;
    this.gameTableElm.style.transform = `translate(${totalLeftX}px, ${totalLeftY}px) rotateZ(${currentAngle}deg)`;
  }

  @Watch("isMounted")
  @Watch("point", { deep: true })
  @Watch("pointDiff", { deep: true })
  private onChangeTotalLeft() {
    const totalLeftX = this.point.x + this.pointDiff.x;
    const totalLeftY = this.point.y + this.pointDiff.y;
    CssManager.instance.propMap.totalLeftX = totalLeftX;
    CssManager.instance.propMap.totalLeftY = totalLeftY;
    const currentAngle = CssManager.instance.propMap.currentAngle;
    this.gameTableElm.style.transform = `translate(${totalLeftX}px, ${totalLeftY}px) rotateZ(${currentAngle}deg)`;
  }

  @Watch("wheel")
  private onChangeWheel(wheel: number, oldValue: number) {
    if (wheel < -2400 || wheel > 800) {
      this.wheel = oldValue;
      return;
    }
    CssManager.instance.propMap.wheel = wheel;
    this.gameTableContainerElm.style.transform = `translateZ(${wheel}px)`;
  }

  @TaskProcessor("action-wheel-finished")
  private async actionWheelFinished(
    task: Task<boolean, never>
  ): Promise<TaskResult<never> | void> {
    this.wheel += 100 * (task!.value || false ? 1 : -1);

    await TaskManager.instance.ignition<ModeInfo, never>({
      type: "mode-change",
      owner: "Quoridorn",
      value: {
        type: "wheel",
        value: "on"
      }
    });
    if (this.wheelTimer !== null) {
      window.clearTimeout(this.wheelTimer);
    }
    this.wheelTimer = window.setTimeout(async () => {
      await TaskManager.instance.ignition<ModeInfo, never>({
        type: "mode-change",
        owner: "Quoridorn",
        value: {
          type: "wheel",
          value: "off"
        }
      });
      this.wheelTimer = null;
    }, 600);

    // task.resolve();
  }

  @TaskProcessorSimple
  private async item01EmitFinished(
    task: Task<number, never>
  ): Promise<TaskResult<never> | void> {
    window.console.log("ちゃんと拾えた");

    task.resolve();
  }

  @VueEvent
  private globalEnter() {
    // this.setProperty({
    //   property: "private.display.chatWindow.command",
    //   logOff: true,
    //   isNotice: false,
    //   value: { command: "globalEnter", payload: {} }
    // });
  }

  /**
   * マウス左ボタン押下
   */
  @VueEvent
  private leftDown(event: MouseEvent | TouchEvent): void {
    this.dragFrom = getEventPoint(event);
    this.mouseDown("left");
  }

  /**
   * マウス右ボタン押下
   */
  @VueEvent
  private rightDown(event: MouseEvent | TouchEvent): void {
    const mouse = getEventPoint(event);
    const calcResult = this.calcCoordinate(mouse, this.currentAngle);
    this.dragFrom = mouse;
    this.rotateFrom = calcResult.angle;
    this.mouseDown("right");
  }

  private mouseDown(button: string) {
    this.pointDiff = createPoint(0, 0);
    TaskManager.instance.setTaskParam<MouseMoveParam>("mouse-moving-finished", {
      key: this.key,
      type: `button-${button}`
    });
    TaskManager.instance.setTaskParam<MouseMoveParam>(
      button === "right"
        ? "mouse-move-end-right-finished"
        : `mouse-move-end-left-finished`,
      {
        key: this.key,
        type: `${button}-click`
      }
    );
  }

  private dragFrom: Point = createPoint(0, 0);

  private pointDiff: Point = createPoint(0, 0);
  private point: Point = createPoint(0, 0);

  private rotateFrom: number = 0;
  private rotateDiff: number = 0;
  private rotate: number = 0;

  private setLocateId: number | null = null;

  @TaskProcessor("mouse-moving-finished")
  private async mouseMoveFinished(
    task: Task<Point, never>,
    param: MouseMoveParam
  ): Promise<TaskResult<never> | void> {
    if (param.key !== this.key) return;
    const calcResult = this.calcCoordinate(task.value!, this.currentAngle);
    const point = task.value!;

    // タスクのパラメータ情報「type」をクリックからドラッグに変更
    const button = param.type!.split("-")[1];
    const type = `${button}-drag`;
    TaskManager.instance.setTaskParam<MouseMoveParam>(
      button === "right"
        ? "mouse-move-end-right-finished"
        : `mouse-move-end-left-finished`,
      {
        key: this.key,
        type
      }
    );

    if (button === "left") {
      const zoom = (1000 - this.wheel) / 1000;
      this.pointDiff = createPoint(
        (point.x - this.dragFrom.x) * zoom,
        (point.y - this.dragFrom.y) * zoom
      );
    }
    if (button === "right") {
      this.rotateDiff = arrangeAngle(calcResult.angle - this.rotateFrom);
    }

    task.resolve();
  }

  private get currentAngle(): number {
    return arrangeAngle(this.rotate + this.rotateDiff);
  }

  @TaskProcessor("mouse-move-end-left-finished")
  private async mouseLeftUpFinished(
    task: Task<Point, never>,
    param: MouseMoveParam
  ): Promise<TaskResult<never> | void> {
    if (!param || param.key !== this.key) return;
    this.point.x += this.pointDiff.x;
    this.point.y += this.pointDiff.y;
    this.pointDiff = createPoint(0, 0);

    TaskManager.instance.setTaskParam("mouse-moving-finished", null);
    TaskManager.instance.setTaskParam("mouse-move-end-left-finished", null);

    task.resolve();
  }

  @TaskProcessor("mouse-move-end-right-finished")
  private async mouseRightUpFinished(
    task: Task<Point, never>,
    param: MouseMoveParam
  ): Promise<TaskResult<never> | void> {
    if (!param || param.key !== this.key) return;
    const point: Point = task.value!;

    const eventType = param ? param.type!.split("-")[1] : "";
    if (eventType === "click") {
      // 右クリックメニュー表示
      setTimeout(async () => {
        await TaskManager.instance.ignition<ContextTaskInfo, never>({
          type: "context-open",
          owner: "Quoridorn",
          value: {
            type: "map",
            target: null,
            x: point.x,
            y: point.y
          }
        });
      });
    } else {
      // マップ回転
      this.rotate = arrangeAngle(this.rotate + this.rotateDiff);
      this.rotateDiff = 0;
    }

    TaskManager.instance.setTaskParam("mouse-moving-finished", null);
    TaskManager.instance.setTaskParam("mouse-move-end-right-finished", null);

    task.resolve();
  }

  @VueEvent
  private async drop(event: DragEvent): Promise<void> {
    const type = event.dataTransfer!.getData("dropType");
    const dropWindow = event.dataTransfer!.getData("dropWindow");
    const offsetX = event.dataTransfer!.getData("offsetX");
    const offsetY = event.dataTransfer!.getData("offsetY");
    const canvasAddress = this.calcCanvasAddress(
      event.pageX,
      event.pageY,
      this.currentAngle,
      offsetX ? parseInt(offsetX, 10) : undefined,
      offsetY ? parseInt(offsetY, 10) : undefined
    );
    const locateOnCanvas = canvasAddress.locateOnCanvas;

    // TODO isGridFit
    const isGridFit = true;
    const gridSize = CssManager.instance.propMap.gridSize;
    if (isGridFit) {
      locateOnCanvas.x = Math.floor(locateOnCanvas.x / gridSize) * gridSize;
      locateOnCanvas.y = Math.floor(locateOnCanvas.y / gridSize) * gridSize;
    }

    if (["map-mask", "chit"].findIndex(t => t === type) > -1) {
      await TaskManager.instance.ignition<AddObjectInfo, never>({
        type: "added-object",
        owner: "Quoridorn",
        value: {
          dropWindow,
          point: locateOnCanvas
        }
      });
    }
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

#gameTableContainer {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 7;
}

#gameTable {
  position: fixed;
  display: block;
  margin: auto;
  text-align: center;
  vertical-align: middle;
  cursor: crosshair;
  z-index: -1;
  perspective: 1000px;
  overflow: visible;
  border-style: var(--margin-border-style);
  border-color: var(--margin-border-color);
  width: var(--grid-paper-width);
  height: var(--grid-paper-height);
  filter: var(--filter);
  /* JavaScriptで設定されるプロパティ
  border-width
  transform
  */
}

#table-background-container {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  overflow: hidden;
}

#table-background {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  filter: blur(var(--mask-blur));
  /* JavaScriptで設定されるプロパティ
  background-image
  background-color
  transform
  */
}

#grid-paper {
  position: relative;
  width: var(--grid-paper-width);
  overflow: hidden;
  z-index: 2;
  height: var(--grid-paper-height);
  background-position: 1px 1px;
  background-size: var(--gridSize) var(--gridSize);
  background-color: var(--mask-color);
  background-image: linear-gradient(
      0deg,
      transparent -2px,
      var(--margin-grid-color-bold) 2px,
      var(--margin-grid-color-bold) 3%,
      transparent 4%,
      transparent 20%,
      var(--margin-grid-color-thin) 21%,
      var(--margin-grid-color-thin) 22%,
      transparent 23%,
      transparent 40%,
      var(--margin-grid-color-thin) 41%,
      var(--margin-grid-color-thin) 42%,
      transparent 43%,
      transparent 60%,
      var(--margin-grid-color-thin) 61%,
      var(--margin-grid-color-thin) 62%,
      transparent 63%,
      transparent 80%,
      var(--margin-grid-color-thin) 81%,
      var(--margin-grid-color-thin) 82%,
      transparent 83%,
      transparent
    ),
    linear-gradient(
      270deg,
      transparent -2px,
      var(--margin-grid-color-bold) 2px,
      var(--margin-grid-color-bold) 3%,
      transparent 4%,
      transparent 20%,
      var(--margin-grid-color-thin) 21%,
      var(--margin-grid-color-thin) 22%,
      transparent 23%,
      transparent 40%,
      var(--margin-grid-color-thin) 41%,
      var(--margin-grid-color-thin) 42%,
      transparent 43%,
      transparent 60%,
      var(--margin-grid-color-thin) 61%,
      var(--margin-grid-color-thin) 62%,
      transparent 63%,
      transparent 80%,
      var(--margin-grid-color-thin) 81%,
      var(--margin-grid-color-thin) 82%,
      transparent 83%,
      transparent
    );
}

#mapBoardFrame {
  @include flex-box(row, center, center);
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  box-sizing: border-box;
  border: none;
  text-align: center;
  vertical-align: middle;
  z-index: 3;
}
</style>
