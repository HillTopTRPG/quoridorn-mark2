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
        <map-board :scene="sceneInfo" :sceneId="sceneId" />
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
import { Matrix, Point } from "address";
import { Task, TaskResult } from "task";
import TaskManager, { MouseMoveParam } from "@/app/core/task/TaskManager";
import { ContextTaskInfo } from "context";
import TaskProcessor, {
  TaskProcessorSimple
} from "@/app/core/task/TaskProcessor";
import VueEvent from "@/app/core/decorator/VueEvent";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import { Scene, Texture } from "@/@types/room";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { AddObjectInfo } from "@/@types/data";
import SceneLayerComponent from "@/app/basic/map/SceneLayerComponent.vue";
import CssManager from "@/app/core/css/CssManager";

@Component({
  components: {
    SceneLayerComponent,
    MapBoard,
    MapMask,
    Chit
  }
})
export default class GameTable extends AddressCalcMixin {
  private sceneList = GameObjectManager.instance.sceneList;
  private sceneLayerList = GameObjectManager.instance.sceneLayerList;
  private sceneAndLayerList = GameObjectManager.instance.sceneAndLayerList;
  private roomData = GameObjectManager.instance.roomData;
  private sceneId: string | null = null;
  private sceneInfo: Scene | null = null;

  @Watch("roomData", { immediate: true, deep: true })
  private onChangeRoomData() {
    const sceneId = this.roomData.sceneId || null;
    if (GameObjectManager.instance.isSceneEditing) {
      GameObjectManager.instance.sceneEditingUpdateSceneId = sceneId;
    } else {
      this.sceneId = sceneId;
    }
  }

  private get useLayerList() {
    return this.sceneAndLayerList
      .filter(
        mal => mal.data && mal.data.sceneId === this.sceneId && mal.data.isUse
      )
      .map(mal => mal.data!.layerId)
      .map(layerId => this.sceneLayerList.filter(ml => ml.id === layerId)[0])
      .filter(ml => ml);
  }

  private wheel: number = 0;

  private key = "game-table";

  private isMounted: boolean = false;

  private static get gameTableContainerElm(): HTMLElement {
    return document.getElementById("gameTableContainer")!;
  }

  private static get gameTableElm(): HTMLElement {
    return document.getElementById("gameTable")!;
  }

  private static get gridPaperElm(): HTMLElement {
    return document.getElementById("grid-paper")!;
  }

  private static get tableBackElm(): HTMLElement {
    return document.getElementById("table-background")!;
  }

  private static get mapCanvasBackElm(): HTMLElement {
    return document.getElementById("map-canvas-background")!;
  }

  private static get backSceneElm(): HTMLElement {
    return document.getElementById("back-scene")!;
  }

  @VueEvent
  private async mounted() {
    this.isMounted = true;
    CssManager.instance.propMap.wheel = 0;
    this.wheel = 0;
    GameTable.gameTableContainerElm.style.transform = `translateZ(${this.wheel})`;
    await this.updateScreen();
  }

  @Watch("sceneId")
  private async onChangeSceneId() {
    await this.updateScreen();
  }

  @Watch("sceneList", { deep: true })
  private async updateScreen() {
    if (!this.isMounted) return;
    const sceneData = this.sceneList.filter(s => s.id === this.sceneId)[0];
    this.sceneInfo = sceneData ? sceneData.data! : null;
    if (this.sceneInfo) {
      CssManager.instance.propMap.totalColumn = this.sceneInfo.columns;
      CssManager.instance.propMap.totalRow = this.sceneInfo.rows;
      CssManager.instance.propMap.gridSize = this.sceneInfo.gridSize!;
      CssManager.instance.propMap.marginColumn = this.sceneInfo.margin.columns;
      CssManager.instance.propMap.marginRow = this.sceneInfo.margin.rows;
      CssManager.instance.propMap.marginBorderWidth = this.sceneInfo.margin.border.width;
    }
    CssManager.instance.propMap.currentAngle = 0;
    const totalLeftX = Math.round(this.point.x + this.pointDiff.x);
    const totalLeftY = Math.round(this.point.y + this.pointDiff.y);
    CssManager.instance.propMap.totalLeftX = totalLeftX;
    CssManager.instance.propMap.totalLeftY = totalLeftY;
    await this.setCss(this.sceneInfo);
  }

  private async setCss(scene: Scene | null) {
    if (!this.isMounted || !scene) return;
    const margin = scene.margin;
    const background = scene.background;
    await GameTable.setBackground(GameTable.mapCanvasBackElm, scene.texture);
    await GameTable.setBackground(GameTable.backSceneElm, background.texture);
    await GameTable.setBackground(GameTable.tableBackElm, margin.texture);
    GameTable.gridPaperElm.style.backgroundSize = `${scene.gridSize!}px ${scene.gridSize!}px`;
    GameTable.gridPaperElm.style.backgroundColor = margin.maskColor;
    GameTable.tableBackElm.style.filter = `blur(${margin.maskBlur}px)`;
    GameTable.backSceneElm.style.filter = `blur(${background.maskBlur}px)`;
    GameTable.gridPaperElm.style.setProperty(
      "--margin-grid-color-bold",
      margin.isUseGrid ? margin.gridColorBold : "transparent"
    );
    GameTable.gridPaperElm.style.setProperty(
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
    GameTable.gameTableElm.style.width = `${gameTableSizeW}px`;
    GameTable.gameTableElm.style.height = `${gameTableSizeH}px`;
    GameTable.gridPaperElm.style.width = `${gameTableSizeW}px`;
    GameTable.gridPaperElm.style.height = `${gameTableSizeH}px`;
    GameTable.gameTableElm.style.borderWidth = `${margin.border.width}px`;
    GameTable.gameTableElm.style.borderColor = margin.border.color;
    GameTable.gameTableElm.style.borderStyle = margin.border.style;
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
    GameTable.gameTableElm.style.transform = `translate(${totalLeftX}px, ${totalLeftY}px) rotateZ(${currentAngle}deg)`;
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
    GameTable.gameTableElm.style.transform = `translate(${totalLeftX}px, ${totalLeftY}px) rotateZ(${currentAngle}deg)`;
  }

  @Watch("wheel")
  private onChangeWheel(wheel: number, oldValue: number) {
    const wheelDiff = wheel - oldValue;
    CssManager.instance.propMap.wheel = wheel;
    GameTable.gameTableContainerElm.style.transform = `translateZ(${wheel}px)`;

    // マウス座標を中心にして拡大縮小させているように見せるため、マップの座標を補正する
    const mouse =
      TaskManager.instance.getLastValue<Point>("mouse-moving") ||
      createPoint(0, 0);

    const diffCenter = createPoint(
      ((mouse.x - window.innerWidth / 2) * wheelDiff) / 1000,
      ((mouse.y - window.innerHeight / 2) * wheelDiff) / 1000
    );

    this.point.x -= diffCenter.x;
    this.point.y -= diffCenter.y;
  }

  @TaskProcessor("action-wheel-finished")
  private async actionWheelFinished(
    task: Task<boolean, never>
  ): Promise<TaskResult<never> | void> {
    const isPlus = task!.value || false;
    const add = 100 * (isPlus ? 1 : -1);
    if (isPlus && this.wheel < 800) this.wheel += add;
    if (!isPlus && this.wheel > -2400) this.wheel += add;
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

  @TaskProcessor("mouse-moving-finished")
  private async mouseMoveFinished(
    task: Task<Point, never>,
    param: MouseMoveParam
  ): Promise<TaskResult<never> | void> {
    if (!param || param.key !== this.key) return;
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
    const matrix: Matrix = {
      column: Math.floor(locateOnCanvas.x / gridSize),
      row: Math.floor(locateOnCanvas.y / gridSize)
    };
    if (isGridFit) {
      locateOnCanvas.x = matrix.column * gridSize;
      locateOnCanvas.y = matrix.row * gridSize;
    }

    if (["map-mask", "chit"].findIndex(t => t === type) > -1) {
      await TaskManager.instance.ignition<AddObjectInfo, never>({
        type: "added-object",
        owner: "Quoridorn",
        value: {
          dropWindow,
          point: locateOnCanvas,
          matrix
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
