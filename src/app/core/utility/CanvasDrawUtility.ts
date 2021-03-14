import { Anchor } from "address";

export function drawLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y + height);
  ctx.stroke();
}

export function fillTexts(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontStyle: string = "normal",
  fontSize: number = 24,
  anchor: Anchor = "center"
) {
  // 1行ずつ描画
  const lineHeight = 1.1618; // 行の高さ (フォントサイズに対する倍率)
  ctx.font = `${fontStyle} ${fontSize}px Arial, meiryo, sans-serif`;
  const lines = text.split("\n");
  const lineSizeList = lines.map(l => ctx.measureText(l));
  const isTop = anchor.endsWith("top");
  const isBottom = anchor.endsWith("bottom");
  const isLeft = anchor.startsWith("left");
  const isRight = anchor.startsWith("right");
  lines.forEach((line, i) => {
    let useX = x;
    let useY = y;
    if (isTop) {
      useY = y + fontSize * (lineHeight * i + 1);
    } else if (isBottom) {
      useY = y - fontSize * (lineHeight * (lines.length - i) - 1);
    } else {
      useY = y + fontSize * (lineHeight * (i - lines.length / 2) + 1);
    }
    if (isLeft) {
      useX = x;
    } else if (isRight) {
      useX = x - lineSizeList[i].width;
    } else {
      useX = x - lineSizeList[i].width / 2;
    }
    ctx.fillText(line, useX, useY);
  });
}

export function drawLine2(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

export function stroke(
  this: any,
  ctx: CanvasRenderingContext2D,
  c: string = this.color,
  width: number = 1
) {
  const oldLineWidth = ctx.lineWidth;
  const oldStrokeStyle = ctx.strokeStyle;
  ctx.strokeStyle = c;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.lineWidth = oldLineWidth;
  ctx.strokeStyle = oldStrokeStyle;
}

export function strokeArc(
  ctx: CanvasRenderingContext2D,
  p: any,
  d: any,
  c: string,
  width: number = 1,
  sA: number = 0,
  eA: number = 360
) {
  ctx.beginPath();
  ctx.arc(p.x, p.y, d, (sA * Math.PI) / 180, (eA * Math.PI) / 180, false);
  stroke(ctx, c, width);
}
