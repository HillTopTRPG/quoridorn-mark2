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
      :key="layer.id"
      :layer="layer"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { drawLine, drawLine2 } from "@/app/core/CanvasDrawer";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import { Scene, RoomData } from "@/@types/room";
import { Matrix, Size } from "address";
import { createSize } from "@/app/core/Coordinate";
import GameObjectManager from "@/app/basic/GameObjectManager";
import SceneLayerComponent from "@/app/basic/map/SceneLayerComponent.vue";
@Component({
  components: { SceneLayerComponent }
})
export default class MapBoard extends Vue {
  private isMapDraggingRight: boolean = false;

  @Prop({ type: String, required: true })
  private sceneId!: string;

  @Prop({ type: Object, default: null })
  private scene!: Scene | null;

  private roomData: RoomData = GameObjectManager.instance.roomData;
  private key = "map-board";
  private sceneLayerList = GameObjectManager.instance.sceneLayerList;
  private sceneAndLayerList = GameObjectManager.instance.sceneAndLayerList;

  private isMounted: boolean = false;

  private get useLayerList() {
    return this.sceneAndLayerList
      .filter(
        mal => mal.data && mal.data.sceneId === this.sceneId && mal.data.isUse
      )
      .map(mal => mal.data!.layerId)
      .map(layerId => this.sceneLayerList.filter(ml => ml.id === layerId)[0])
      .filter(ml => ml);
  }

  @LifeCycle
  private mounted() {
    this.isMounted = true;
    setTimeout(() => {
      this.paint();
    });
  }

  @Watch("isMounted")
  @Watch("scene", { deep: true })
  private onChangeScene() {
    if (!this.isMounted) return;
    this.paint();
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

  private paint(): void {
    if (!this.scene) return;
    const canvasElm: HTMLCanvasElement = document.getElementById(
      "map-canvas"
    ) as HTMLCanvasElement;
    const ctx: CanvasRenderingContext2D = canvasElm!.getContext("2d")!;

    ctx.clearRect(0, 0, this.mapCanvasSize.width, this.mapCanvasSize.height);

    const gridSize = this.scene.gridSize;

    // マス目の描画
    if (this.roomData.isDrawGridLine) {
      ctx.strokeStyle = this.scene.gridColor;
      ctx.globalAlpha = 1;
      for (let c = 0; c <= this.scene.columns; c++) {
        for (let r = 0; r <= this.scene.rows; r++) {
          // 横線
          drawLine(ctx, c * gridSize, r * gridSize, gridSize - 1, 0);
          // 縦線
          drawLine(ctx, c * gridSize, r * gridSize + 1, 0, gridSize - 1);
        }
      }

      // マウス下のマスを強調表示
      ctx.strokeStyle = this.scene.gridColor;
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
    if (this.roomData.isDrawGridId) {
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
    // window.console.log(this.mouseOnCanvasLocate)
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
