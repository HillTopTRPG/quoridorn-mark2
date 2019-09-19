<template>
  <div
    class="stand-image"
    :style="standImageContainerStyle"
    @click="onClick"
    @contextmenu.prevent
  >
    <canvas
      :width="canvasSize.w"
      :height="canvasSize.h"
      :style="standImageStyle"
      ref="standImage"
    ></canvas>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue, Watch } from "vue-property-decorator";
import { Getter } from "vuex-class";

interface Rectangle {
  x: number;
  y: number;
  w: number;
  h: number;
}

@Component
export default class StandImageComponent extends Vue {
  @Prop({ type: Object, required: true })
  private standImage!: any;

  @Prop({ type: Number, default: 192 })
  private width!: number;

  @Prop({ type: Number, default: 256 })
  private height!: number;

  @Prop({ type: Boolean, default: true })
  private drawDiff!: boolean;

  @Getter("imageList") private imageList: any;

  private baseImageElm: HTMLImageElement | null = null;
  private baseImageReverse: boolean = false;
  private diffImageList: any[] = [];
  private timeList: number[] = [];
  private animationLength: number = 0;

  private timeIndex: number = -1;
  private timer: number = -1; // Timeout ID

  private onMounted: boolean = false;
  private dataSetUpped: boolean = false;

  mounted(): void {
    this.onMounted = true;
    this.onChangeStandImage(this.standImage);
  }

  @Watch("standImage", { deep: true })
  onChangeStandImage(standImage: any) {
    // 稼働中のタイマーはキャンセル
    if (this.timer !== -1) clearTimeout(this.timer);

    if (!standImage) return;

    const imageLoad = (imageKey: string | null, callback: Function) =>
      new Promise((resolve: Function) => {
        let imageData = null;
        if (imageKey) {
          const imageObj = this.imageList.filter(
            (image: any) => image.key === imageKey.replace(":R", "")
          )[0];
          imageData = imageObj ? imageObj.data : null;
        }

        const image = new Image();
        image.onload = () => {
          callback(image);
          resolve();
        };
        image.onerror = () => resolve();
        image.src = imageData;
      });

    const promiseList = [];

    // ベースのロード
    let baseImageElm: HTMLImageElement | null = null;
    const baseImageReverse: boolean = /:R/.test(standImage.base);
    promiseList.push(
      imageLoad(standImage.base, (imageElm: HTMLImageElement) => {
        baseImageElm = imageElm;
      })
    );

    // 差分のロード
    this.diffImageList.splice(0, this.diffImageList.length);
    let diffImageList: any[] = [];
    standImage.diffList.forEach((diff: any, index: number) => {
      const promise = Promise.resolve().then(() => {
        return imageLoad(diff.image, (imageElm: HTMLImageElement) => {
          if (!imageElm) return;
          diffImageList.push({
            index: index,
            image: imageElm,
            isReverse: diff.image ? /:R/.test(diff.image) : false,
            start: diff.time[0],
            end: diff.time[1],
            type: diff.type,
            rec: {
              x: diff.x,
              y: diff.y,
              w: imageElm.naturalWidth,
              h: imageElm.naturalHeight
            }
          });
        });
      });
      promiseList.push(promise);
    });

    Promise.all(promiseList).then(() => {
      diffImageList.sort((diff1, diff2) => {
        if (diff1.index < diff2.index) return -1;
        if (diff1.index > diff2.index) return 1;
        return 0;
      });

      let timeList: number[] = [];
      diffImageList.forEach(diff => {
        // msに変換
        const start = standImage.animationLength * diff.start * 10;
        const end = standImage.animationLength * diff.end * 10;
        if (timeList.indexOf(start) === -1) timeList.push(start);
        if (timeList.indexOf(end) === -1) timeList.push(end);
      });
      timeList.sort((time1, time2) => (time1 < time2 ? -1 : 1));

      this.baseImageElm = baseImageElm;
      this.baseImageReverse = baseImageReverse;
      this.diffImageList = diffImageList;
      this.timeList = timeList;
      this.animationLength = standImage.animationLength;

      this.dataSetUpped = true;
      if (this.onMounted) {
        // 描画開始
        this.startPaint();
      }
    });
  }

  /**
   * 描画を開始する
   */
  private startPaint() {
    this.timeIndex = 0;
    setTimeout(this.paint, 0);
  }

  beforeDestroy() {
    clearTimeout(this.timer);
  }

  private get standImageContainerStyle(): any {
    return {
      width: `${this.width}px`,
      height: `${this.height}px`
    };
  }

  private get standImageStyle(): any {
    const canvasSize: any = this.canvasSize;
    if (canvasSize.w === 0 || canvasSize.h === 0) return {};

    const ratioW: number = this.width / canvasSize.w;
    const ratioH: number = this.height / canvasSize.h;

    const ratio: number = Math.min(ratioW, ratioH);

    const translate: number[] = [0, 0];
    if (ratioW < ratioH) {
      // 横長の場合は下寄せにする
      translate[1] = this.height - canvasSize.h * ratio;
    } else {
      // 縦長の場合は左寄せでいいので何もしない
    }
    const transformList: string[] = [];
    transformList.push(`translate(${translate[0]}px, ${translate[1]}px)`);
    transformList.push(`scale(${ratio}, ${ratio})`);
    return {
      transform: transformList.join(" "),
      transformOrigin: "left top"
    };
  }

  /**
   * 描画する
   */
  paint(this: any): void {
    const time = this.timeList[this.timeIndex];

    const canvasElm: HTMLCanvasElement = this.$refs
      .standImage as HTMLCanvasElement;

    if (canvasElm) {
      const ctx: CanvasRenderingContext2D = canvasElm!.getContext("2d")!;

      ctx.clearRect(0, 0, this.canvasSize.w, this.canvasSize.h);

      const canvasSize = this.canvasSize;
      if (this.baseImageElm) {
        if (this.baseImageReverse) {
          ctx.scale(-1, 1);
          ctx.drawImage(this.baseImageElm, 0, 0, -canvasSize.w, canvasSize.h);
          ctx.scale(-1, 1);
        } else {
          ctx.drawImage(this.baseImageElm, 0, 0, canvasSize.w, canvasSize.h);
        }
      }

      if (this.drawDiff) {
        // 差分の描画
        this.diffImageList.forEach((diff: any) => {
          const start = this.animationLength * diff.start * 10;
          const end = this.animationLength * diff.end * 10;
          const isReverse = diff.isReverse;
          const type = diff.type;
          if (start === 0 && end === this.animationLength * 1000) {
            StandImageComponent.drawTransparent(
              ctx,
              diff.image,
              diff.rec,
              isReverse,
              type
            );
          } else {
            if (
              (start <= time && time < end) ||
              (time === end && end === this.animationLength * 1000)
            ) {
              StandImageComponent.drawTransparent(
                ctx,
                diff.image,
                diff.rec,
                isReverse,
                type
              );
            }
          }
        });
      }
    }

    // 描画タイマー更新
    this.setNextTimer();
  }

  private setNextTimer() {
    if (this.timeList.length === 0) return;

    const lastTime = this.timeList[this.timeIndex];
    this.timeIndex++;

    let nextTime;
    let waitTime;
    if (this.timeIndex < this.timeList.length) {
      nextTime = this.timeList[this.timeIndex];
      waitTime = nextTime - lastTime;
    } else {
      this.timeIndex = 0;
      nextTime = this.timeList[this.timeIndex];
      waitTime = this.animationLength * 1000 - lastTime + nextTime;
    }
    clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.paint();
    }, waitTime);
  }

  @Emit("click")
  onClick() {}

  @Watch("canvasSize", { deep: true })
  @Emit("resize")
  onChangeCanvasSize(canvasSize: any) {}

  private get canvasSize(): any {
    return {
      w: this.baseImageElm ? this.baseImageElm.naturalWidth : 0,
      h: this.baseImageElm ? this.baseImageElm.naturalHeight : 0
    };
  }

  private static drawTransparent(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    rec: Rectangle,
    isReverse: boolean,
    type: number
  ) {
    if (type === 1) {
      // 半透明色での塗りつぶし
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.fillRect(rec.x, rec.y, rec.w, rec.h);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(0, 0, 0, 0)";
      ctx.fillRect(rec.x, rec.y, rec.w, rec.h);
    }
    // 画像の描画
    if (isReverse) {
      ctx.scale(-1, 1);
      ctx.drawImage(image, -rec.x, rec.y, -rec.w, rec.h);
      ctx.scale(-1, 1);
    } else {
      ctx.drawImage(image, rec.x, rec.y, rec.w, rec.h);
    }
  }
}
</script>

<style scoped lang="scss">
.stand-image {
  position: relative;

  canvas {
    background-size: contain;
    position: absolute;
    top: 0;
    left: 0;
  }
}
</style>
