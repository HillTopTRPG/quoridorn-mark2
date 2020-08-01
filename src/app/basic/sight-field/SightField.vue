<template>
  <canvas
    class="sight-filed"
    :style="sightFiledStyle"
    :width="width"
    :height="height"
    ref="canvas"
    @contextmenu.prevent
  ></canvas>
</template>

<script lang="ts">
import { Component } from "vue-mixin-decorator";
import PieceMixin from "../common/mixin/PieceMixin.vue";

@Component
export default class SightField extends PieceMixin<"chit"> {
  // @Getter("getAllObstacle") protected getAllObstacle: any;
  // @Getter("mapColumns") protected mapColumns: any;
  // @Getter("rows") protected rows: any;
  //
  // @Prop({ type: Number, required: true })
  // public distance!: number;
  //
  // @Prop({ type: Number, required: true })
  // public distanceMode!: number;
  //
  // @Prop({ type: Boolean, required: true })
  // public isVision!: boolean;
  //
  // @Prop({ type: String, required: true })
  // public color!: string;
  //
  // @Prop({ type: String, required: true })
  // public borderColor!: string;
  //
  // @Prop({ type: String, required: true })
  // public targetColor!: string;
  //
  // @Prop({ type: Number, default: 1 })
  // public lineWidth!: number;
  //
  // @LifeCycle
  // protected async mounted(): Promise<void> {
  //   await super.mounted();
  //   this.paint();
  // }
  //
  // private paint() {
  //   let canvas: HTMLCanvasElement = this.$refs.canvas as HTMLCanvasElement;
  //   const ctx: CanvasRenderingContext2D = canvas.getContext(
  //     "2d"
  //   ) as CanvasRenderingContext2D;
  //
  //   // ctx.globalAlpha = 0.4
  //   ctx.lineJoin = "round";
  //   // ctx.lineCap = 'round'
  //
  //   const gridSize = AddressCalcMixin.getMapGridSize();
  //   let useDistance = this.distance * gridSize - 1;
  //   ctx.clearRect(0, 0, this.width, this.height);
  //
  //   // TODO use distanceMode
  //
  //   // canvasの中心点
  //   const rect = super.rect;
  //   const center = {
  //     x: rect.left + rect.width / 2,
  //     y: rect.top + rect.height / 2
  //   };
  //   // console.log(`center:(${center.x}, ${center.y})`)
  //
  //   const obstacleList = this.getAllObstacle;
  //
  //   const createCornerFunc = (x: number, y: number): any => ({
  //     x: x,
  //     y: y,
  //     relativeX: x - center.x,
  //     relativeY: y - center.y,
  //     canvasX: x - center.x + this.centerX - 1,
  //     canvasY: y - center.y + this.centerY - 1
  //   });
  //
  //   const checkDistanceFunc = (checkPoints: any[]) => {
  //     let containFlg = false;
  //     checkPoints.forEach(checkPoint => {
  //       if (containFlg) return;
  //       const distance = Math.sqrt(
  //         Math.pow(checkPoint.x - center.x, 2) +
  //           Math.pow(checkPoint.y - center.y, 2)
  //       );
  //       containFlg = distance < useDistance;
  //     });
  //     return containFlg;
  //   };
  //
  //   const infoList: any[] = [];
  //   const arcDistance = useDistance;
  //   const halfDiagonal = Math.sqrt(
  //     Math.pow(this.centerX, 2) + Math.pow(this.centerY, 2)
  //   );
  //   const aList = [
  //     180,
  //     SightField.calcAngle({
  //       relativeX: -this.centerX,
  //       relativeY: this.centerY
  //     }),
  //     90,
  //     SightField.calcAngle({
  //       relativeX: this.centerX,
  //       relativeY: this.centerY
  //     }),
  //     0,
  //     SightField.calcAngle({
  //       relativeX: this.centerX,
  //       relativeY: -this.centerY
  //     }),
  //     -90,
  //     SightField.calcAngle({
  //       relativeX: -this.centerX,
  //       relativeY: -this.centerY
  //     })
  //   ];
  //   obstacleList.forEach((obstacle: any) => {
  //     // 自身は判定対象外
  //     if (obstacle.key === this.objKey) return;
  //
  //     // 情報作ってリストに全部詰める
  //     const info: any = {
  //       key: obstacle.key,
  //       corners: [],
  //       tangentCornerIndex: -1,
  //       angle: {
  //         min: {
  //           angle: 0,
  //           arc: { x: 0, y: 0 },
  //           end: { x: 0, y: 0 },
  //           index: -1,
  //           block: -1
  //         },
  //         middleEndPoints: [],
  //         max: {
  //           angle: 0,
  //           arc: { x: 0, y: 0 },
  //           end: { x: 0, y: 0 },
  //           index: -1,
  //           block: -1
  //         }
  //       }
  //     };
  //
  //     /* ==========
  //      * 基本座標算出
  //      */
  //     const width: number = obstacle.columns * gridSize;
  //     const height: number = obstacle.rows * gridSize;
  //     const left: number = obstacle.left;
  //     const right: number = obstacle.left + width;
  //     const top: number = obstacle.top;
  //     const bottom: number = obstacle.top + height;
  //     // console.log(`rect:${left},${right},${top},${bottom}`)
  //
  //     const obsCenter: any = createCornerFunc(
  //       left + width / 2,
  //       top + height / 2
  //     );
  //     const centerAngle = SightField.calcAngle(obsCenter);
  //     /* ========== */
  //
  //     /* ==========
  //      * 範囲にかぶっているかどうかの判定
  //      */
  //     const checkPoints = [
  //       { x: left, y: top },
  //       { x: obsCenter.x, y: top },
  //       { x: right, y: top },
  //       { x: left, y: obsCenter.y },
  //       { x: right, y: obsCenter.y },
  //       { x: left, y: bottom },
  //       { x: obsCenter.x, y: bottom },
  //       { x: right, y: bottom }
  //     ];
  //     if (!checkDistanceFunc(checkPoints)) return;
  //     /* ========== */
  //
  //     /* ==========
  //      * 障害物の角の座標情報の算出
  //      */
  //     info.corners.push(createCornerFunc(left, top));
  //     info.corners.push(createCornerFunc(left, bottom));
  //     info.corners.push(createCornerFunc(right, top));
  //     info.corners.push(createCornerFunc(right, bottom));
  //     /* ========== */
  //
  //     /* ==========
  //      * 【デバッグ】用 - 座標を塗りつぶし
  //      */
  //     // this.fillArc(ctx, { x: obsCenter.canvasX, y: obsCenter.canvasY }, 5, 'green')
  //     // info.corners.forEach(objCorner => {
  //     //   this.fillArc(ctx, { x: objCorner.canvasX, y: objCorner.canvasY }, 2, 'yellow')
  //     // })
  //     /* ========== */
  //
  //     /* ==========
  //      * 最小角度と最大角度の算出
  //      */
  //     info.angle.min.angle = 360;
  //     info.angle.max.angle = -360;
  //     info.corners.forEach((obsCorner: any, index: number) => {
  //       const cornerAngleDiff = SightField.arrangeAngle(
  //         SightField.calcAngle(obsCorner) - centerAngle
  //       );
  //       if (info.angle.min.angle > cornerAngleDiff) {
  //         info.angle.min.angle = cornerAngleDiff;
  //         info.angle.min.index = index;
  //       }
  //       if (info.angle.max.angle < cornerAngleDiff) {
  //         info.angle.max.angle = cornerAngleDiff;
  //         info.angle.max.index = index;
  //       }
  //     });
  //     info.angle.min.angle = SightField.arrangeAngle(
  //       centerAngle + info.angle.min.angle
  //     );
  //     info.angle.max.angle = SightField.arrangeAngle(
  //       centerAngle + info.angle.max.angle
  //     );
  //     /* ========== */
  //
  //     /* ==========
  //      * 角度の算出用情報
  //      */
  //     const minPI = info.angle.min.angle * (Math.PI / 180);
  //     const maxPI = info.angle.max.angle * (Math.PI / 180);
  //     const cosMin = Math.cos(minPI);
  //     const sinMin = Math.sin(minPI);
  //     const cosMax = Math.cos(maxPI);
  //     const sinMax = Math.sin(maxPI);
  //     /* ========== */
  //
  //     // console.log(`range:(${info.angle.min.index})${info.angle.min.angle}~(${info.angle.max.index})${info.angle.max.angle}`)
  //     info.angle.min.arc.x = this.centerX + arcDistance * cosMin;
  //     info.angle.min.arc.y = this.centerY + arcDistance * sinMin;
  //     info.angle.max.arc.x = this.centerX + arcDistance * cosMax;
  //     info.angle.max.arc.y = this.centerY + arcDistance * sinMax;
  //
  //     info.angle.min.end.x = this.centerX + halfDiagonal * cosMin;
  //     info.angle.min.end.y = this.centerY + halfDiagonal * sinMin;
  //     info.angle.max.end.x = this.centerX + halfDiagonal * cosMax;
  //     info.angle.max.end.y = this.centerY + halfDiagonal * sinMax;
  //
  //     const LT: any = { x: 0, y: 0 };
  //     const RT: any = { x: this.width, y: 0 };
  //     const RB: any = { x: this.width, y: this.height };
  //     const LB: any = { x: 0, y: this.height };
  //
  //     // console.log('LT:', LT.x, LT.y)
  //     // console.log('RT:', RT.x, RT.y)
  //     // console.log('RB:', RB.x, RB.y)
  //     // console.log('LB:', LB.x, LB.y)
  //
  //     /* ==========
  //      * ブロックの算出
  //      */
  //     aList.forEach((a, i) => {
  //       // console.log('a:', a)
  //       const c = (8 - i) * 2;
  //       if (info.angle.min.angle === a) {
  //         info.angle.min.block = c;
  //       } else if (info.angle.min.angle < a) {
  //         info.angle.min.block = c - 1;
  //       }
  //
  //       if (info.angle.max.angle === a) {
  //         info.angle.max.block = c;
  //       } else if (info.angle.max.angle < a) {
  //         info.angle.max.block = c - 1;
  //       }
  //     });
  //     /* ========== */
  //
  //     /* ==========
  //      * 経過終点の算出
  //      */
  //     const baseFuncFunc = (block: any, point: any) => () => {
  //       if (info.angle.min.block === point || info.angle.max.block === point)
  //         return;
  //       if (info.angle.max.block > point) {
  //         if (
  //           info.angle.min.block < point ||
  //           info.angle.max.block < info.angle.min.block ||
  //           SightField.arrangeAngle(
  //             info.angle.max.angle - info.angle.min.angle
  //           ) < 0
  //         ) {
  //           info.angle.middleEndPoints.push(block);
  //         }
  //       } else {
  //         if (
  //           info.angle.max.block < info.angle.min.block &&
  //           SightField.arrangeAngle(
  //             info.angle.max.angle - info.angle.min.angle
  //           ) < 0
  //         ) {
  //           info.angle.middleEndPoints.push(block);
  //         }
  //       }
  //     };
  //     const funcLT = baseFuncFunc(LT, 2);
  //     const funcRT = baseFuncFunc(RT, 6);
  //     const funcRB = baseFuncFunc(RB, 10);
  //     const funcLB = baseFuncFunc(LB, 14);
  //     if (info.angle.min.block < 2 || info.angle.min.block >= 14) {
  //       funcLT(); // 左上の角
  //       funcRT(); // 右上の角
  //       funcRB(); // 右下の角
  //       funcLB(); // 左下の角
  //     } else if (info.angle.min.block < 6) {
  //       funcRT(); // 右上の角
  //       funcRB(); // 右下の角
  //       funcLB(); // 左下の角
  //       funcLT(); // 左上の角
  //     } else if (info.angle.min.block < 10) {
  //       funcRB(); // 右下の角
  //       funcLB(); // 左下の角
  //       funcLT(); // 左上の角
  //       funcRT(); // 右上の角
  //     } else if (info.angle.min.block < 14) {
  //       funcLB(); // 左下の角
  //       funcLT(); // 左上の角
  //       funcRT(); // 右上の角
  //       funcRB(); // 右下の角
  //     }
  //     /* ========== */
  //
  //     /* ==========
  //      * 接角の算出
  //      */
  //     if (info.angle.min.index === 0 && info.angle.max.index === 3) {
  //       info.tangentCornerIndex = 1;
  //     }
  //     if (info.angle.min.index === 1 && info.angle.max.index === 2) {
  //       info.tangentCornerIndex = 3;
  //     }
  //     if (info.angle.min.index === 2 && info.angle.max.index === 1) {
  //       info.tangentCornerIndex = 0;
  //     }
  //     if (info.angle.min.index === 3 && info.angle.max.index === 0) {
  //       info.tangentCornerIndex = 2;
  //     }
  //     /* ========== */
  //
  //     infoList.push(info);
  //   }); // end of 障害物リスト
  //
  //   /* ==========
  //    * 塗りつぶしと枠線
  //    */
  //   this.fillArc(
  //     ctx,
  //     { x: this.centerX, y: this.centerY },
  //     arcDistance,
  //     this.color
  //   );
  //   ctx.beginPath();
  //   ctx.arc(
  //     this.centerX,
  //     this.centerY,
  //     arcDistance - this.lineWidth / 2,
  //     0,
  //     (360 * Math.PI) / 180,
  //     false
  //   );
  //   ctx.strokeStyle = this.borderColor;
  //   ctx.lineWidth = this.lineWidth;
  //   ctx.stroke();
  //   /* ========== */
  //
  //   /* ==========
  //    * 円とターゲットとの間の空間の処理（両サイド）
  //    */
  //   infoList.forEach(info => {
  //     const transParentFunc = (side: string) => {
  //       const corner = info.corners[info.angle[side].index];
  //       const cornerDistance = Math.sqrt(
  //         Math.pow(corner.x - center.x, 2) + Math.pow(corner.y - center.y, 2)
  //       );
  //       if (cornerDistance > useDistance) {
  //         if (info.tangentCornerIndex !== -1) {
  //           const tangentCorner = info.corners[info.tangentCornerIndex];
  //           // 罫線引いて繋げる
  //           ctx.beginPath();
  //           ctx.moveTo(corner.canvasX, corner.canvasY);
  //
  //           let find = false;
  //           infoList.forEach(_info => {
  //             if (find || info.key === _info.key) return;
  //             if (
  //               SightField.arrangeAngle(
  //                 info.angle[side].angle - _info.angle.min.angle
  //               ) > 0 &&
  //               SightField.arrangeAngle(
  //                 _info.angle.max.angle - info.angle[side].angle
  //               ) > 0
  //             ) {
  //               find = true;
  //             }
  //           });
  //           if (find) {
  //             ctx.lineTo(info.angle[side].end.x, info.angle[side].end.y);
  //           } else {
  //             ctx.lineTo(info.angle[side].arc.x, info.angle[side].arc.y);
  //           }
  //
  //           stroke(ctx, this.borderColor, this.lineWidth * 2);
  //           // 背景色で補完してあげる
  //           ctx.beginPath();
  //           ctx.moveTo(this.centerX, this.centerY);
  //           ctx.lineTo(corner.canvasX, corner.canvasY);
  //           ctx.lineTo(tangentCorner.canvasX, tangentCorner.canvasY);
  //           ctx.closePath();
  //           SightField.drawTransparent(ctx, this.color);
  //         }
  //       }
  //     };
  //     transParentFunc("min");
  //     transParentFunc("max");
  //   });
  //   /* ========== */
  //
  //   /* ==========
  //    * 円とターゲットとの間の空間の処理（両サイド）
  //    */
  //   infoList.forEach(info => {
  //     const transParentFunc = (side: string) => {
  //       const corner = info.corners[info.angle[side].index];
  //       const cornerDistance = Math.sqrt(
  //         Math.pow(corner.x - center.x, 2) + Math.pow(corner.y - center.y, 2)
  //       );
  //       if (cornerDistance <= useDistance) {
  //         // 罫線引いて繋げる
  //         ctx.beginPath();
  //         ctx.moveTo(corner.canvasX, corner.canvasY);
  //
  //         let find = false;
  //         infoList.forEach(_info => {
  //           if (find || info.key === _info.key) return;
  //           if (
  //             SightField.arrangeAngle(
  //               info.angle[side].angle - _info.angle.min.angle
  //             ) > 0 &&
  //             SightField.arrangeAngle(
  //               _info.angle.max.angle - info.angle[side].angle
  //             ) > 0
  //           ) {
  //             find = true;
  //           }
  //         });
  //         if (find) {
  //           ctx.lineTo(info.angle[side].end.x, info.angle[side].end.y);
  //         } else {
  //           ctx.lineTo(info.angle[side].arc.x, info.angle[side].arc.y);
  //         }
  //         stroke(ctx, this.borderColor, this.lineWidth * 2);
  //       }
  //     };
  //     transParentFunc("min");
  //     transParentFunc("max");
  //   });
  //   /* ========== */
  //
  //   /* ==========
  //    * 透明で上書き
  //    */
  //   infoList.forEach(info => {
  //     ctx.beginPath();
  //     // 開始角度のターゲットの角
  //     let p = info.corners[info.angle.min.index];
  //     ctx.moveTo(p.canvasX, p.canvasY);
  //     // 開始角度の終点
  //     p = info.angle.min.end;
  //     ctx.lineTo(p.x, p.y);
  //     // ターゲットに隠れたCanvasの角
  //     info.angle.middleEndPoints.forEach((p: any) => {
  //       ctx.lineTo(p.x, p.y);
  //     });
  //     // 終了角度の終点
  //     p = info.angle.max.end;
  //     ctx.lineTo(p.x, p.y);
  //     // 終了角度のターゲットの角
  //     p = info.corners[info.angle.max.index];
  //     ctx.lineTo(p.canvasX, p.canvasY);
  //     // ターゲットの手前の角
  //     if (info.tangentCornerIndex !== -1) {
  //       const tangentCorner = info.corners[info.tangentCornerIndex];
  //       ctx.lineTo(tangentCorner.canvasX, tangentCorner.canvasY);
  //     }
  //     ctx.closePath();
  //     // ctx.fillStyle = 'rgba(0, 255, 0, 0.4)'
  //     // ctx.fill()
  //     SightField.drawTransparent(ctx);
  //   });
  //   /* ========== */
  //
  //   /* ==========
  //    * 各オブジェクトを強調表示
  //    */
  //   infoList.forEach(info => {
  //     ctx.beginPath();
  //     ctx.moveTo(info.corners[0].canvasX, info.corners[0].canvasY);
  //     ctx.lineTo(info.corners[1].canvasX, info.corners[1].canvasY);
  //     ctx.lineTo(info.corners[3].canvasX, info.corners[3].canvasY);
  //     ctx.lineTo(info.corners[2].canvasX, info.corners[2].canvasY);
  //     ctx.closePath();
  //     ctx.fillStyle = this.targetColor;
  //     // ctx.fill()
  //     ctx.strokeStyle = this.borderColor;
  //     ctx.lineWidth = this.lineWidth;
  //     ctx.stroke();
  //   });
  //   /* ========== */
  // }
  // fillArc(
  //   ctx: CanvasRenderingContext2D,
  //   p: any,
  //   d: number,
  //   c: string = this.color
  // ) {
  //   ctx.beginPath();
  //   ctx.arc(p.x, p.y, d, 0, (360 * Math.PI) / 180, false);
  //   ctx.fillStyle = c;
  //   ctx.fill();
  // }
  // private static arrangeAngle(angle: number): number {
  //   if (angle > 180) {
  //     angle -= 360;
  //   }
  //   if (angle < -180) {
  //     angle += 360;
  //   }
  //   return angle;
  // }
  // private static calcAngle(p: any) {
  //   return (Math.atan2(p.relativeY, p.relativeX) * 180) / Math.PI;
  // }
  // private static drawTransparent(
  //   ctx: CanvasRenderingContext2D,
  //   color: string = "rgba(0, 0, 0, 0)"
  // ) {
  //   // 重なり部分をクリアする設定
  //   ctx.globalCompositeOperation = "destination-out";
  //   ctx.fillStyle = "rgba(0, 0, 0, 1)";
  //   ctx.fill();
  //   // 半透明色での塗りつぶし
  //   ctx.globalCompositeOperation = "source-over";
  //   ctx.fillStyle = color;
  //   ctx.fill();
  // }
  //
  // @Watch("getAllObstacle")
  // onChangeGetAllObstacle() {
  //   this.paint();
  // }
  //
  // get sightFiledStyle() {
  //   const transform = `rotateZ(${-SightField.arrangeAngle(
  //     Math.round(this.currentAngle / 30) * 30
  //   )}deg)`;
  //   const rect = super.rect;
  //   return {
  //     top: -this.centerY + rect.height / 2 + "px",
  //     left: -this.centerX + rect.width / 2 + "px",
  //     transform: transform
  //   };
  // }
  // get tableSize(): any {
  //   const marginColumn = AddressCalcMixin.getMapMarginColumn();
  //   const marginRow = AddressCalcMixin.getMapMarginRow();
  //   return {
  //     w: (marginColumn * 2 + this.mapColumns) * marginColumn,
  //     h: (marginRow * 2 + this.rows) * marginRow
  //   };
  // }
  // get centerX(): number {
  //   return this.tableSize.w;
  // }
  // get centerY(): number {
  //   return this.tableSize.h;
  // }
  // get width(): number {
  //   return this.tableSize.w * 2;
  // }
  // get height(): number {
  //   return this.tableSize.h * 2;
  // }
}
</script>

<!-- Add 'scoped' attribute to limit CSS to this component only -->
<style scoped lang="scss">
.sight-filed {
  pointer-events: none;
  position: fixed;
  border: 1px solid red;
}
</style>
