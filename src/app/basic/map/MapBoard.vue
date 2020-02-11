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
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { Getter } from "vuex-class";
import { drawLine, drawLine2 } from "@/app/core/CanvasDrawer";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import { Screen, RoomData } from "@/@types/room";
import { StoreUseData } from "@/@types/store";
import SocketFacade, {
  getStoreObj
} from "@/app/core/api/app-server/SocketFacade";
import { ApplicationError } from "@/app/core/error/ApplicationError";
import { Matrix, Size } from "address";
import { createSize } from "@/app/core/Coordinate";

@Component
export default class MapBoard extends Vue {
  private isMapDraggingRight: boolean = false;

  @Prop({ type: Object, default: null })
  private screen!: Screen;

  private roomData: StoreUseData<RoomData> | null = null;
  private key = "map-board";

  private get mapCanvasSize(): Size {
    if (!this.screen) {
      return createSize(0, 0);
    }
    const gridSize = this.screen.gridSize;
    return createSize(
      gridSize * this.screen.columns,
      gridSize * this.screen.rows
    );
  }

  @LifeCycle
  private async beforeCreate(): Promise<void> {
    const roomDataCC = SocketFacade.instance.roomDataCC();
    this.roomData = (await roomDataCC.getList(false))[0];
    if (!this.roomData) throw new ApplicationError("No such roomData.");
    await roomDataCC.setSnapshot(this.key, this.roomData.id!, snapshot => {
      if (snapshot.data && snapshot.data.status === "modified") {
        this.roomData = getStoreObj(snapshot);
      }
    });
  }

  @LifeCycle
  private updated(): void {
    this.paint();
  }

  private paint(): void {
    if (!this.screen) return;
    const canvasElm: HTMLCanvasElement = document.getElementById(
      "map-canvas"
    ) as HTMLCanvasElement;
    const ctx: CanvasRenderingContext2D = canvasElm!.getContext("2d")!;

    ctx.clearRect(0, 0, this.mapCanvasSize.width, this.mapCanvasSize.height);

    const gridSize = this.screen.gridSize;

    // マス目の描画
    if (this.roomData!.data!.isDrawGridLine) {
      ctx.strokeStyle = this.screen.gridColor;
      ctx.globalAlpha = 1;
      for (let r = 0; r <= this.screen.rows; r++) {
        for (let c = 0; c <= this.screen.columns; c++) {
          // 横線
          drawLine(ctx, c * gridSize, r * gridSize, gridSize - 1, 0);
          // 縦線
          drawLine(ctx, c * gridSize, r * gridSize + 1, 0, gridSize - 1);
        }
      }

      // マウス下のマスを強調表示
      ctx.strokeStyle = this.screen.gridColor;
      ctx.strokeStyle = "red";
      ctx.globalAlpha = 1;
      const m: Matrix = {
        row: 4,
        column: 6
      };
      ctx.rect(
        (m.column - 1) * gridSize,
        (m.row - 1) * gridSize,
        gridSize,
        gridSize
      );
      ctx.stroke();
    }

    // マス座標の描画
    if (this.roomData!.data!.isDrawGridId) {
      ctx.fillStyle = this.screen.fontColor;
      ctx.globalAlpha = 1;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let r = 0; r <= this.screen.rows; r++) {
        for (let c = 0; c <= this.screen.columns; c++) {
          const text = r + 1 + "-" + (c + 1);
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
    // window.console.log(this.mouseOnCanvasLocate)
    */
  }

  @Watch("roomData.data.isDrawGridLine")
  private onChangeIsDrawGridLine() {
    window.console.log("isDrawGridLine from paint");
    this.paint();
  }

  @Watch("mapSetting.background", { deep: true })
  private onChangeBackground() {
    let direction = "";
    let backColor = "transparent";
    if (this.screen.background.texture.type === "image") {
      const directionRow = this.screen.background.texture.direction;
      if (directionRow === "horizontal") direction = "scale(-1, 1)";
      if (directionRow === "vertical") direction = "scale(1, -1)";
      if (directionRow === "180") direction = "rotate(180deg)";
    } else {
      backColor = this.screen.background.texture.backgroundColor;
    }
    this.elm.style.setProperty(`--image-direction`, direction);
    this.elm.style.setProperty(`--back-color`, backColor);
  }

  // @Watch("mouseOnCanvasLocate", { deep: true })
  // private onChangeMouseOnCanvasLocate() {
  //   this.paint();
  // }

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
  z-index: 1;
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
  z-index: 2;

  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  margin: auto;
}
</style>
