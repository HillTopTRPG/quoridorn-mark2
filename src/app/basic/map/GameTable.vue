<template>
  <div id="gameTableContainer">
    <div
      :style="gameTableStyle"
      @dragover.prevent
      @drop.prevent="drop"
      dropzone="move"
      id="gameTable"
      @keydown.enter.stop="globalEnter"
      @keyup.enter.stop
      @keydown.229.stop
      @keyup.229.stop
    >
      <div :style="gridPaperStyle"></div>

      <div
        id="mapBoardFrame"
        @contextmenu.prevent
        @mousedown.left="leftDown"
        @mousedown.right="rightDown"
        @touchstart="leftDown"
      >
        <map-board />
      </div>

      <!--
      <label>
        <base-input type="button" value="ccc" @click.left="clickButton3" />
      </label>
      -->

      <map-mask
        v-for="obj in getMapObjectList({ kind: 'mapMask', place: 'field' })"
        :key="obj.key"
        :objKey="obj.key"
        type="mapMask"
      />

      <character
        v-for="obj in getMapObjectList({ kind: 'character', place: 'field' })"
        :key="obj.key"
        :objKey="obj.key"
        type="character"
      />

      <chit
        v-for="obj in getMapObjectList({ kind: 'chit', place: 'field' })"
        :key="obj.key"
        :objKey="obj.key"
        type="chit"
      />

      <floor-tile
        v-for="obj in getMapObjectList({ kind: 'floorTile', place: 'field' })"
        :key="obj.key"
        :objKey="obj.key"
        type="floorTile"
      />

      <dice-symbol
        v-for="obj in getMapObjectList({ kind: 'diceSymbol' })"
        :key="obj.key"
        :objKey="obj.key"
        type="diceSymbol"
      />
    </div>
  </div>
</template>

<script lang="ts">
import MapBoard from "./MapBoard.vue";
import AddressCalcMixin from "@/app/basic/common/mixin/AddressCalcMixin.vue";

import MapMask from "@/app/basic/map-object/map-mask/MapMask.vue";
import Character from "@/app/basic/map-object/character/Character.vue";
import Chit from "@/app/basic/map-object/chit/Chit.vue";
import DiceSymbol from "@/app/basic/map-object/dice-symbol/DiceSymbol.vue";
import FloorTile from "@/app/basic/map-object/floor-tile/FloorTile.vue";
import BaseInput from "@/app/basic/common/components/BaseInput.vue";

import { parseColor } from "@/app/core/Utility";
import { Component } from "vue-mixin-decorator";
import { Getter, Mutation } from "vuex-class";
import { Watch } from "vue-property-decorator";
import {
  arrangeAngle,
  createPoint,
  getEventPoint,
  ps
} from "@/app/core/Coordinate";
import { Point } from "@/@types/address";
import { Task } from "@/@types/task";
import TaskManager, { MouseMoveParam } from "@/app/core/task/TaskManager";
import Logging from "@/app/core/logger/Logging";
import { ContextTaskInfo } from "@/@types/context";
import TaskProcessor, {
  TaskProcessorSimple
} from "@/app/core/task/TaskProcessor";

@Component({
  components: {
    MapBoard,
    FloorTile,
    DiceSymbol,
    MapMask,
    Character,
    Chit,
    BaseInput
  }
})
export default class GameTable extends AddressCalcMixin {
  // @Action("addListObj") private addListObj: any;
  // @Action("windowOpen") private windowOpen: any;
  // @Action("setProperty") private setProperty: any;
  // @Action("windowClose") private windowClose: any;
  // @Action("importStart") private importStart: any;
  @Mutation("setIsWheeling") private setIsWheeling: any;
  // @Getter("isFitGrid") private isFitGrid: any;
  @Getter("getBackgroundImage") private getBackgroundImage!: string | null;
  @Getter("mapMarginGridColor") private mapMarginGridColor!: string;
  @Getter("mapMarginMaskColor") private mapMarginMaskColor!: string;
  @Getter("mapMarginMaskAlpha") private mapMarginMaskAlpha!: number;
  @Getter("isMapUseGridColor") private isMapUseGridColor!: boolean;
  @Getter("isMapUseImage") private isMapUseImage!: boolean;
  // @Getter("playerKey") private playerKey: any;
  @Getter("isModal") private isModal!: boolean;
  @Getter("getMapObjectList") private getMapObjectList!: any;
  // @Getter("propertyList") private propertyList: any;
  // @Getter("getObj") private getObj: any;

  private wheelTimer: number | null = null;
  private wheel: number = 0;

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
    task: Task<boolean>
  ): Promise<string | void> {
    this.wheel += 100 * (task!.value || false ? 1 : -1);

    this.setIsWheeling(true);
    if (this.wheelTimer !== null) {
      window.clearTimeout(this.wheelTimer);
    }
    this.wheelTimer = window.setTimeout(() => {
      this.setIsWheeling(false);
      this.wheelTimer = null;
    }, 600);

    // 登録したタスクに完了通知
    if (task.resolve) task.resolve(task);
  }

  @TaskProcessorSimple
  @Logging
  private async item01EmitFinished(task: Task<number>): Promise<string | void> {
    window.console.log("ちゃんと拾えた");

    // 登録したタスクに完了通知
    if (task.resolve) task.resolve(task);
  }

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
  private leftDown(event: MouseEvent | TouchEvent): void {
    this.dragFrom = getEventPoint(event);
    this.mouseDown("left");
  }

  /**
   * マウス右ボタン押下
   */
  private rightDown(event: MouseEvent | TouchEvent): void {
    const mouse = getEventPoint(event);
    const calcResult = this.calcCoordinate(mouse, this.currentAngle);
    this.dragFrom = mouse;
    this.rotateFrom = calcResult.angle;
    this.mouseDown("right");
  }

  private mouseDown(button: string) {
    this.pointDiff.x = 0;
    this.pointDiff.y = 0;
    TaskManager.instance.setTaskParam<MouseMoveParam>("mouse-moving-finished", {
      key: "game-table",
      type: `button-${button}`
    });
    TaskManager.instance.setTaskParam<MouseMoveParam>(
      button === "right"
        ? "mouse-move-end-right-finished"
        : `mouse-move-end-left-finished`,
      {
        key: "game-table",
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
    task: Task<Point>,
    param: MouseMoveParam
  ): Promise<string | void> {
    if (param.key !== "game-table") return;
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
        key: "game-table",
        type
      }
    );

    if (button === "left") {
      const zoom = (1000 - this.wheel) / 1000;
      this.pointDiff.x = (point.x - this.dragFrom.x) * zoom;
      this.pointDiff.y = (point.y - this.dragFrom.y) * zoom;
    }
    if (button === "right") {
      this.rotateDiff = arrangeAngle(calcResult.angle - this.rotateFrom);
    }

    // 登録したタスクに完了通知
    if (task.resolve) task.resolve(task);
  }

  private get currentAngle(): number {
    return arrangeAngle(this.rotate + this.rotateDiff);
  }

  @TaskProcessor("mouse-move-end-left-finished")
  private async mouseLeftUpFinished(task: Task<Point>): Promise<string | void> {
    this.point.x += this.pointDiff.x;
    this.point.y += this.pointDiff.y;
    this.pointDiff.x = 0;
    this.pointDiff.y = 0;

    TaskManager.instance.setTaskParam("mouse-moving-finished", null);
    TaskManager.instance.setTaskParam("mouse-move-end-left-finished", null);

    // 登録したタスクに完了通知
    if (task.resolve) task.resolve(task);
  }

  @TaskProcessor("mouse-move-end-right-finished")
  private async mouseRightUpFinished(
    task: Task<Point>,
    param: MouseMoveParam
  ): Promise<string | void> {
    const point: Point = task.value!;

    const eventType = param ? param.type!.split("-")[1] : "";
    if (eventType === "click") {
      // 右クリックメニュー表示
      setTimeout(async () => {
        await TaskManager.instance.ignition<ContextTaskInfo>({
          type: "context-open",
          owner: "Quoridorn",
          value: {
            type: "game-table",
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

    // 登録したタスクに完了通知
    if (task.resolve) task.resolve(task);
  }

  private get sizeW(this: any): number {
    return (this.mapColumns + this.mapMarginGridSize * 2) * this.mapGridSize;
  }

  private get sizeH(this: any): number {
    return (this.mapRows + this.mapMarginGridSize * 2) * this.mapGridSize;
  }

  private get gameTableStyle(): any {
    // const translateZ = this.mapWheel;
    const totalLeftX = this.point.x + this.pointDiff.x;
    const totalLeftY = this.point.y + this.pointDiff.y;
    let rotateZ = this.currentAngle;

    const transformList: string[] = [];
    transformList.push(`translateY(${totalLeftY}px)`);
    transformList.push(`translateX(${totalLeftX}px)`);
    transformList.push(`rotateY(0deg)`);
    transformList.push(`rotateX(0deg)`);
    transformList.push(`rotateZ(${rotateZ}deg)`);
    const result: any = {
      width: this.sizeW + "px",
      height: this.sizeH + "px",
      borderWidth: this.mapBorderWidth + "px",
      transform: transformList.join(" ")
    };
    if (this.isMapUseImage) {
      result.backgroundImage = `url(${this.getBackgroundImage})`;
    }
    if (this.isModal) {
      result.filter = "blur(3px)";
    }
    return result;
  }

  private get gridPaperStyle(): any {
    const maskColorObj = parseColor(this.mapMarginMaskColor);
    maskColorObj.a = this.mapMarginMaskAlpha;
    const marginMaskColorStr = maskColorObj.getRGBA();
    const result: any = {
      width: this.sizeW + "px",
      height: this.sizeH + "px",
      "background-color": marginMaskColorStr
    };
    if (this.isMapUseGridColor) {
      const colorObj = parseColor(this.mapMarginGridColor);
      colorObj.a = 0.3;
      const marginGridColor3 = colorObj.getRGBA();
      colorObj.a = 0.1;
      const marginGridColor1 = colorObj.getRGBA();
      result["background-image"] =
        `linear-gradient(0deg, transparent -2px,` +
        `${marginGridColor3} 2px, ${marginGridColor3} 3%, transparent 4%, transparent 20%,` +
        `${marginGridColor1} 21%, ${marginGridColor1} 22%, transparent 23%, transparent 40%,` +
        `${marginGridColor1} 41%, ${marginGridColor1} 42%, transparent 43%, transparent 60%,` +
        `${marginGridColor1} 61%, ${marginGridColor1} 62%, transparent 63%, transparent 80%,` +
        `${marginGridColor1} 81%, ${marginGridColor1} 82%, transparent 83%, transparent),` +
        `linear-gradient(270deg, transparent -2px,` +
        `${marginGridColor3} 2px, ${marginGridColor3} 3%, transparent 4%, transparent 20%,` +
        `${marginGridColor1} 21%, ${marginGridColor1} 22%, transparent 23%, transparent 40%,` +
        `${marginGridColor1} 41%, ${marginGridColor1} 42%, transparent 43%, transparent 60%,` +
        `${marginGridColor1} 61%, ${marginGridColor1} 62%, transparent 63%, transparent 80%,` +
        `${marginGridColor1} 81%, ${marginGridColor1} 82%, transparent 83%, transparent)`;
    }
    return result;
  }

  // private drop(this: any, event: any): void {
  //   // ドロップされた物の種類
  //   const kind = event.dataTransfer.getData("kind");
  //
  //   const offsetX = event.dataTransfer.getData("offsetX");
  //   const offsetY = event.dataTransfer.getData("offsetY");
  //
  //   const canvasAddress = this.calcCanvasAddress(
  //     event.pageX,
  //     event.pageY,
  //     this.currentAngle,
  //     this.wheel
  //     offsetX,
  //     offsetY
  //   );
  //   const locateOnTable = canvasAddress.locateOnTable;
  //   if (this.isFitGrid) {
  //     locateOnTable.x =
  //       (Math.ceil(locateOnTable.x / this.mapGridSize) - 1) * this.mapGridSize;
  //     locateOnTable.y =
  //       (Math.ceil(locateOnTable.y / this.mapGridSize) - 1) * this.mapGridSize;
  //   }
  //
  //   qLog(
  //     `  [methods] drop on GameTable => type: ${kind}, address: (${canvasAddress.grid.column},${canvasAddress.grid.row})`
  //   );
  //
  //   const pieceObj: any = {
  //     kind: kind,
  //     propName: kind,
  //     left: locateOnTable.x,
  //     top: locateOnTable.y,
  //     isNotice: true,
  //     owner: this.playerKey,
  //     place: "field",
  //     isDraggingLeft: false,
  //     move: {
  //       from: { x: 0, y: 0 },
  //       dragging: { x: 0, y: 0 },
  //       gridOffset: { x: 0, y: 0 }
  //     },
  //     angle: {
  //       total: 0,
  //       dragging: 0,
  //       dragStart: 0
  //     },
  //     isLock: false,
  //     order: 0,
  //     isBorderHide: false
  //   };
  //
  //   // マップマスクの作成
  //   if (kind === "mapMask") {
  //     const name = event.dataTransfer.getData("name");
  //     const color = event.dataTransfer.getData("color");
  //     const fontColor = event.dataTransfer.getData("fontColor");
  //     const columns = parseInt(event.dataTransfer.getData("columns"), 10);
  //     const rows = parseInt(event.dataTransfer.getData("rows"), 10);
  //     const isMulti = event.dataTransfer.getData("isMulti");
  //
  //     // 必須項目
  //     pieceObj.columns = columns;
  //     pieceObj.rows = rows;
  //     // 個別部
  //     pieceObj.name = name;
  //     pieceObj.color = color;
  //     pieceObj.fontColor = fontColor;
  //
  //     this.addListObj(pieceObj);
  //     if (isMulti === "false") {
  //       this.windowClose("private.display.addMapMaskWindow");
  //     }
  //     return;
  //   }
  //
  //   // キャラクターの作成
  //   if (kind === "character") {
  //     const name = event.dataTransfer.getData("name");
  //     const size = event.dataTransfer.getData("size");
  //     const useImageList = event.dataTransfer.getData("useImageList");
  //     const isHide = event.dataTransfer.getData("isHide") === "true";
  //     const url = event.dataTransfer.getData("urlStr");
  //     const text = [
  //       {
  //         kind: "text",
  //         text: event.dataTransfer.getData("description")
  //       }
  //     ];
  //     const useImageIndex = parseInt(
  //       event.dataTransfer.getData("useImageIndex"),
  //       10
  //     );
  //     const currentImageTag = event.dataTransfer.getData("currentImageTag");
  //
  //     // 必須項目
  //     pieceObj.columns = size;
  //     pieceObj.rows = size;
  //     // 個別部
  //     pieceObj.name = name;
  //     pieceObj.useImageList = useImageList;
  //     pieceObj.isHide = isHide;
  //     pieceObj.url = url;
  //     pieceObj.text = text;
  //     pieceObj.useImageIndex = useImageIndex;
  //     pieceObj.currentImageTag = currentImageTag;
  //     pieceObj.fontColorType = "0";
  //     pieceObj.fontColor = "#000";
  //     pieceObj.chatPalette = {
  //       list: []
  //     };
  //     pieceObj.statusList = [
  //       {
  //         name: "◆",
  //         standImage: {
  //           ref: "",
  //           base: "",
  //           baseTag: "imgTag-0",
  //           autoResize: false,
  //           animationLength: 0,
  //           locate: 1,
  //           diffList: [],
  //           isSystemLock: true
  //         }
  //       }
  //     ];
  //     pieceObj.viewHighlight = false;
  //     pieceObj.property = {
  //       initiative: 0,
  //       subInitiative: 0
  //     };
  //
  //     this.propertyList.forEach((prop: any, index: number) => {
  //       if (prop.type === "min") {
  //         const nextProp = this.propertyList[index + 1];
  //         pieceObj.property[prop.refStr] = 0;
  //       }
  //       if (prop.type === "number") {
  //         pieceObj.property[prop.refStr] = 0;
  //       }
  //       if (prop.type === "max") {
  //         pieceObj.property[prop.refStr] = 99;
  //       }
  //       if (prop.type === "checkbox") {
  //         pieceObj.property[prop.refStr] = false;
  //       }
  //     });
  //
  //     if (this.$store.state.private.display.addCharacterWindow.isContinuous) {
  //       const splits = name.split("_");
  //       const continuousNum = parseInt(splits[splits.length - 1], 10);
  //       this.setProperty({
  //         property: "private.display.addCharacterWindow.continuousNum",
  //         value: continuousNum + 1,
  //         logOff: true
  //       });
  //     } else {
  //       this.windowClose("private.display.addCharacterWindow");
  //       this.setProperty({
  //         property: "private.display.addCharacterWindow.continuousNum",
  //         value: 1,
  //         logOff: true
  //       });
  //     }
  //
  //     this.addListObj(pieceObj);
  //     return;
  //   }
  //
  //   // フロアタイルの作成
  //   if (kind === "floorTile") {
  //     const currentImageTag = event.dataTransfer.getData("currentImageTag");
  //     const imageKey = event.dataTransfer.getData("imageKey");
  //     const isReverse = event.dataTransfer.getData("isReverse");
  //     const columns = event.dataTransfer.getData("columns");
  //     const rows = event.dataTransfer.getData("rows");
  //     const description = event.dataTransfer.getData("description");
  //     const isMulti = event.dataTransfer.getData("isMulti");
  //
  //     // 必須項目
  //     pieceObj.columns = columns;
  //     pieceObj.rows = rows;
  //     // 個別部
  //     pieceObj.currentImageTag = currentImageTag;
  //     pieceObj.imageKey = imageKey;
  //     pieceObj.isReverse = isReverse === "true";
  //     pieceObj.description = description;
  //
  //     this.addListObj(pieceObj);
  //
  //     window.console.log(isMulti);
  //     if (isMulti === "false") {
  //       this.windowClose("private.display.addFloorTileWindow");
  //     }
  //     return;
  //   }
  //
  //   // チットの作成
  //   if (kind === "chit") {
  //     const currentImageTag = event.dataTransfer.getData("currentImageTag");
  //     const imageKey = event.dataTransfer.getData("imageKey");
  //     const isReverse = event.dataTransfer.getData("isReverse");
  //     const columns = event.dataTransfer.getData("columns");
  //     const rows = event.dataTransfer.getData("rows");
  //     const description = event.dataTransfer.getData("description");
  //     const isMulti = event.dataTransfer.getData("isMulti");
  //
  //     // 必須項目
  //     pieceObj.columns = columns;
  //     pieceObj.rows = rows;
  //     // 個別部
  //     pieceObj.currentImageTag = currentImageTag;
  //     pieceObj.imageKey = imageKey;
  //     pieceObj.isReverse = isReverse === "true";
  //     pieceObj.description = description;
  //
  //     this.addListObj(pieceObj);
  //
  //     window.console.log(isMulti);
  //     if (isMulti === "false") {
  //       this.windowClose("private.display.addMapMaskWindow");
  //     }
  //     return;
  //   }
  //
  //   // ダイスシンボルの作成
  //   if (kind === "diceSymbol") {
  //     const faceNum = event.dataTransfer.getData("faceNum");
  //     const type = event.dataTransfer.getData("type");
  //     const label = event.dataTransfer.getData("label");
  //     const pips = event.dataTransfer.getData("pips");
  //     const isHide = event.dataTransfer.getData("isHide");
  //
  //     // 必須項目
  //     pieceObj.columns = 1;
  //     pieceObj.rows = 1;
  //     // 個別部
  //     pieceObj.faceNum = parseInt(faceNum, 10);
  //     pieceObj.type = type;
  //     pieceObj.label = label;
  //     pieceObj.pips = parseInt(pips, 10);
  //     pieceObj.isHide = isHide === "true";
  //
  //     this.addListObj(pieceObj);
  //     return;
  //   }
  //
  //   // ファイルがドロップされてる
  //   const files = event.dataTransfer.files;
  //
  //   // ファイルの種類に応じて振り分け
  //   const imageFiles: any[] = [];
  //   const zipFiles: any[] = [];
  //   for (const file of files) {
  //     window.console.log(file.type);
  //     if (file.type.indexOf("image/") === 0) {
  //       // 画像
  //       imageFiles.push(file);
  //     } else if (file.type.indexOf("zip") >= 0) {
  //       // zip
  //       zipFiles.push(file);
  //     }
  //   }
  //
  //   // 画像ファイルの処理
  //   if (imageFiles.length > 0) {
  //     // どこに使う画像ファイルなのかを選んでもらう
  //     const _: any = this;
  //     fileToBase64(imageFiles).then((values: any[]) => {
  //       values.forEach((valueObj: any, index: number) => {
  //         valueObj.key = index;
  //       });
  //       _.setProperty({
  //         property: "private.display.dropImageWindow.imageDataList",
  //         value: values
  //       });
  //     });
  //     this.windowOpen("private.display.dropImageWindow");
  //   }
  //
  //   // zipファイルの処理
  //   if (zipFiles.length > 0) {
  //     this.importStart({ zipFiles: zipFiles, isRoomCreate: false });
  //   }
  // }
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
  z-index: 8;
}

#gameTable {
  position: fixed;
  display: block;
  margin: auto;
  text-align: center;
  vertical-align: middle;
  background-position: 0 0;
  background-size: 100% 100%;
  cursor: crosshair;
  z-index: -1;
  perspective: 1000px;
  border: ridge gray;
  overflow: visible;

  &:before {
    content: "";
    background: inherit; /*.bgImageで設定した背景画像を継承する*/
    -webkit-filter: blur(10px);
    -ms-filter: blur(10px);
    filter: blur(10px);
    position: absolute;
    /*ブラー効果で画像の端がボヤけた分だけ位置を調整*/
    top: -10px;
    left: -10px;
    right: -10px;
    bottom: -10px;
    z-index: -1; /*重なり順序を一番下にしておく*/
  }

  > div {
    background-position: 1px 1px;
    background-size: 48px 48px;
  }
}

#mapBoardFrame {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  border: none;
  text-align: center;
  vertical-align: middle;
}
</style>
