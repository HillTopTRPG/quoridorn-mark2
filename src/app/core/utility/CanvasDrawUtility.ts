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
