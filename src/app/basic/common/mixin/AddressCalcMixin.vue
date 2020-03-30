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
} from "@/app/core/utility/CoordinateUtility";
import { Matrix, Point, Rectangle } from "address";
import VueEvent from "@/app/core/decorator/VueEvent";
import CssManager from "@/app/core/css/CssManager";

type Coordinates = {
  angle: number; // 角度
  planeLocateScene: Point; // マップ回転前のスクリーンベースの座標
  planeLocateCanvas: Point; // マップ回転前のキャンバスベースの座標
};

@Mixin
export default class AddressCalcMixin extends Vue {
  @Getter("mapColumns") protected mapColumns: any;
  @Getter("mapRows") protected mapRows: any;
  @Getter("mapBorderWidth") protected mapBorderWidth: any;
  @Getter("mapWheel") protected mapWheel: any;

  /**
   * 指定されたスクリーン座標を元に、座標計算を行う
   * @param mouse
   * @param oldAngle
   * @returns {{angle: number, planeLocateScene: {x: *, y: *}, planeLocateCanvas: {x: *, y: *}, planeLocateTable: {x: *, y: *}}}
   */
  public calcCoordinate(mouse: Point, oldAngle: number): Coordinates {
    // canvas上のマス座標を計算する
    const canvasRectangle: Rectangle = document
      .getElementById("map-canvas")!
      .getBoundingClientRect() as Rectangle;

    const wheel = CssManager.instance.propMap.wheel;
    const zoom = (wheel * -1 + 1000) / 1000;
    // canvasの中心点
    const canvasCenter: Point = calcCenter(canvasRectangle);
    // 中心点と指定された座標とを結ぶ線の角度を求める
    const angle: number = calcAngle(mouse, canvasCenter);
    // 中心点と指定された座標とを結ぶ線の長さを求める
    const distance: number = calcDistance(mouse, canvasCenter) * zoom;
    // マップ回転前の角度を求める
    const angleBefore: number = arrangeAngle(angle - oldAngle);
    const planeLocateScene: Point = {
      x: canvasCenter.x + distance * Math.cos((angleBefore * Math.PI) / 180),
      y: canvasCenter.y + distance * Math.sin((angleBefore * Math.PI) / 180)
    };
    const planeLocateCenter: Point = {
      x: planeLocateScene.x - canvasCenter.x,
      y: planeLocateScene.y - canvasCenter.y
    };
    const gridSize = CssManager.instance.propMap.gridSize;
    const mapColumn = CssManager.instance.propMap.totalColumn;
    const mapRow = CssManager.instance.propMap.totalRow;
    const planeLocateCanvas: Point = {
      x: planeLocateCenter.x + (mapColumn / 2) * gridSize,
      y: planeLocateCenter.y + (mapRow / 2) * gridSize
    };
    return {
      angle, // 角度
      planeLocateScene, // マップ回転前のスクリーンベースの座標
      planeLocateCanvas // マップ回転前のキャンバスベースの座標
    };
  }

  @VueEvent
  protected calcCanvasAddress(
    sceneX: number,
    sceneY: number,
    oldAngle: number,
    offsetX: number = 0,
    offsetY: number = 0
  ): any {
    const coordinateObj: Coordinates = this.calcCoordinate(
      createPoint(sceneX, sceneY),
      oldAngle
    );

    // マス座標
    const addressObj: Matrix = this.calcAddress(
      sceneX,
      sceneY,
      oldAngle,
      offsetX,
      offsetY
    );

    return {
      locateOnScene: coordinateObj.planeLocateScene,
      locateOnCanvas: coordinateObj.planeLocateCanvas,
      grid: addressObj
    };
  }

  /**
   * スクリーン座標と角度からマップ上の座標(column, row)を算出する
   * @param sceneX
   * @param sceneY
   * @param oldAngle
   * @param offsetX
   * @param offsetY
   */
  private calcAddress(
    sceneX: number,
    sceneY: number,
    oldAngle: number,
    offsetX: number = 0,
    offsetY: number = 0
  ): Matrix {
    // 回転やズームの前のスクリーン座標がどこになるかを計算し、そこをベースにマップ上の座標を算出する
    let planeLocateCanvas: Point = this.calcCoordinate(
      createPoint(sceneX, sceneY),
      oldAngle
    ).planeLocateCanvas;

    const gridSize = CssManager.instance.propMap.gridSize;
    // ドロップ先のマス座標を算出
    let column: number = Math.ceil(planeLocateCanvas.x / gridSize);
    let row: number = Math.ceil(planeLocateCanvas.y / gridSize);

    // 掴んだときの対象の相対位置を考慮
    let offsetGridX: number = offsetX / gridSize;
    let offsetGridY: number = offsetY / gridSize;

    column -= (offsetGridX > 0 ? Math.floor : Math.ceil)(offsetGridX);
    row -= (offsetGridY > 0 ? Math.floor : Math.ceil)(offsetGridY);

    return {
      column,
      row
    };
  }
}
</script>
