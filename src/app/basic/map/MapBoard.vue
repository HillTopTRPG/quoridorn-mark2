<template>
  <canvas
    id="map-canvas"
    :class="{ isReverse: isMapReverse }"
    :width="mapCanvasSize.w"
    :height="mapCanvasSize.h"
    v-bg-img="getBackgroundImage"
    @keydown.enter.stop
    @keyup.enter.stop
    @keydown.229.stop
    @keyup.229.stop
    @contextmenu.prevent
  >
  </canvas>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { Getter } from "vuex-class";
import { drawLine, drawLine2 } from "@/app/core/CanvasDrawer";

@Component
export default class MapBoard extends Vue {
  @Getter("getBackgroundImage") private getBackgroundImage: any;
  @Getter("isDrawGridLine") private isDrawGridLine: any;
  @Getter("isDrawGridId") private isDrawGridId: any;
  @Getter("mapGridColor") private mapGridColor: any;
  @Getter("mapColumns") private mapColumns: any;
  @Getter("mapRows") private mapRows: any;
  @Getter("isMapReverse") private isMapReverse: any;
  @Getter("mapGrid") private mapGrid: any;
  @Getter("mapGridSize") private mapGridSize: any;
  @Getter("mapCanvasSize") private mapCanvasSize: any;
  @Getter("mouseOnCanvasLocate") private mouseOnCanvasLocate: any;
  @Getter("isMapDraggingRight") private isMapDraggingRight!: boolean;

  private mounted(): void {
    this.paint();
  }

  private paint(this: any): void {
    const canvasElm: HTMLCanvasElement = document.getElementById(
      "map-canvas"
    ) as HTMLCanvasElement;
    const ctx: CanvasRenderingContext2D = canvasElm!.getContext("2d")!;

    ctx.clearRect(0, 0, this.mapCanvasSize.w, this.mapCanvasSize.h);

    // ctx.globalAlpha = 1
    // ctx.drawImage(img, 0, 0, this.mapCanvasSize.w, this.mapCanvasSize.h)

    // マス目の描画
    if (this.isDrawGridLine) {
      ctx.strokeStyle = this.mapGridColor;
      ctx.globalAlpha = 1;
      for (let c = 0; c <= this.mapColumns; c++) {
        for (let r = 0; r <= this.mapRows; r++) {
          // 横線
          drawLine(
            ctx,
            c * this.mapGridSize,
            r * this.mapGridSize,
            this.mapGridSize - 1,
            0
          );
          // 縦線
          drawLine(
            ctx,
            c * this.mapGridSize,
            r * this.mapGridSize + 1,
            0,
            this.mapGridSize - 1
          );
        }
      }

      // マウス下のマスを強調表示
      ctx.strokeStyle = this.mapGridColor;
      ctx.strokeStyle = "red";
      ctx.globalAlpha = 1;
      ctx.rect(
        (this.mapGrid.c - 1) * this.mapGridSize,
        (this.mapGrid.r - 1) * this.mapGridSize,
        this.mapGridSize,
        this.mapGridSize
      );
      ctx.stroke();
    }

    // 中心点の描画
    if (this.isMapDraggingRight) {
      ctx.strokeStyle = "black";
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;

      const center = {
        x: this.mapCanvasSize.w / 2,
        y: this.mapCanvasSize.h / 2
      };
      ctx.setLineDash([2, 2]);
      // 横線
      drawLine2(
        ctx,
        center.x - 10,
        center.y - 10,
        center.x + 11,
        center.y + 11
      );
      // 縦線
      drawLine2(
        ctx,
        center.x - 10,
        center.y + 11,
        center.x + 11,
        center.y - 10
      );
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
    // window.console.log(this.mouseOnCanvasLocate)
    */

    // マス座標の描画
    if (this.isDrawGridId) {
      ctx.fillStyle = this.mapGridColor;
      ctx.globalAlpha = 1;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let c = 0; c <= this.mapColumns; c++) {
        for (let r = 0; r <= this.mapRows; r++) {
          const text = c + 1 + "-" + (r + 1);
          const x = c * this.mapGridSize + (this.mapGridSize - 1) / 2;
          const y = r * this.mapGridSize + (this.mapGridSize - 1) / 2;
          ctx.fillText(text, x, y);
          // window.console.log(`text:${text} (${x}, ${y})`)
        }
      }
    }
  }

  @Watch("isDrawGridLine")
  private onChangeIsDrawGridLine() {
    window.console.log("isDrawGridLine from paint");
    this.paint();
  }

  @Watch("isDrawGridId")
  private onChangeIsDrawGridId() {
    this.paint();
  }

  @Watch("mapGridColor")
  private onChangeMapGridColor() {
    this.paint();
  }

  @Watch("mapGrid", { deep: true })
  private onChangeGrid() {
    this.paint();
  }

  @Watch("mouseOnCanvasLocate", { deep: true })
  private onChangeMouseOnCanvasLocate() {
    this.paint();
  }

  @Watch("mapCanvasSize", { deep: true })
  private onChangeMapCanvasSize() {
    this.paint();
  }
}
</script>

<style scoped lang="scss">
canvas {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  margin: auto;
  border: none;
  box-sizing: border-box;
  background-size: 100% 100%;
}

.isReverse {
  transform: scale(-1, 1);
}
</style>
