<script lang="ts">
import Vue from "vue";
import { Mixin } from "vue-mixin-decorator";
import { Getter } from "vuex-class";
import {
  arrangeAngle,
  calcAngle,
  calcCenter,
  calcDistance,
  createPoint
} from "@/app/core/Coordinate";
import { Matrix, Point, Rectangle } from "@/@types/address";
import VueEvent from "@/app/core/decorator/VueEvent";
import { getCssPxNum } from "@/app/core/Css";

type Coordinates = {
  angle: number; // 角度
  planeLocateScreen: Point; // マップ回転前のスクリーンベースの座標
  planeLocateCanvas: Point; // マップ回転前のキャンバスベースの座標
  planeLocateTable: Point; // マップ回転前のテーブルベースの座標
};

@Mixin
export default class AddressCalcMixin extends Vue {
  @Getter("mapColumns") protected mapColumns: any;
  @Getter("mapRows") protected mapRows: any;
  @Getter("mapGridSize") protected mapGridSize: any;
  @Getter("mapBorderWidth") protected mapBorderWidth: any;
  @Getter("mapMarginGridSize") protected mapMarginGridSize: any;
  @Getter("mapWheel") protected mapWheel: any;

  protected get canvasSize(): any {
    return {
      w: this.mapColumns * this.mapGridSize,
      h: this.mapRows * this.mapGridSize
    };
  }

  /**
   * 指定されたスクリーン座標を元に、座標計算を行う
   * @param mouse
   * @param oldAngle
   * @returns {{angle: number, planeLocateScreen: {x: *, y: *}, planeLocateCanvas: {x: *, y: *}, planeLocateTable: {x: *, y: *}}}
   */
  protected calcCoordinate(mouse: Point, oldAngle: number): Coordinates {
    // canvas上のマス座標を計算する
    const canvasRectangle: Rectangle = document
      .getElementById("map-canvas")!
      .getBoundingClientRect() as Rectangle;

    const zoom = (getCssPxNum("--wheel") * -1 + 1000) / 1000;
    // canvasの中心点
    const canvasCenter: Point = calcCenter(canvasRectangle);
    // 中心点と指定された座標とを結ぶ線の角度を求める
    const angle: number = calcAngle(mouse, canvasCenter);
    // 中心点と指定された座標とを結ぶ線の長さを求める
    const distance: number = calcDistance(mouse, canvasCenter) * zoom;
    // マップ回転前の角度を求める
    const angleBefore: number = arrangeAngle(angle - oldAngle);
    const planeLocateScreen: Point = {
      x: canvasCenter.x + distance * Math.cos((angleBefore * Math.PI) / 180),
      y: canvasCenter.y + distance * Math.sin((angleBefore * Math.PI) / 180)
    };
    const planeLocateCenter: Point = {
      x: planeLocateScreen.x - canvasCenter.x,
      y: planeLocateScreen.y - canvasCenter.y
    };
    const planeLocateCanvas: Point = {
      x: planeLocateCenter.x + (this.mapColumns / 2) * this.mapGridSize,
      y: planeLocateCenter.y + (this.mapRows / 2) * this.mapGridSize
    };
    const planeLocateTable: Point = {
      x: planeLocateCanvas.x + this.mapMarginGridSize * this.mapGridSize,
      y: planeLocateCanvas.y + this.mapMarginGridSize * this.mapGridSize
    };
    return {
      angle, // 角度
      planeLocateScreen, // マップ回転前のスクリーンベースの座標
      planeLocateCanvas, // マップ回転前のキャンバスベースの座標
      planeLocateTable // マップ回転前のテーブルベースの座標
    };
  }

  @VueEvent
  protected calcCanvasAddress(
    screenX: number,
    screenY: number,
    oldAngle: number,
    offsetX: number = 0,
    offsetY: number = 0
  ): any {
    const coordinateObj: Coordinates = this.calcCoordinate(
      createPoint(screenX, screenY),
      oldAngle
    );

    // マス座標
    const addressObj: Matrix = this.calcAddress(
      screenX,
      screenY,
      oldAngle,
      offsetX,
      offsetY
    );

    return {
      locateOnScreen: coordinateObj.planeLocateScreen,
      locateOnTable: coordinateObj.planeLocateTable,
      locateOnCanvas: coordinateObj.planeLocateCanvas,
      grid: addressObj
    };
  }

  /**
   * スクリーン座標と角度からマップ上の座標(column, row)を算出する
   * @param screenX
   * @param screenY
   * @param oldAngle
   * @param offsetX
   * @param offsetY
   */
  private calcAddress(
    screenX: number,
    screenY: number,
    oldAngle: number,
    offsetX: number = 0,
    offsetY: number = 0
  ): Matrix {
    // 回転やズームの前のスクリーン座標がどこになるかを計算し、そこをベースにマップ上の座標を算出する
    let planeLocateCanvas: Point = this.calcCoordinate(
      createPoint(screenX, screenY),
      oldAngle
    ).planeLocateCanvas;

    // ドロップ先のマス座標を算出
    let column: number = Math.ceil(planeLocateCanvas.x / this.mapGridSize);
    let row: number = Math.ceil(planeLocateCanvas.y / this.mapGridSize);

    // 掴んだときの対象の相対位置を考慮
    let offsetGridX: number = offsetX / this.mapGridSize;
    let offsetGridY: number = offsetY / this.mapGridSize;

    column -= (offsetGridX > 0 ? Math.floor : Math.ceil)(offsetGridX);
    row -= (offsetGridY > 0 ? Math.floor : Math.ceil)(offsetGridY);

    return {
      column,
      row
    };
  }
}
</script>
