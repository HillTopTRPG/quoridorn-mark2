<script lang="ts">
import Vue from "vue";
import { Mixin } from "vue-mixin-decorator";
import { Getter } from "vuex-class";

@Mixin
export default class AddressCalcMixin extends Vue {
  @Getter("mapColumns") protected mapColumns: any;
  @Getter("mapRows") protected mapRows: any;
  @Getter("mapGridSize") protected mapGridSize: any;
  @Getter("mapBorderWidth") protected mapBorderWidth: any;
  @Getter("mapMarginGridSize") protected mapMarginGridSize: any;
  @Getter("mapWheel") protected mapWheel: any;

  public arrangeAngle(angle: number): number {
    if (angle > 180) angle -= 360;
    if (angle < -180) angle += 360;
    return angle;
  }

  /**
   * 指定されたスクリーン座標を元に、座標計算を行う
   * @param screenX
   * @param screenY
   * @param oldAngle
   * @returns {{angle: number, planeLocateScreen: {x: *, y: *}, planeLocateCanvas: {x: *, y: *}, planeLocateTable: {x: *, y: *}}}
   */
  calcCoordinate(screenX: number, screenY: number, oldAngle: number): any {
    // スクロール倍率を考慮
    const zoom = (1000 - this.mapWheel) / 1000.0;
    // canvas上のマス座標を計算する
    const cr: any = document
      .getElementById("map-canvas")!
      .getBoundingClientRect();
    // canvasの中心点
    const center = {
      x: cr.x + cr.width / 2,
      y: cr.y + cr.height / 2
    };
    // 中心座標を基準としたマウス座標
    const loc: LocationPoint = {
      x: screenX - center.x,
      y: screenY - center.y
    };
    // 中心点と指定された座標とを結ぶ線の角度を求める
    const angle = (Math.atan2(loc.y, loc.x) * 180) / Math.PI;
    // 中心点と指定された座標とを結ぶ線の長さを求める
    const distance = Math.sqrt(Math.pow(loc.x, 2) + Math.pow(loc.y, 2)) * zoom;
    // マップ回転前の角度を求める
    const angleBeforeAround = this.arrangeAngle(angle - oldAngle);
    const planeLocateScreen = {
      x: center.x + distance * Math.cos((angleBeforeAround * Math.PI) / 180),
      y: center.y + distance * Math.sin((angleBeforeAround * Math.PI) / 180)
    };
    const planeLocateCenter = {
      x: planeLocateScreen.x - center.x,
      y: planeLocateScreen.y - center.y
    };
    const planeLocateCanvas = {
      x: planeLocateCenter.x + (this.mapColumns / 2) * this.mapGridSize,
      y: planeLocateCenter.y + (this.mapRows / 2) * this.mapGridSize
    };
    const planeLocateTable = {
      x: planeLocateCanvas.x + this.mapMarginGridSize * this.mapGridSize,
      y: planeLocateCanvas.y + this.mapMarginGridSize * this.mapGridSize
    };
    /*
      const f = Math.floor
      const planeLocateFromCenter = { x: planeLocate.x - center.x, y: planeLocate.y - center.y }
      const planeCanvas = { x: center.x - this.mapColumns / 2 * this.mapGridSize, y: center.y - this.rows / 2 * this.mapGridSize }
      const canvas = { x: center.x - this.mapColumns / 2 * this.mapGridSize / zoom, y: center.y - this.rows / 2 * this.mapGridSize / zoom }
      window.console.log(
        `zm:${zoom} ` +
        `canvas(${f(canvas.x)}, ${f(canvas.y)}) ` +
        `pCanvas(${f(planeCanvas.x)}, ${f(planeCanvas.y)}) ` +
        `center(${f(center.x)}, ${f(center.y)}) ` +
        `loc(${f(loc.x)}, ${f(loc.y)}) ` +
        // `angle:${f(angle)} ` +
        // `oldAngle:${f(oldAngle)} ` +
        `useAngle:${f(angleBeforeAround)} ` +
        `dist:${f(distance)} ` +
        `planeLocate(${f(planeLocate.x)}, ${f(planeLocate.y)}) ` +
        `planeLocateC(${f(planeLocateFromCenter.x)}, ${f(planeLocateFromCenter.y)}) `)
      */
    // window.console.log(`screen(${this.f(screenX)}, ${this.f(screenY)}), angle:${this.f(angle)}, distance:${this.f(distance)} plane(${this.f(planeLocate.x)}, ${this.f(planeLocate.y)})`)
    return {
      angle: angle, // 角度
      planeLocateScreen: planeLocateScreen, // マップ回転前のスクリーンベースの座標
      planeLocateCanvas: planeLocateCanvas, // マップ回転前のキャンバスベースの座標
      planeLocateTable: planeLocateTable // マップ回転前のテーブルベースの座標
    };
  }

  static f(v: number): number {
    return Math.floor(v * 100) / 100;
  }

  getLeftTop(): any {
    let canvasElm = document.getElementById("map-canvas");
    const canvasRect: any = canvasElm!.getBoundingClientRect();
    const center = {
      x: canvasRect.x + canvasRect.width / 2,
      y: canvasRect.y + canvasRect.height / 2
    };
    return {
      x: center.x - (this.mapColumns * this.mapGridSize) / 2,
      y: center.y - (this.mapRows * this.mapGridSize) / 2
    };
  }

  calcAddress(
    screenX: number,
    screenY: number,
    oldAngle: number,
    offsetX: number = 0,
    offsetY: number = 0
  ): any {
    // 回転やズームの前のスクリーン座標がどこになるかを計算し、そこをベースにマップ上の座標を算出する
    let planeLocateCanvas: any = this.calcCoordinate(screenX, screenY, oldAngle)
      .planeLocateCanvas;

    // ドロップ先のマス座標を算出
    let gridC: number = Math.ceil(planeLocateCanvas.x / this.mapGridSize);
    let gridR: number = Math.ceil(planeLocateCanvas.y / this.mapGridSize);

    // 掴んだときの対象の相対位置を考慮
    let offsetGridX: number = offsetX / this.mapGridSize;
    let offsetGridY: number = offsetY / this.mapGridSize;
    if (offsetGridX > 0) {
      offsetGridX = Math.floor(offsetGridX);
    } else {
      offsetGridX = Math.ceil(offsetGridX);
    }
    if (offsetGridY > 0) {
      offsetGridY = Math.floor(offsetGridY);
    } else {
      offsetGridY = Math.ceil(offsetGridY);
    }
    gridC -= offsetGridX;
    gridR -= offsetGridY;

    return {
      gridC: gridC,
      gridR: gridR
    };
  }

  calcCanvasAddress(
    screenX: number,
    screenY: number,
    oldAngle: number,
    offsetX: number = 0,
    offsetY: number = 0
  ): any {
    //
    let coordinateObj = this.calcCoordinate(screenX, screenY, oldAngle);

    // マス座標
    const addressObj = this.calcAddress(
      screenX,
      screenY,
      oldAngle,
      offsetX,
      offsetY
    );

    /*
      const f = Math.floor
      window.console.log(
        `oldAngle:${oldAngle} ` +
        `los(${f(locateOnScreen.x)}, ${f(locateOnScreen.y)}) ` +
        `lot(${f(locateOnTable.x)}, ${f(locateOnTable.y)}) ` +
        `loc(${f(locateOnCanvas.x)}, ${f(locateOnCanvas.y)}) `)
      */

    return {
      locateOnScreen: coordinateObj.planeLocateScreen,
      locateOnTable: coordinateObj.planeLocateTable,
      locateOnCanvas: coordinateObj.planeLocateCanvas,
      grid: {
        column: addressObj.gridC,
        row: addressObj.gridR
      }
    };
  }

  get canvasSize(): any {
    return {
      w: this.mapColumns * this.mapGridSize,
      h: this.mapRows * this.mapGridSize
    };
  }

  get mouseOnGrid(): any {
    return {
      c: this.$store.state.map.grid.c,
      r: this.$store.state.map.grid.r
    };
  }

  get mouseOnGridLocaleOnCanvas(): any {
    return {
      x: (this.mouseOnGrid.c - 1) * this.mapGridSize,
      y: (this.mouseOnGrid.r - 1) * this.mapGridSize
    };
  }

  get mouseOnGridLocaleOnTable(): any {
    return {
      x: this.mouseOnGridLocaleOnCanvas.x + this.canvasSize.w / 2,
      y: this.mouseOnGridLocaleOnCanvas.y + this.canvasSize.h / 2
    };
  }
}
</script>
