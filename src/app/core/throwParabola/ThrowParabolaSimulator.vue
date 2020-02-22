<template>
  <div id="throw-parabola-simulator" ref="elm">
    <throw-char-select class="char-select" v-model="char" :chars="chars" />
    <canvas
      id="throw-parabola-canvas"
      @mousedown.prevent.stop="onMousePress(true)"
      @mouseup.prevent.stop="onMousePress(false)"
      @click.prevent.stop
      @dblclick.prevent.stop
      @mousemove="onMouseMove($event)"
      tabindex="1"
      @keydown.enter.stop
      @keyup.enter.stop
      @keydown.229.stop
      @keyup.229.stop
    >
    </canvas>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-mixin-decorator";
import { Vue } from "vue-property-decorator";
import { Point, Size } from "address";
import { createPoint, getEventPoint } from "@/app/core/Coordinate";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import TaskManager from "@/app/core/task/TaskManager";
import { drawLine2 } from "@/app/core/CanvasDrawer";
import VueEvent from "@/app/core/decorator/VueEvent";
import { ThrowParabolaInfo } from "task-info";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import {
  calcInputRad,
  calcParabola,
  calcStartPoint,
  deg2rad,
  getDistance
} from "@/app/core/throwParabola/parabolaUtil";
import ThrowCharSelect from "@/app/basic/common/components/select/ThrowCharSelect.vue";
import { SendDataRequest } from "@/@types/socket";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import GameObjectManager from "@/app/basic/GameObjectManager";
@Component({
  components: { ThrowCharSelect }
})
export default class ThrowParabolaSimulator extends Vue {
  private readonly key = "ThrowParabolaSimulator";
  private isMounted: boolean = false;

  private degBlur = 12.5;
  private mousePoint: Point = createPoint(0, 0);

  private inputRad: number = 0;
  private inputRatio: number = 0;
  private char = "💐";
  private chars = ["💐", "✨", "💖", "💵"];

  @VueEvent
  private async onMousePress(isPress: boolean) {
    await this.paint(!isPress);
  }

  @VueEvent
  private async onMouseMove(event: MouseEvent) {
    this.mousePoint = getEventPoint(event);
    await this.paint();
  }

  @LifeCycle
  private async mounted() {
    this.isMounted = true;

    const val =
      TaskManager.instance.getLastValue<Point>("mouse-moving") ||
      createPoint(0, 0);
    this.mousePoint = createPoint(val.x, val.y);
    ThrowParabolaSimulator.canvasElm.width = window.innerWidth;
    ThrowParabolaSimulator.canvasElm.height = window.innerHeight;
    await this.paint();
  }

  @TaskProcessor("resize-finished")
  private async resize(
    task: Task<Size, never>
  ): Promise<TaskResult<never> | void> {
    ThrowParabolaSimulator.canvasElm.width = window.innerWidth;
    ThrowParabolaSimulator.canvasElm.height = window.innerHeight;
    await this.paint();
    task.resolve();
  }

  private static get canvasElm() {
    return document.getElementById(
      "throw-parabola-canvas"
    ) as HTMLCanvasElement;
  }

  private async paint(createAnimation: boolean = false): Promise<void> {
    if (createAnimation) {
      await SocketFacade.instance.sendData<ThrowParabolaInfo>({
        dataType: "throw-parabola",
        data: {
          char: this.char,
          radius: this.inputRad,
          ratio: this.inputRatio
        }
      });
    }

    const w = window.innerWidth;
    const h = window.innerHeight;
    const ep = createPoint(w / 2, h / 2);
    const mp = this.mousePoint;

    this.inputRad = calcInputRad(mp, ep, this.degBlur);
    const sp = calcStartPoint(ep, this.inputRad);
    this.inputRatio = getDistance(sp, mp) / getDistance(sp, ep);

    const canvasElm = ThrowParabolaSimulator.canvasElm;
    const ctx: CanvasRenderingContext2D = canvasElm!.getContext("2d")!;

    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = 1;

    // 選択不可範囲の描画
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";

    // 選択不可範囲(上半分)の塗りつぶし
    ctx.fillRect(0, 0, w, ep.y);

    // 選択不可範囲(下部)の塗りつぶし
    ctx.beginPath();
    ctx.moveTo(ep.x, ep.y);
    ctx.arc(
      ep.x,
      ep.y,
      getDistance(createPoint(0, 0), createPoint(w, h)) / 2,
      deg2rad(90 - this.degBlur),
      deg2rad(90 + this.degBlur),
      false
    );
    ctx.fill();

    const fillCircle = (p: Point, r: number) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2, false);
      ctx.fill();
    };

    ctx.fillStyle = "#000000";
    // 始点を描画
    fillCircle(sp, 5);

    // 終点を描画
    fillCircle(ep, 5);

    // 始点と終点とを結ぶ線分を描画
    ctx.setLineDash([5, 5]);
    drawLine2(ctx, sp.x, sp.y, ep.x, ep.y);
    ctx.setLineDash([]);

    // 放物線の軌跡を描画
    ctx.fillStyle = "#0000FF";
    calcParabola(this.inputRad, this.inputRatio).points.forEach(p => {
      fillCircle(p, 3);
    });
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

#throw-parabola-simulator {
  width: 100%;
  height: 100%;
  z-index: 12;
  user-select: none;
  font-size: 300%;
}

.char-select {
  position: absolute;
  display: inline-block;
  left: 50%;
  top: 30%;
  transform: translate(-50%, -100%);
  z-index: 2;
  user-select: none;
  width: 2.5em;
}

#throw-parabola-canvas {
  position: absolute;
  left: 0;
  top: 0;
  display: block;
  background-color: rgba(200, 200, 200, 0.2);
  z-index: 1;
}
</style>
