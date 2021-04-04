<template>
  <div id="map-canvas-container" ref="elm">
    <div id="map-canvas-background"></div>

    <canvas
      id="map-canvas"
      :width="mapCanvasSize.width"
      :height="mapCanvasSize.height"
      @keydown.enter.stop
      @keyup.enter.stop
      @keydown.229.stop
      @keyup.229.stop
    >
    </canvas>

    <scene-layer-component
      v-for="layer in useLayerList"
      :key="layer.key"
      :sceneKey="sceneKey"
      :layer="layer"
      :grid-cross-list="gridCrossList"
      :grid-line-list="gridLineList"
    />

    <div
      class="thumb"
      v-for="(thumb, idx) in thumbList"
      :key="idx"
      :style="{
        left: `${thumb.x - 7}px`,
        top: `${thumb.y - 7}px`,
        zIndex: idx + maxSceneLayerOrder + 2
      }"
      @mousedown.left.stop="leftDown($event, idx)"
      @touchstart.stop="leftDown($event, idx)"
      @contextmenu.prevent
    ></div>
    <div
      class="move-thumb"
      v-if="moveThumbPoint"
      :style="{
        left: `${moveThumbPoint.x - 7}px`,
        top: `${moveThumbPoint.y - 7}px`,
        zIndex: maxSceneLayerOrder + 1
      }"
      @mousedown.left.stop="leftDown($event, -1)"
      @touchstart.stop="leftDown($event, -1)"
      @contextmenu.prevent
    ></div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { ModeInfo } from "mode";
import { RoomDataStore, SceneStore } from "@/@types/store-data";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";
import { Line, Point, Size } from "@/@types/store-data-optional";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import {
  createPoint,
  createSize,
  getCrossLines,
  getEventPoint,
  getHalfPoint
} from "@/app/core/utility/CoordinateUtility";
import TaskManager, { MouseMoveParam } from "@/app/core/task/TaskManager";
import { drawLine2 } from "@/app/core/utility/CanvasDrawUtility";
import SceneLayerComponent from "@/app/basic/map/SceneLayerComponent.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { findByKey, findRequireByKey } from "@/app/core/utility/Utility";
import VueEvent from "@/app/core/decorator/VueEvent";
import {
  average,
  clone,
  convertNumberZero,
  listToEmpty
} from "@/app/core/utility/PrimaryDataUtility";
import CssManager from "@/app/core/css/CssManager";
import AddressCalcMixin from "@/app/basic/common/mixin/AddressCalcMixin.vue";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import { getDistance } from "@/app/core/throwParabola/parabolaUtil";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import { SelectMapDrawInfo } from "task-info";

interface MultiMixin extends AddressCalcMixin, ComponentVue {}

@Component({ components: { SceneLayerComponent } })
export default class MapBoard extends Mixins<MultiMixin>(
  AddressCalcMixin,
  ComponentVue
) {
  private isMapDraggingRight: boolean = false;

  @Prop({ type: String, required: true })
  private sceneKey!: string;

  @Prop({ type: Object, default: null })
  private scene!: SceneStore | null;

  private roomData: RoomDataStore = GameObjectManager.instance.roomData;
  private sceneLayerList = GameObjectManager.instance.sceneLayerList;
  private sceneAndLayerList = GameObjectManager.instance.sceneAndLayerList;

  private thumbList: Point[] = [];
  private moveOrigin: Point = createPoint(0, 0);
  private originPointList: Point[] = [];
  private selectedMapDrawKey: string | null = null;
  private mapDrawList = GameObjectManager.instance.mapDrawList;

  @TaskProcessor("room-data-update-finished")
  private async roomDataUpdateFinished(
    task: Task<RoomDataStore, never>
  ): Promise<TaskResult<never> | void> {
    this.roomData = task.value!;
  }

  @Watch("selectedMapDrawKey")
  @Watch("mapDrawList", { deep: true })
  private onChangeSelectedMapDrawKey() {
    if (!this.selectedMapDrawKey) {
      listToEmpty(this.thumbList);
      return;
    }
    listToEmpty(this.thumbList);
    const mapDraw = findByKey(this.mapDrawList, this.selectedMapDrawKey);
    if (mapDraw) {
      this.thumbList.push(...mapDraw.data!.pointList);
    }
  }

  @TaskProcessor("select-map-draw-finished")
  private async selectMapDrawFinished(
    task: Task<SelectMapDrawInfo, never>
  ): Promise<TaskResult<never> | void> {
    this.selectedMapDrawKey = task.value!.mapDrawKey;
  }

  private get moveThumbPoint(): Point | null {
    if (this.thumbList.length < 2) return null;
    return createPoint(
      average(this.thumbList.map(p => p.x))!,
      average(this.thumbList.map(p => p.y))!
    );
  }

  private get maxSceneLayerOrder() {
    return Math.max(...this.sceneLayerList.map(sl => sl.order));
  }

  @VueEvent
  private leftDown(event: MouseEvent | TouchEvent, idx: number) {
    if (idx === -1) {
      const point = getEventPoint(event);
      this.moveOrigin = this.getPoint(point);
      const mapDraw = findRequireByKey(
        this.mapDrawList,
        this.selectedMapDrawKey
      );
      this.originPointList = mapDraw.data!.pointList.map(p => clone(p)!);
    }
    TaskManager.instance.setTaskParam<MouseMoveParam>("mouse-moving-finished", {
      key: this.key,
      type: idx.toString()
    });
    TaskManager.instance.setTaskParam<MouseMoveParam>(
      `mouse-move-end-left-finished`,
      {
        key: this.key,
        type: idx.toString(),
        pieceKey: this.selectedMapDrawKey || undefined
      }
    );
  }

  private get crossPointList(): Point[] {
    const otherLines: Line[] = this.mapDrawList
      .filter(
        md => md.data!.type !== "text" && md.key !== this.selectedMapDrawKey
      )
      .flatMap(md => {
        if (md.data!.type === "line") {
          return [
            {
              p1: md.data!.pointList[0],
              p2: md.data!.pointList[1]
            }
          ];
        } else if (md.data!.type === "polygon") {
          return md.data!.pointList.map((p, idx) => {
            const nextIdx = idx === md.data!.pointList.length - 1 ? 0 : idx + 1;
            return {
              p1: p,
              p2: md.data!.pointList[nextIdx]
            };
          });
        }
        return [];
      });
    const crossPointList: Point[] = [...this.gridCrossList];
    crossPointList.push(...getCrossLines(otherLines, this.gridLineList));
    crossPointList.push(...getCrossLines(otherLines));
    crossPointList.push(...otherLines.flatMap(md => [md.p1, md.p2]));
    return crossPointList;
  }

  @TaskProcessor("mouse-moving-finished")
  private async mouseMoveFinished(
    task: Task<Point, never>,
    param: MouseMoveParam
  ): Promise<TaskResult<never> | void> {
    if (!param || param.key !== this.key) return;
    const point = task.value!;
    const canvasPoint = this.getPoint(point);
    const mapDraw = findRequireByKey(this.mapDrawList, this.selectedMapDrawKey);
    const idx = convertNumberZero(param.type);

    const getMinDistanceGridPoint = (
      raw: Point
    ): {
      distance: number;
      gridPoint: Point;
      diff: Point;
    } => {
      let minDistance: number = Number.MAX_VALUE;
      let gridPoint: Point = raw;
      this.crossPointList.forEach(gc => {
        const dist = getDistance(raw, gc);
        if (minDistance > dist) {
          minDistance = dist;
          gridPoint = gc;
        }
      });
      return {
        distance: minDistance,
        gridPoint,
        diff: createPoint(gridPoint.x - raw.x, gridPoint.y - raw.y)
      };
    };

    if (idx > -1) {
      const { gridPoint } = getMinDistanceGridPoint(canvasPoint);

      mapDraw.data!.pointList[idx].x = gridPoint.x;
      mapDraw.data!.pointList[idx].y = gridPoint.y;
      this.thumbList[idx].x = gridPoint.x;
      this.thumbList[idx].y = gridPoint.y;
    } else {
      // 描画物自体の移動
      const rawDiff = createPoint(
        canvasPoint.x - this.moveOrigin.x,
        canvasPoint.y - this.moveOrigin.y
      );
      let minDistance: number = Number.MAX_VALUE;
      let diff: Point = createPoint(0, 0);
      const pointList = mapDraw.data!.pointList;
      this.originPointList
        .map(p =>
          getMinDistanceGridPoint(createPoint(p.x + rawDiff.x, p.y + rawDiff.y))
        )
        .forEach(info => {
          if (info.distance < minDistance) {
            minDistance = info.distance;
            diff = info.diff;
          }
        });
      pointList.forEach((p, idx) => {
        const newPoint = createPoint(
          this.originPointList[idx].x + rawDiff.x + diff.x,
          this.originPointList[idx].y + rawDiff.y + diff.y
        );
        p.x = newPoint.x;
        p.y = newPoint.y;
        this.thumbList[idx].x = newPoint.x;
        this.thumbList[idx].y = newPoint.y;
      });
    }
  }

  @TaskProcessor("mouse-move-end-left-finished")
  private async mouseLeftUpFinished(
    task: Task<Point, never>,
    param: MouseMoveParam
  ): Promise<TaskResult<never> | void> {
    // console.log(
    //   !param ||
    //     param.key !== this.sceneLayerKey ||
    //     param.pieceKey !== this.selectedMapDrawKey,
    //   param?.key,
    //   param?.pieceKey,
    //   this.sceneLayerKey,
    //   this.selectedMapDrawKey
    // );
    if (
      !param ||
      param.key !== this.key ||
      param.pieceKey !== this.selectedMapDrawKey
    )
      return;

    const mapDraw = findRequireByKey(this.mapDrawList, this.selectedMapDrawKey);
    await SocketFacade.instance.mapDrawListCC().updatePackage([
      {
        key: mapDraw.key,
        data: mapDraw.data!
      }
    ]);

    TaskManager.instance.setTaskParam("mouse-moving-finished", null);
    TaskManager.instance.setTaskParam("mouse-move-end-left-finished", null);

    task.resolve();
  }

  private getPoint(point: Point) {
    const currentAngle = CssManager.instance.propMap.currentAngle;
    const calcResult = this.calcCoordinate(point, currentAngle);
    return calcResult.planeLocateCanvas;
  }

  private isMounted: boolean = false;

  @VueEvent
  private get useLayerList() {
    return this.sceneAndLayerList
      .filter(
        mal => mal.data && mal.data.sceneKey === this.sceneKey && mal.data.isUse
      )
      .map(mal => mal.data!.layerKey)
      .map(layerKey => findRequireByKey(this.sceneLayerList, layerKey))
      .filter(ml => ml);
  }

  @LifeCycle
  private mounted() {
    this.isMounted = true;
    setTimeout(async () => {
      this.paint();
      await TaskManager.instance.ignition<ModeInfo, never>({
        type: "mode-change",
        owner: "Quoridorn",
        value: {
          type: "view-progress",
          value: {
            message: "",
            all: 0,
            current: 0
          }
        }
      });
      performance.mark("room-init-end");
      performance.measure("room-init-time", "room-init-start", "room-init-end");
      const durationMs = performance.getEntriesByName("room-init-time")[0]
        .duration;
      const durationS = Math.round(durationMs / 100) / 10;
      console.log(`部屋のセットアップにかかった時間：${durationS}秒`);
    });
  }

  @Watch("isMounted")
  @Watch("roomData.settings.isDrawGridLine")
  @Watch("roomData.settings.isDrawGridId")
  @Watch("scene", { deep: true })
  private onChangeScene() {
    if (!this.isMounted) return;
    // setTimeoutを入れないと罫線の反映がされない場合がある
    setTimeout(() => {
      this.paint();
    });
  }

  private get mapCanvasSize(): Size {
    if (!this.scene) {
      return createSize(0, 0);
    }
    const gridSize = this.scene.gridSize;
    return createSize(
      gridSize * this.scene.columns,
      gridSize * this.scene.rows
    );
  }

  private get gridLineList(): Line[] {
    if (!this.scene) return [];
    const gridSize = this.scene.gridSize;
    return [
      ...new Array(this.scene.columns + 1).fill(null).map((_, i) => ({
        p1: { x: i * gridSize, y: 0 },
        p2: { x: i * gridSize, y: this.mapCanvasSize.height }
      })),
      ...new Array(this.scene.rows + 1).fill(null).map((_, i) => ({
        p1: { x: 0, y: i * gridSize },
        p2: { x: this.mapCanvasSize.width, y: i * gridSize }
      }))
    ];
  }

  private get gridCrossList(): Point[] {
    if (!this.scene) return [];
    const crossList = getCrossLines(this.gridLineList);
    const addCrossList: Point[] = [];
    crossList.forEach((p, idx) => {
      if (!this.scene) return;
      const addHalfPoint = (addIdx: number) => {
        if (idx + addIdx < crossList.length) {
          addCrossList.push(getHalfPoint(p, crossList[idx + addIdx]));
        }
      };
      if (idx % (this.scene.columns + 1) < this.scene.columns) {
        addHalfPoint(1);
        addHalfPoint(this.scene.columns + 2);
      }
      addHalfPoint(this.scene.columns + 1);
    });
    return [...crossList, ...addCrossList];
  }

  private paint(): void {
    if (!this.scene) return;
    const canvasElm: HTMLCanvasElement = document.getElementById(
      "map-canvas"
    ) as HTMLCanvasElement;
    const ctx: CanvasRenderingContext2D = canvasElm!.getContext("2d")!;

    ctx.clearRect(0, 0, this.mapCanvasSize.width, this.mapCanvasSize.height);

    const gridSize = this.scene.gridSize;

    // マス目の描画
    if (this.roomData.settings.isDrawGridLine) {
      ctx.strokeStyle = this.scene.gridColor;
      ctx.globalAlpha = 1;
      this.gridLineList.forEach(l =>
        drawLine2(ctx, l.p1.x, l.p1.y, l.p2.x, l.p2.y)
      );
    }

    // マス座標の描画
    if (this.roomData.settings.isDrawGridId) {
      ctx.fillStyle = this.scene.fontColor;
      ctx.globalAlpha = 1;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let c = 0; c <= this.scene.columns; c++) {
        for (let r = 0; r <= this.scene.rows; r++) {
          const text = c + 1 + "-" + (r + 1);
          const x = c * gridSize + (gridSize - 1) / 2;
          const y = r * gridSize + (gridSize - 1) / 2;
          ctx.fillText(text, x, y);
        }
      }
    }

    // 中心点の描画
    if (this.isMapDraggingRight) {
      ctx.strokeStyle = "black";
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;

      const cx = this.mapCanvasSize.width / 2;
      const cy = this.mapCanvasSize.height / 2;
      ctx.setLineDash([2, 2]);
      // 横線
      drawLine2(ctx, cx - 10, cy - 10, cx + 11, cy + 11);
      // 縦線
      drawLine2(ctx, cx - 10, cy + 11, cx + 11, cy - 10);
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
    }

    /*
    // マウス座標の描画
    const mouseMark = {
      x: this.mouseOnCanvasLocate.x - 10,
      y: this.mouseOnCanvasLocate.y - 10
    }
    drawLine(ctx, mouseMark.x, mouseMark.y, 20, 20)
    drawLine(ctx, mouseMark.x + 20, mouseMark.y, -20, 20)
    // console.log(this.mouseOnCanvasLocate)
    */
  }

  @Watch("isMounted")
  @Watch("scene.background", { deep: true })
  private onChangeBackground() {
    if (!this.scene) return;
    let direction = "";
    let backColor = "transparent";
    if (this.scene.background.texture.type === "image") {
      const directionRow = this.scene.background.texture.direction;
      if (directionRow === "horizontal") direction = "scale(-1, 1)";
      if (directionRow === "vertical") direction = "scale(1, -1)";
      if (directionRow === "180") direction = "rotate(180deg)";
    } else {
      backColor = this.scene.background.texture.backgroundColor;
    }
    this.elm.style.setProperty(`--image-direction`, direction);
    this.elm.style.setProperty(`--back-color`, backColor);
  }

  // @Watch("mouseOnCanvasLocate", { deep: true })
  // private onChangeMouseOnCanvasLocate() {
  //   this.paint();
  // }

  @Watch("isMounted")
  @Watch("mapCanvasSize", { deep: true })
  private onChangeMapCanvasSize() {
    this.elm.style.width = `${this.mapCanvasSize.width}px`;
    this.elm.style.height = `${this.mapCanvasSize.height}px`;
  }

  private get elm(): HTMLDivElement {
    return this.$refs.elm as HTMLDivElement;
  }
}
</script>

<style scoped lang="scss">
#map-canvas-container {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  margin: auto;
  z-index: 0;
}

#map-canvas-background {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  margin: auto;
  background-size: 100% 100%;
  z-index: -2;
  /* JavaScriptで設定されるプロパティ
  width
  height
  background-color
  background-image
  transform
  */
}

#map-canvas {
  display: block;
  border: none;
  box-sizing: border-box;
  background-size: 100% 100%;
  pointer-events: none;
  z-index: -1;

  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  margin: auto;
}
.thumb,
.move-thumb {
  position: absolute;
  border-radius: 50%;
  border: red solid 3px;
  width: 8px;
  height: 8px;
  cursor: pointer;
}
.thumb {
  outline: blue solid 3px;
}
.move-thumb {
  outline: green solid 3px;
  z-index: 0;
}
</style>
