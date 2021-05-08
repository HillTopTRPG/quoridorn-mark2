<template>
  <div class="map-draw-canvas">
    <canvas
      v-if="isMounted"
      :width="mapCanvasSize.width"
      :height="mapCanvasSize.height"
      @keydown.enter.stop
      @keyup.enter.stop
      @keydown.229.stop
      @keyup.229.stop
    ></canvas>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { findRequireByKey } from "@/app/core/utility/Utility";
import { Line, Point, Size } from "@/@types/store-data-optional";
import { createSize } from "@/app/core/utility/CoordinateUtility";
import { MapDrawStore } from "@/@types/store-data";
import { drawLine2, fillTexts } from "@/app/core/utility/CanvasDrawUtility";
import AddressCalcMixin from "@/app/basic/common/mixin/AddressCalcMixin.vue";

@Component
export default class MapDrawCanvas extends Mixins<AddressCalcMixin>(
  AddressCalcMixin
) {
  @Prop({ type: String, required: true })
  private sceneKey!: string;

  @Prop({ type: String, required: true })
  private sceneLayerKey!: string;

  @Prop({ type: Array, required: true })
  private gridCrossList!: Point[];

  @Prop({ type: Array, required: true })
  private gridLineList!: Line[];

  private key = "map-draw-canvas";

  private mapDrawList = GameObjectManager.instance.mapDrawList;
  private sceneList = GameObjectManager.instance.sceneList;
  private mapCanvasSize: Size | null = null;
  private isMounted: boolean = false;

  private get useMapDrawList() {
    return this.mapDrawList.filter(
      md => md.data!.sceneLayerKey === this.sceneLayerKey
    );
  }

  @Watch("useMapDrawList", { deep: true })
  private onChangeUseMapDrawList() {
    this.paint();
  }

  @Watch("sceneList", { deep: true })
  private updateMapCanvasSize(): void {
    if (!this.isMounted) return;
    const scene = findRequireByKey(
      GameObjectManager.instance.sceneList,
      this.sceneKey
    );
    const gridSize = scene.data!.gridSize;
    this.mapCanvasSize = createSize(
      gridSize * scene.data!.columns,
      gridSize * scene.data!.rows
    );
    setTimeout(this.paint);
  }

  private paint(): void {
    const rootElm = this.$el as HTMLDivElement;
    const canvasElm: HTMLCanvasElement = rootElm.querySelector(
      "canvas"
    ) as HTMLCanvasElement;
    const ctx: CanvasRenderingContext2D = canvasElm!.getContext("2d")!;
    ctx.clearRect(0, 0, this.mapCanvasSize!.width, this.mapCanvasSize!.height);

    this.useMapDrawList.forEach(md => this.paintMapDraw(ctx, md));
  }

  private paintMapDraw(
    ctx: CanvasRenderingContext2D,
    md: StoreData<MapDrawStore> | undefined
  ) {
    if (!md) return;
    const type = md.data!.type;
    const value = md.data!.value;
    const strokeStyle = md.data!.strokeStyle;
    const fillStyle = md.data!.fillStyle;
    const lineWidth = md.data!.lineWidth;

    const saveStrokeStyle = ctx.strokeStyle;
    const saveFillStyle = ctx.fillStyle;
    const saveLineWidth = ctx.lineWidth;
    const saveLineCap = ctx.lineCap;

    ctx.strokeStyle = strokeStyle;
    ctx.fillStyle = fillStyle;
    ctx.lineWidth = lineWidth || 1;
    ctx.lineCap = "round";

    switch (type) {
      case "polygon":
        ctx.beginPath();
        md.data!.pointList.forEach((p, idx) => {
          idx ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      case "line":
        const p1 = md.data!.pointList[0];
        const p2 = md.data!.pointList[1];
        drawLine2(ctx, p1.x, p1.y, p2.x, p2.y);
        break;
      case "text":
        fillTexts(
          ctx,
          value,
          md.data!.pointList[0].x + md.data!.correctionText.x,
          md.data!.pointList[0].y + md.data!.correctionText.y,
          md.data!.style,
          md.data!.fontSize,
          md.data!.textAnchor
        );
        break;
      default:
    }

    ctx.fillStyle = saveFillStyle;
    ctx.strokeStyle = saveStrokeStyle;
    ctx.lineWidth = saveLineWidth;
    ctx.lineCap = saveLineCap;
  }

  @LifeCycle
  private async mounted() {
    this.isMounted = true;
    this.updateMapCanvasSize();
  }
}
</script>

<style scoped lang="scss">
.map-draw-canvas {
  canvas {
    pointer-events: none;
  }
}
</style>
