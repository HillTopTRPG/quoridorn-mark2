<template>
  <div id="throw-parabola-simulator" ref="elm">
    <canvas
      id="throw-parabola-canvas"
      @mousedown.prevent.stop="onMousePress(true)"
      @mouseup.prevent.stop="onMousePress(false)"
      @click.prevent.stop
      @dblclick.prevent.stop
      @keydown.enter.stop
      @keyup.enter.stop
      @keydown.229.stop
      @keyup.229.stop
    >
    </canvas>
    <div id="ball">{{ char }}</div>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-mixin-decorator";
import { Vue, Watch } from "vue-property-decorator";
import { Point, Size } from "address";
import { createPoint, createSize } from "@/app/core/Coordinate";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import GameObjectManager from "@/app/basic/GameObjectManager";
import TaskManager, { MouseMoveParam } from "@/app/core/task/TaskManager";
import { drawLine2 } from "@/app/core/CanvasDrawer";
import { clone } from "@/app/core/Utility";
import VueEvent from "@/app/core/decorator/VueEvent";
import { ThrowParabolaInfo } from "task-info";

@Component
export default class ThrowParabolaSimulator extends Vue {
  private readonly key = "ThrowParabolaSimulator";
  private isMounted: boolean = false;
  private windowSize: Size = createSize(window.innerWidth, window.innerHeight);
  private endPoint: Point = GameObjectManager.instance.throwEndPoint;
  private startPoint: Point = createPoint(0, 0);
  private mousePoint: Point = createPoint(0, 0);

  private momentLocus: Point[] = [];
  private dragStartPoint: Point | null = null;
  private degBlur = 15;
  private arcRadius = 150;

  private char = "💐";

  @VueEvent
  private onMousePress(isPress: boolean) {
    this.dragStartPoint = isPress ? clone(this.mousePoint) : null;
    this.paint(!isPress);
  }

  private mounted() {
    window.console.log("ThrowParabolaSimulator mounted.");
    this.isMounted = true;

    // イベント種別の関係で、セットしないとハンドリングできない
    TaskManager.instance.setTaskParam<MouseMoveParam>("mouse-moving-finished", {
      key: this.key,
      type: ""
    });
    const val = TaskManager.instance.getLastValue<Point>("mouse-moving");
    this.mousePoint = createPoint(val.x, val.y);
  }

  private destroyed() {
    window.console.log("ThrowParabolaSimulator destroyed.");
  }

  @TaskProcessor("resize-finished")
  private async resize(
    task: Task<Size, never>
  ): Promise<TaskResult<never> | void> {
    this.windowSize = task.value!;
    task.resolve();
  }

  @TaskProcessor("mouse-moving-finished")
  private async mouseMoveFinished(
    task: Task<Point, never>
  ): Promise<TaskResult<never> | void> {
    this.mousePoint = task.value!;
    this.paint();
    task.resolve();
  }

  @Watch("isMounted")
  @Watch("windowSize", { deep: true })
  private onChangeWindowSize() {
    if (!this.isMounted) return;
    const size = this.windowSize;
    ThrowParabolaSimulator.canvasElm.width = size.width;
    ThrowParabolaSimulator.canvasElm.height = size.height;
    this.endPoint.x = size.width / 2;
    this.endPoint.y = size.height / 2;
    this.paint();
  }

  private static getDistance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private calcInjectionDeg() {
    const getRad = ThrowParabolaSimulator.getRad;
    const rad2deg = ThrowParabolaSimulator.rad2deg;
    const inputDeg = 180 - rad2deg(getRad(this.endPoint, this.startPoint));
    const injectionDeg =
      this.startPoint.x < this.endPoint.x ? inputDeg : 180 - inputDeg;
    return injectionDeg > 90 ? injectionDeg - 360 : injectionDeg;
  }

  private calcStartPoint(): Point {
    const getRad = ThrowParabolaSimulator.getRad;
    const rad2deg = ThrowParabolaSimulator.rad2deg;
    const calcTan = ThrowParabolaSimulator.calcTan;
    const ex = this.endPoint.x;
    const ey = this.endPoint.y;
    const mx = this.mousePoint.x;
    const my = this.mousePoint.y;
    const w = this.windowSize.width;
    const h = this.windowSize.height;

    const rad = getRad(this.mousePoint, this.endPoint);

    // 左上の角と終点との角度
    const rad1 = getRad(createPoint(0, 0), this.endPoint);
    // 左下の角と終点との角度
    const rad2 = getRad(createPoint(0, h), this.endPoint);
    // 右上の角と終点との角度
    const rad3 = getRad(createPoint(w, 0), this.endPoint);
    // 右下の角と終点との角度
    const rad4 = getRad(createPoint(w, h), this.endPoint);
    if (rad2 < rad && rad <= rad1) {
      // 始点は画面の左辺のどこか
      return createPoint(0, ey - calcTan(rad, ex));
    } else if (rad1 < rad && rad < rad3) {
      // 始点は画面の上辺のどこか
      return createPoint(mx < ex ? 0 : w, 0);
    } else if (Math.abs(rad3) <= Math.abs(rad)) {
      // 始点は画面の右辺のどこか
      const s = Math.sign(ey - my);
      return createPoint(w, ey - calcTan(s * Math.PI - rad, ex));
    } else {
      // 始点は画面の下辺のどこか
      const deg = rad2deg(rad);
      const getPoint = (rad: number) =>
        createPoint(ex - calcTan((rad * Math.PI) / 180, h - ey), h);
      if (deg <= -90 - this.degBlur || -90 + this.degBlur <= deg)
        return getPoint(-90 + deg);
      else return getPoint(mx < ex ? this.degBlur : -this.degBlur);
    }
  }

  private static calcTan(rad: number, a: number) {
    return Math.tan(rad) * a;
  }

  private calcParabola(injectionRad: number, splitNum: number): Point[] {
    const momentLocus: Point[] = [];

    const xr = this.endPoint.x - this.startPoint.x;
    for (let x = 0, i = 0; i <= splitNum; x += Math.abs(xr) / splitNum, i++) {
      const y = this.getPoint(x, injectionRad);
      const p = createPoint(
        this.startPoint.x + (this.startPoint.x < this.endPoint.x ? x : -x),
        this.startPoint.y - y
      );
      momentLocus.push(p);
    }
    return momentLocus;
  }

  private getPoint(x: number, injectionRad: number) {
    const xr = Math.abs(this.endPoint.x - this.startPoint.x);
    const yr = this.startPoint.y - this.endPoint.y;
    const tanT = Math.tan(injectionRad);
    return ((yr - xr * tanT) / (xr * xr)) * x * x + tanT * x;
  }

  private static getDisPoint(rad: number, distance: number, p: Point): Point {
    const x = Math.cos(rad) * distance;
    const y = Math.sin(rad) * distance;
    return createPoint(p.x - x, p.y - y);
  }

  private static getRad(p1: Point, p2: Point) {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  }

  private static deg2rad(deg: number) {
    return (deg * Math.PI) / 180;
  }

  private static rad2deg(rad: number) {
    return (rad * 180) / Math.PI;
  }

  private static get canvasElm() {
    return document.getElementById(
      "throw-parabola-canvas"
    ) as HTMLCanvasElement;
  }

  private async paint(createAnimation: boolean = false): Promise<void> {
    const deg2rad = ThrowParabolaSimulator.deg2rad;
    const rad2deg = ThrowParabolaSimulator.rad2deg;
    const getRad = ThrowParabolaSimulator.getRad;
    const calcTan = ThrowParabolaSimulator.calcTan;
    const getDistance = ThrowParabolaSimulator.getDistance;
    const getDisPoint = ThrowParabolaSimulator.getDisPoint;

    if (createAnimation) {
      await TaskManager.instance.ignition<ThrowParabolaInfo, never>({
        type: "throw-parabola",
        owner: "Quoridorn",
        value: {
          char: this.char,
          list: this.momentLocus.concat()
        }
      });
    }

    let simuDegOrg1 = 0;
    let simuDegOrg2 = 0;
    let injectionDegOrg = 0;
    let simuDeg = 0;
    let injectionDeg = 0;
    if (!this.dragStartPoint) {
      this.startPoint = this.calcStartPoint();
      injectionDeg = this.calcInjectionDeg();
    } else {
      injectionDeg = this.calcInjectionDeg();
      if (
        this.mousePoint.x !== this.dragStartPoint.x ||
        this.mousePoint.y !== this.dragStartPoint.y
      ) {
        simuDeg = rad2deg(getRad(this.mousePoint, this.dragStartPoint));
        simuDegOrg1 = simuDeg;
        if (this.startPoint.x < this.endPoint.x) simuDeg = 180 - simuDeg;
        simuDegOrg2 = simuDeg;
        let degDiff = simuDeg - injectionDeg;
        if (Math.abs(degDiff) > 180)
          degDiff = degDiff - 360 * Math.sign(degDiff);

        simuDeg = injectionDeg + degDiff;
        injectionDegOrg = injectionDeg;

        injectionDeg = Math.max(injectionDeg, simuDeg);
        injectionDeg = Math.min(injectionDeg, 85);
      }
    }
    this.momentLocus = this.calcParabola(deg2rad(injectionDeg), 20);

    const canvasElm = ThrowParabolaSimulator.canvasElm;
    const ctx: CanvasRenderingContext2D = canvasElm!.getContext("2d")!;

    const sx = this.startPoint.x;
    const sy = this.startPoint.y;
    const ex = this.endPoint.x;
    const ey = this.endPoint.y;
    const w = this.windowSize.width;
    const h = this.windowSize.height;
    const diagonal = getDistance(createPoint(0, 0), createPoint(w, h)) / 2;

    // 左上の角と終点との角度
    const rad1 = getRad(createPoint(0, 0), this.endPoint) - Math.PI;
    // 右上の角と終点との角度
    const rad3 = getRad(createPoint(w, 0), this.endPoint) - Math.PI;

    ctx.clearRect(0, 0, w, h);

    ctx.globalAlpha = 1;

    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.arc(ex, ey, diagonal, rad1, rad3, false);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.arc(
      ex,
      ey,
      diagonal,
      deg2rad(90 - this.degBlur),
      deg2rad(90 + this.degBlur),
      false
    );
    ctx.fill();

    // // 四隅と終点とを結ぶ補助線を描画
    // ctx.strokeStyle = "#000000";
    // ctx.setLineDash([5, 5]);
    // drawLine2(ctx, 0, 0, ex, ey);
    // drawLine2(ctx, w, 0, ex, ey);
    // const b = calcTan(deg2rad(this.degBlur), ey);
    // drawLine2(ctx, ex - b, h, ex, ey);
    // drawLine2(ctx, ex + b, h, ex, ey);
    //
    // ctx.setLineDash([]);

    const fillCircle = (p: Point, r: number) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2, false);
      ctx.fill();
    };

    // 始点を描画
    fillCircle(this.startPoint, 5);

    // 終点を描画
    fillCircle(this.endPoint, 5);

    // ドラッグを描画
    if (
      this.dragStartPoint &&
      (this.mousePoint.x !== this.dragStartPoint.x ||
        this.mousePoint.y !== this.dragStartPoint.y)
    ) {
      const s = Math.sign(sx - ex);
      const distance = getDistance(this.dragStartPoint, this.mousePoint);
      const useDis = Math.max(distance, this.arcRadius);
      const mnp1 = getDisPoint(
        deg2rad(simuDegOrg1),
        useDis,
        this.dragStartPoint
      );
      const mnp2 = getDisPoint(
        deg2rad(injectionDegOrg * s + (s < 0 ? 180 : 0)),
        this.arcRadius,
        this.dragStartPoint
      );
      ctx.fillStyle = "#0000FF";
      fillCircle(this.dragStartPoint, 5);
      fillCircle(mnp1, 5);
      fillCircle(mnp2, 5);
      const dx = this.dragStartPoint.x;
      const dy = this.dragStartPoint.y;
      ctx.strokeStyle = "#FF0000";
      // 終点まで
      drawLine2(ctx, dx, dy, mnp2.x, mnp2.y);
      // マウス方向に距離調整した線を引く
      drawLine2(ctx, dx, dy, mnp1.x, mnp1.y);
      ctx.beginPath();
      let d1 = (s > 0 ? Math.PI : 0) - deg2rad(injectionDegOrg * -s);
      let d2 = (s > 0 ? Math.PI : 0) - deg2rad(simuDegOrg2 * -s);
      let dd = d2 > d1 ? d2 - d1 : d2 - d1 + Math.PI * 2;
      if (d1 < 0) d1 += Math.PI * 2;
      if (d2 < 0) d2 += Math.PI * 2;
      if (dd < 0) dd += Math.PI * 2;
      ctx.arc(dx, dy, this.arcRadius * 0.8, d1, d2, dd > Math.PI);
      ctx.stroke();
    }

    ctx.fillStyle = "#0000FF";
    this.momentLocus.forEach(p => {
      fillCircle(p, 3);
    });
  }
}
</script>

<style lang="scss">
@import "../../../assets/common";

#throw-parabola-simulator {
  width: 100%;
  height: 100%;
  z-index: 12;
}

#throw-parabola-canvas {
  display: block;
  background-color: rgba(200, 200, 200, 0.2);
}
</style>
