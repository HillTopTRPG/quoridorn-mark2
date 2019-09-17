<template>
  <div id="gameTableContainer" :style="mapBoardFrameStyle">
    <div
      :style="gameTableStyle"
      @contextmenu.prevent.stop
      @dragover.prevent
      @drop.prevent="drop"
      dropzone="move"
      id="gameTable"
      @keydown.enter.stop="globalEnter"
      @keyup.enter.stop
      @keydown.229.stop
      @keyup.229.stop
    >
      <div :style="gridPaperStyle" @contextmenu.prevent></div>

      <div
        id="mapBoardFrame"
        @contextmenu.prevent.stop
        @mousedown.left.stop="leftDown"
        @mousedown.right.stop="rightDown"
        @mouseup.left.stop="leftUp"
        @mouseup.right.stop="rightUp"
        @touchcancel.stop="leftUp"
        @touchend.stop="leftUp"
        @touchstart.stop="leftDown"
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
        @drag="dragging"
        @leftDown="leftDown"
        @leftUp="leftUp"
        @rightDown="rightDown"
        @rightUp="rightUp"
        type="mapMask"
      />

      <character
        v-for="obj in getMapObjectList({ kind: 'character', place: 'field' })"
        :key="obj.key"
        :objKey="obj.key"
        @drag="dragging"
        @leftDown="leftDown"
        @leftUp="leftUp"
        @rightDown="rightDown"
        @rightUp="rightUp"
        type="character"
      />

      <chit
        v-for="obj in getMapObjectList({ kind: 'chit', place: 'field' })"
        :key="obj.key"
        :objKey="obj.key"
        @drag="dragging"
        @leftDown="leftDown"
        @leftUp="leftUp"
        @rightDown="rightDown"
        @rightUp="rightUp"
        type="chit"
      />

      <floor-tile
        v-for="obj in getMapObjectList({ kind: 'floorTile', place: 'field' })"
        :key="obj.key"
        :objKey="obj.key"
        @drag="dragging"
        @leftDown="leftDown"
        @leftUp="leftUp"
        @rightDown="rightDown"
        @rightUp="rightUp"
        type="floorTile"
      />

      <dice-symbol
        v-for="obj in getMapObjectList({ kind: 'diceSymbol' })"
        :key="obj.key"
        :objKey="obj.key"
        @drag="dragging"
        @leftDown="leftDown"
        @leftUp="leftUp"
        @rightDown="rightDown"
        @rightUp="rightUp"
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

import { qLog, fileToBase64, parseColor } from "@/app/core/Utility";
import { Component, Mixins } from "vue-mixin-decorator";
import { Action, Getter, Mutation } from "vuex-class";
import { Watch } from "vue-property-decorator";
import { Task } from "@/app/store/EventQueue";
import { arrangeAngle } from "@/app/core/Coordinate";

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
  @Mutation("setMapAngle") private setMapAngle: any;
  @Mutation("setMouseLocate") private setMouseLocate: any;
  @Mutation("setMapAngleDragging") private setMapAngleDragging: any;
  @Mutation("setMapAngleDragStart") private setMapAngleDragStart: any;
  @Mutation("setIsMapDraggingLeft") private setIsMapDraggingLeft: any;
  @Mutation("setIsMapDraggingRight") private setIsMapDraggingRight: any;
  @Mutation("setMapWheel") private setMapWheel: any;
  @Mutation("setMapMoveFromLocate") private setMapMoveFromLocate: any;
  @Mutation("setMapMoveTotalLocate") private setMapMoveTotalLocate: any;
  @Mutation("setMapMoveDraggingLocate") private setMapMoveDraggingLocate: any;
  @Mutation("setIsMapRolling") private setIsMapRolling: any;
  @Mutation("setMapRollObj") private setMapRollObj: any;
  @Mutation("setIsMapMoving") private setIsMapMoving: any;
  @Mutation("setMapMoveObj") private setMapMoveObj: any;
  @Mutation("setIsMapMouseDownRight") private setIsMapMouseDownRight: any;
  @Mutation("setIsMapOverEvent") private setIsMapOverEvent: any;
  @Mutation("setMouseOnScreenLocate") private setMouseOnScreenLocate: any;
  @Mutation("setMouseOnCanvasLocate") private setMouseOnCanvasLocate: any;
  @Mutation("setMouseOnTableLocate") private setMouseOnTableLocate: any;
  @Mutation("setMouseLocateSet") private setMouseLocateSet: any;
  @Mutation("setMapGrid") private setMapGrid: any;
  @Mutation("setIsWheeling") private setIsWheeling: any;
  @Mutation("addTaskListener") private addTaskListener: any;
  @Mutation("removeTaskListener") private removeTaskListener: any;
  // @Getter("isFitGrid") private isFitGrid: any;
  @Getter("isMapWheeling") private isMapWheeling!: boolean;
  @Getter("getBackgroundImage") private getBackgroundImage!: string | null;
  @Getter("mapMarginGridColor") private mapMarginGridColor!: string;
  @Getter("mapMarginMaskColor") private mapMarginMaskColor!: string;
  @Getter("mapMarginMaskAlpha") private mapMarginMaskAlpha!: number;
  @Getter("isMapUseGridColor") private isMapUseGridColor!: boolean;
  @Getter("isMapUseImage") private isMapUseImage!: boolean;
  // @Getter("playerKey") private playerKey: any;
  @Getter("mapAngle") private mapAngle!: number;
  @Getter("isMapRolling") private isMapRolling!: boolean;
  @Getter("mapRollObj") private mapRollObj!: string;
  @Getter("isMapMoving") private isMapMoving!: boolean;
  @Getter("mapMoveObj") private mapMoveObj!: string;
  @Getter("isMapMouseDownRight") private isMapMouseDownRight!: boolean;
  @Getter("isMapDraggingLeft") private isMapDraggingLeft!: boolean;
  @Getter("isMapDraggingRight") private isMapDraggingRight!: boolean;
  @Getter("isMapOverEvent") private isMapOverEvent!: boolean;
  @Getter("mapMoveFromLocate") private mapMoveFromLocate!: Point;
  @Getter("mapMoveTotalLocate") private mapMoveTotalLocate!: Point;
  @Getter("mapMoveDraggingLocate")
  private mapMoveDraggingLocate!: Point;
  @Getter("mapAngleVolatile") private mapAngleVolatile!: any;
  @Getter("isModal") private isModal!: boolean;
  @Getter("getMapObjectList") private getMapObjectList!: any;
  // @Getter("propertyList") private propertyList: any;
  // @Getter("getObj") private getObj: any;
  @Getter("mouseLocate") private mouseLocate!: Point;
  @Getter("mouseOnScreenLocate") private mouseOnScreenLocate!: Point;

  private wheelTimer: number | null = null;

  private mounted(): void {
    document.addEventListener("mousemove", this.mouseMove);
    document.addEventListener("touchmove", this.touchMove);

    this.addTaskListener({
      type: "action-wheel-finished",
      processor: async (task: Task<number>): Promise<string | void> => {
        const changeValue = 100;
        const value: number = task!.value as number;
        const add = value > 0 ? changeValue : -changeValue;
        const mapWheel = this.mapWheel + add;
        if (mapWheel < -2400 || mapWheel > 800) return;
        this.setMapWheel(mapWheel);

        this.setIsWheeling(true);
        if (this.wheelTimer !== null) {
          window.clearTimeout(this.wheelTimer);
        }
        this.wheelTimer = window.setTimeout(() => {
          this.setIsWheeling(false);
          this.wheelTimer = null;
        }, 600);
      }
    });
  }

  private beforeDestroy() {
    window.console.log("beforeDestroy");
    this.removeTaskListener("action-wheel-finished");
  }

  private globalEnter() {
    // this.setProperty({
    //   property: "private.display.chatWindow.command",
    //   logOff: true,
    //   isNotice: false,
    //   value: { command: "globalEnter", payload: {} }
    // });
  }

  private clickButton3() {
    window.console.log("clickButton3", this.isMapWheeling);
    this.setIsWheeling(!this.isMapWheeling);
  }

  private dragging(): void {
    window.console.log(`★★★★ dragging ★★★★`);
  }

  public onWheel(this: any, delta: number): void {
    const changeValue = 100;
    const add = delta > 0 ? changeValue : -changeValue;
    const mapWheel = this.mapWheel + add;
    if (mapWheel < -2400 || mapWheel > 800) {
      return;
    }
    this.setMapWheel(mapWheel);
  }

  private leftDown(this: any): void {
    this.setMapMoveFromLocate(this.mouseLocate);
    this.setIsMapDraggingLeft(true);
  }

  private leftUp(event: any): void {
    const dispatchMouseUpEvent = (elm: HTMLElement) => {
      const evt = document.createEvent("MouseEvents");
      evt.initMouseEvent(
        "mouseup",
        true,
        true,
        window,
        1,
        event ? event.screenX : 0,
        event ? event.screenY : 0,
        event ? event.clientX : 0,
        event ? event.clientY : 0,
        event ? event.ctrlKey : false,
        event ? event.altKey : false,
        event ? event.shiftKey : false,
        event ? event.metaKey : false,
        event ? event.buttons : 0,
        elm
      );
      elm!.dispatchEvent(evt);
    };

    if (this.isMapRolling) {
      // マップ上のオブジェクトを回転中の場合
      this.setIsMapRolling(false);

      const targetCharacterElm: HTMLElement = document.getElementById(
        this.mapRollObj
      ) as HTMLElement;

      (Array.from(
        targetCharacterElm.getElementsByClassName("roll-knob")
      ) as HTMLElement[]).forEach((elm: HTMLElement) =>
        dispatchMouseUpEvent(elm)
      );
      return;
    }

    if (this.isMapMoving) {
      // マップ場のオブジェクトを移動中の場合
      this.setIsMapMoving(false);

      const targetObjElm: HTMLElement = document.getElementById(
        this.mapMoveObj
      ) as HTMLElement;

      if (/\./.test(this.mapMoveObj)) {
        // WindowFrameの場合
        (Array.from(
          targetObjElm.getElementsByClassName("window-title")
        ) as HTMLElement[]).forEach((elm: HTMLElement) =>
          dispatchMouseUpEvent(elm)
        );
      } else {
        // マップオブジェクトの場合
        dispatchMouseUpEvent(targetObjElm);
      }

      return;
    }

    // マップを動かしている場合
    const zoom = (1000 - this.mapWheel) / 1000;
    const total: Point = {
      x: this.mapMoveTotalLocate.x + this.mapMoveDraggingLocate.x * zoom,
      y: this.mapMoveTotalLocate.y + this.mapMoveDraggingLocate.y * zoom
    };
    this.setMapMoveTotalLocate(total);
    this.setMapMoveDraggingLocate({
      x: 0,
      y: 0
    });
    this.setIsMapDraggingLeft(false);
  }

  private rightDown(this: any): void {
    const dragStart = this.calcCoordinate(
      this.mouseLocate.x,
      this.mouseLocate.y,
      this.currentAngle
    ).angle;
    this.setMapAngleDragStart(dragStart);
    this.setIsMapMouseDownRight(true);
  }

  private rightUp(event: any): void {
    this.setIsMapMouseDownRight(false);

    let isRoll = false;
    if (this.isMapDraggingRight) {
      const nextAngle = arrangeAngle(
        this.mapAngle + Math.round(this.mapAngleVolatile.dragging / 15) * 15
      );
      if (this.mapAngle !== nextAngle) isRoll = true;
      this.setMapAngleDragging(0);
      this.setIsMapDraggingRight(false);
      this.setMapAngle(nextAngle);
    }
    let pageX = event.pageX;
    let pageY = event.pageY;

    if (!this.isMapOverEvent) {
      if (!isRoll) {
        // 右ドラッグが解除されたのが子画面上でなく、調整後に回転していない場合のみ右コンテキストメニューを表示する
        const obj = {
          x: pageX,
          y: pageY
        };
        // this.setProperty({
        //   property: `private.display.gameTableContext`,
        //   value: obj,
        //   logOff: true
        // });
        // setTimeout(() => {
        //   this.windowOpen(`private.display.gameTableContext`);
        // });
        // qLog(`  [methods] open context => gameTableContext`);
      }
    } else {
      this.setIsMapOverEvent(false);
    }
  }

  private mouseMove(event: any): void {
    this.setMouseLocateOnPage(event.pageX, event.pageY);
  }

  private touchMove(event: any): void {
    this.setMouseLocateOnPage(
      event.changedTouches[0].pageX,
      event.changedTouches[0].pageY
    );
  }

  private setMouseLocateOnPage(pageX: number, pageY: number): void {
    // プレーンなモニター上の座標を記録
    this.setMouseLocate({
      x: pageX,
      y: pageY
    });

    // 拡大縮小を考慮して、元の大きさのときの座標を記録
    this.setMouseLocateSet(
      this.calcCanvasAddress(pageX, pageY, this.currentAngle)
    );

    // 右ドラッグを検知
    if (this.isMapMouseDownRight && !this.isMapDraggingRight) {
      this.setIsMapDraggingRight(true);
    }
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

  private get currentAngle(): number {
    return arrangeAngle(this.mapAngle + this.mapAngleVolatile.dragging);
  }

  private get sizeW(this: any): number {
    return (this.mapColumns + this.mapMarginGridSize * 2) * this.mapGridSize;
  }

  private get sizeH(this: any): number {
    return (this.mapRows + this.mapMarginGridSize * 2) * this.mapGridSize;
  }

  private get mapBoardFrameStyle() {
    const translateZ = this.mapWheel;
    const transformList: string[] = [];
    transformList.push(`translateZ(${translateZ}px)`);
    transformList.push(`rotateY(0deg)`);
    transformList.push(`rotateX(0deg)`);
    const result: any = {
      transform: transformList.join(" ")
    };
    return result;
  }

  private get gameTableStyle(this: any): any {
    // const translateZ = this.mapWheel;
    const zoom = (1000 - this.mapWheel) / 1000;
    const totalLeftX =
      this.mapMoveTotalLocate.x + this.mapMoveDraggingLocate.x * zoom;
    const totalLeftY =
      this.mapMoveTotalLocate.y + this.mapMoveDraggingLocate.y * zoom;
    let rotateZ = this.currentAngle;

    const transformList: string[] = [];
    // transformList.push(`translateZ(${translateZ}px)`);
    transformList.push(`translateY(${totalLeftY}px)`);
    transformList.push(`translateX(${totalLeftX}px)`);
    transformList.push(`rotateY(0deg)`);
    transformList.push(`rotateX(0deg)`);
    transformList.push(`rotateZ(${rotateZ}deg)`);
    const result: any = {
      // transformOrigin: `${this.mouseLocate.y}px ${this.mouseLocate.x}px`,
      // transformOrigin: `top left`,
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

  @Watch("mouseLocate", { deep: true })
  private onChangeMouseLocate(mouseLocate: any) {
    if (this.isMapDraggingLeft) {
      this.setMapMoveDraggingLocate({
        x: mouseLocate.x - this.mapMoveFromLocate.x,
        y: mouseLocate.y - this.mapMoveFromLocate.y
      });
    }
    if (this.isMapDraggingRight) {
      const angle = this.calcCoordinate(
        mouseLocate.x,
        mouseLocate.y,
        this.currentAngle
      ).angle;
      let angleDiff = arrangeAngle(angle - this.mapAngleVolatile.dragStart);
      this.setMapAngleDragging(angleDiff);
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
