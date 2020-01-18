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
      <div id="table-background"></div>
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

  private get gridPaperElm(): HTMLElement {
    return document.getElementById("grid-paper")!;
  }

  private get tableBackElm(): HTMLElement {
    return document.getElementById("table-background")!;
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
    await screenListCC.setSnapshot(this.key, this.mapId, snapshot => {
      if (snapshot.data!.status === "modified") {
        this.screen = snapshot.data!.data!;
      }
    });
    if (!screenData) throw new ApplicationError("No such mapData.");
    this.screen = screenData.data!;
    this.useLayerList = await this.getMapLayerList();

    this.isMounted = true;
    document.documentElement.style.setProperty("--wheel", `0px`);
  }

  @Watch("isMounted")
  @Watch("screen")
  private async onChangeScreen() {
    await GameTable.setBackground("map-canvas-container", this.screen!.texture);
    await GameTable.setBackground(
      "back-screen",
      this.screen!.background.texture
    );
    await GameTable.setBackground(
      "table-background",
      this.screen!.margin.texture
    );
    this.appElm.style.setProperty(
      "--totalColumn",
      this.screen!.columns!.toString(10)
    );
    this.appElm.style.setProperty(
      "--totalRow",
      this.screen!.rows!.toString(10)
    );
    this.appElm.style.setProperty("--gridSize", this.screen!.gridSize! + "px");
    this.appElm.style.setProperty("--gridColor", this.screen!.gridColor!);
    this.appElm.style.setProperty("--fontColor", this.screen!.fontColor!);
    this.gridPaperElm.style.setProperty(
      "--mask-color",
      this.screen!.margin.maskColor
    );
    this.tableBackElm.style.setProperty(
      "--mask-blur",
      this.screen!.margin.maskBlur + "px"
    );
    document
      .getElementById("back-screen")!
      .style.setProperty(
        "--mask-blur",
        this.screen!.background.maskBlur + "px"
      );
    if (this.screen!.margin.isUseGrid) {
      this.gridPaperElm.style.setProperty(
        "--margin-grid-color-bold",
        this.screen!.margin.gridColorBold
      );
    } else {
      this.gridPaperElm.style.setProperty(
        "--margin-grid-color-bold",
        "transparent"
      );
    }
    if (this.screen!.margin.isUseGrid) {
      this.gridPaperElm.style.setProperty(
        "--margin-grid-color-thin",
        this.screen!.margin.gridColorThin
      );
    } else {
      this.gridPaperElm.style.setProperty(
        "--margin-grid-color-thin",
        "transparent"
      );
    }
    this.appElm.style.setProperty(
      "--margin-column",
      this.screen!.margin.columns.toString(10)
    );
    this.appElm.style.setProperty(
      "--margin-row",
      this.screen!.margin.rows.toString(10)
    );
    this.appElm.style.setProperty(
      "--margin-border-width",
      this.screen!.margin.border.width + "px"
    );
    this.appElm.style.setProperty(
      "--margin-border-color",
      this.screen!.margin.border.color
    );
    this.appElm.style.setProperty(
      "--margin-border-style",
      this.screen!.margin.border.style
    );
  }

  public static changeImagePath(path: string) {
    if (path.startsWith("/")) return `..${path}`;
    if (path.startsWith("./")) return `.${path}`;
    return path;
  }

  private static async setBackground(targetId: string, info: Texture) {
    const elm: HTMLElement = document.getElementById(targetId) as HTMLElement;
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
    elm.style.setProperty("--background-color", backgroundColor);
    elm.style.setProperty("--background-image", backgroundImage);
    elm.style.setProperty("--image-direction", direction);
  }

  @Watch("isMounted")
  @Watch("currentAngle")
  private onChangeCurrentAngle() {
    this.appElm.style.setProperty("--currentAngle", this.currentAngle + "deg");
  }

  @Watch("isMounted")
  @Watch("point", { deep: true })
  @Watch("pointDiff", { deep: true })
  private onChangeTotalLeft() {
    if (this.setLocateId === null)
      this.setLocateId = window.setTimeout(() => {
        const totalLeftX = this.point.x + this.pointDiff.x;
        this.appElm.style.setProperty("--totalLeftX", totalLeftX + "px");
        const totalLeftY = this.point.y + this.pointDiff.y;
        this.appElm.style.setProperty("--totalLeftY", totalLeftY + "px");
        setTimeout(() => {
          this.setLocateId = null;
        }, 100);
      });
  }

  @Watch("wheel")
  private onChangeWheel(wheel: number, oldValue: number) {
    if (wheel < -2400 || wheel > 800) {
      this.wheel = oldValue;
      return;
    }
    document.documentElement.style.setProperty("--wheel", `${wheel}px`);
  }

  @TaskProcessor("action-wheel-finished")
  // @Logging
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

    task.resolve();
  }

  @TaskProcessorSimple
  @Logging
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
    const gridSize = AddressCalcMixin.getMapGridSize();
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
#gameTableContainer {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  transform: translateZ(var(--wheel, 0)) rotateY(0deg) rotateX(0deg);
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
  border-width: var(--margin-border-width);
  border-style: var(--margin-border-style);
  border-color: var(--margin-border-color);
  width: calc(
    (var(--totalColumn) + var(--margin-column) * 2) * var(--gridSize)
  );
  height: calc((var(--totalRow) + var(--margin-row) * 2) * var(--gridSize));
  transform: translate(var(--totalLeftX), var(--totalLeftY))
    rotateZ(var(--currentAngle));
  filter: var(--filter);

  #table-background {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    overflow: hidden;

    &:before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-image: var(--background-image);
      background-color: var(--background-color);
      background-size: cover;
      background-position: center;
      filter: blur(var(--mask-blur));
      transform: var(--image-direction);
    }
  }

  #grid-paper {
    position: relative;
    width: calc(
      (var(--totalColumn) + var(--margin-column) * 2) * var(--gridSize)
    );
    overflow: hidden;
    z-index: 2;
    height: calc((var(--totalRow) + var(--margin-row) * 2) * var(--gridSize));
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

    /*
    &:after {
      content: "";
      background: inherit;
      -webkit-filter: blur(10px);
      -ms-filter: blur(10px);
      filter: blur(10px);
      position: absolute;
      top: -10px;
      left: -10px;
      right: -10px;
      bottom: -10px;
    }
    */
  }

  #mapBoardFrame {
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
}
</style>
