<template>
  <div id="gameTableContainer" @contextmenu.prevent>
    <div
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
        <map-board :scene="sceneInfo" :sceneKey="sceneKey" v-if="isMounted" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import MapBoard from "./MapBoard.vue";
import { Component } from "vue-mixin-decorator";
import { Watch } from "vue-property-decorator";
import { Task, TaskResult } from "task";
import { ContextTaskInfo } from "context";
import { DropPieceInfo } from "task-info";
import { RoomDataStore, SceneStore } from "@/@types/store-data";
import { AddObjectInfo } from "@/@types/data";
import { Matrix, Point, Texture } from "@/@types/store-data-optional";
import { findByKey, getTextureStyle } from "@/app/core/utility/Utility";
import TaskProcessor, {
  TaskProcessorSimple
} from "@/app/core/task/TaskProcessor";
import TaskManager, { MouseMoveParam } from "@/app/core/task/TaskManager";
import {
  arrangeAngle,
  createPoint,
  getEventPoint
} from "@/app/core/utility/CoordinateUtility";
import VueEvent from "@/app/core/decorator/VueEvent";
import CssManager from "@/app/core/css/CssManager";
import SceneLayerComponent from "@/app/basic/map/SceneLayerComponent.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import AddressCalcMixin from "@/app/basic/common/mixin/AddressCalcMixin.vue";

@Component({ components: { SceneLayerComponent, MapBoard } })
export default class GameTable extends AddressCalcMixin {
  private sceneList = GameObjectManager.instance.sceneList;
  private sceneKey: string | null = null;
  private sceneInfo: SceneStore | null = null;

  private roomData = GameObjectManager.instance.roomData;
  @TaskProcessor("room-data-update-finished")
  private async roomDataUpdateFinished(
    task: Task<RoomDataStore, never>
  ): Promise<TaskResult<never> | void> {
    this.roomData = task.value!;
  }

  @Watch("roomData", { immediate: true, deep: true })
  private onChangeRoomData() {
    const sceneKey = this.roomData.sceneKey || null;
    if (GameObjectManager.instance.isSceneEditing) {
      GameObjectManager.instance.sceneEditingUpdateSceneKey = sceneKey;
    } else {
      this.sceneKey = sceneKey;
    }
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

  @Watch("sceneKey")
  private async onChangeSceneKey() {
    await this.updateScreen();
  }

  @Watch("isMounted")
  @Watch("sceneList", { deep: true })
  private async updateScreen() {
    if (!this.isMounted) return;
    const sceneData = findByKey(this.sceneList, this.sceneKey);
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
    setTimeout(async () => {
      await this.setCss(this.sceneInfo);
    });
  }

  private async setCss(scene: SceneStore | null) {
    if (!this.isMounted || !scene) return;
    const margin = scene.margin;
    const background = scene.background;
    GameTable.setBackground(GameTable.mapCanvasBackElm, scene.texture);
    GameTable.setBackground(GameTable.backSceneElm, background.texture);
    GameTable.setBackground(GameTable.tableBackElm, margin.texture);
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

  private static setBackground(elm: HTMLElement, texture: Texture) {
    const style = getTextureStyle(texture);
    elm.style.transform = style.transform;
    elm.style.backgroundColor = style.backgroundColor;
    elm.style.backgroundImage = style.backgroundImage;
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
    console.log("ちゃんと拾えた");

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
    this.pointDiff = createPoint(0, 0);
    TaskManager.instance.setTaskParam<MouseMoveParam>("mouse-moving-finished", {
      key: this.key,
      type: `button-left`
    });
    TaskManager.instance.setTaskParam<MouseMoveParam>(
      "mouse-move-end-left-finished",
      {
        key: this.key,
        type: `left-click`
      }
    );
  }

  /**
   * マウス右ボタン押下
   */
  @VueEvent
  private rightDown(event: MouseEvent | TouchEvent): void {
    if (this.roomData.settings.mapRotatable) {
      const mouse = getEventPoint(event);
      const calcResult = this.calcCoordinate(mouse, this.currentAngle);
      this.dragFrom = mouse;
      this.rotateFrom = calcResult.angle;
      this.pointDiff = createPoint(0, 0);
      TaskManager.instance.setTaskParam<MouseMoveParam>(
        "mouse-moving-finished",
        {
          key: this.key,
          type: "button-right"
        }
      );
    }
    TaskManager.instance.setTaskParam<MouseMoveParam>(
      "mouse-move-end-right-finished",
      {
        key: this.key,
        type: "right-click"
      }
    );
  }

  private dragFrom: Point = createPoint(0, 0);

  private pointDiff: Point = createPoint(0, 0);
  private point: Point = createPoint(0, 0);

  private rotateFrom: number = 0;
  private rotateDiff: number = 0;
  private rotate: number = 0;
  private isProcessingMove = false;

  @TaskProcessor("mouse-moving-finished")
  private async mouseMoveFinished(
    task: Task<Point, never>,
    param: MouseMoveParam
  ): Promise<TaskResult<never> | void> {
    if (!param || param.key !== this.key) return;
    if (this.isProcessingMove) return;
    this.isProcessingMove = true;
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
    if (button === "right" && this.roomData.settings.mapRotatable) {
      this.rotateDiff = arrangeAngle(calcResult.angle - this.rotateFrom);
    }
    this.isProcessingMove = false;

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

  @TaskProcessor("drop-piece-finished")
  private async dropPieceFinished(
    task: Task<DropPieceInfo, never>
  ): Promise<TaskResult<never> | void> {
    const type = task.value!.type;
    const dropWindow = task.value!.dropWindow;
    const offsetX = task.value!.offsetX;
    const offsetY = task.value!.offsetY;
    const pageX = task.value!.pageX;
    const pageY = task.value!.pageY;
    const canvasAddress = this.calcCanvasAddress(
      pageX,
      pageY,
      this.currentAngle,
      offsetX,
      offsetY
    );
    const locateOnCanvas = canvasAddress.locateOnCanvas;

    const isFitGrid = this.roomData.settings.isFitGrid;
    const gridSize = CssManager.instance.propMap.gridSize;
    const matrix: Matrix = {
      column: Math.floor(locateOnCanvas.x / gridSize),
      row: Math.floor(locateOnCanvas.y / gridSize)
    };
    if (isFitGrid) {
      locateOnCanvas.x = matrix.column * gridSize;
      locateOnCanvas.y = matrix.row * gridSize;
    }

    if (
      ["map-mask", "dice-symbol", "chit", "character", "map-marker"].findIndex(
        t => t === type
      ) > -1
    ) {
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
  text-align: center;
  vertical-align: middle;
  cursor: crosshair;
  z-index: -1;
  perspective: 1000px;
  overflow: visible;
  border-style: var(--margin-border-style);
  border-color: var(--margin-border-color);
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
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
  position: absolute;
  left: 0;
  top: 0;
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
