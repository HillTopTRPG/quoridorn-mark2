import { Anchor, Point, Rectangle, Size } from "@/@types/address";

export function createPoint(x: number, y: number): Point {
  return { x, y };
}

export function createSize(width: number, height: number): Size {
  return { width, height };
}

export function createRectangle(
  x: number,
  y: number,
  width: number,
  height: number
): Rectangle {
  return {
    ...createPoint(x, y),
    ...createSize(width, height)
  };
}

export function ps(p: Point): string {
  return `(${Math.floor(p.x)}, ${Math.floor(p.y)})`;
}

export function getWindowSize(): Size {
  return createSize(window.innerWidth, window.innerHeight);
}

export function arrangeAngle(angle: number): number {
  if (angle > 180) angle -= 360;
  if (angle < -180) angle += 360;
  return angle;
}

export function calcCenter(rect: Rectangle): Point {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2
  };
}

export function calcAngle(p1: Point, p2: Point): number {
  return (Math.atan2(p1.y - p2.y, p1.x - p2.x) * 180) / Math.PI;
}

export function calcDistance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

export function calcWindowPosition(
  position: Point | Anchor,
  windowSize: Size,
  menuHeight: number
): Point {
  if (typeof position !== "string") return position;

  let point: Point = createPoint(0, 0);
  const screenSize = getWindowSize();
  const screenCenter = calcCenter({
    ...createPoint(0, menuHeight),
    width: screenSize.width,
    height: screenSize.height - menuHeight
  });
  const windowCenter = calcCenter({
    ...createPoint(0, 0),
    ...windowSize
  });

  if (position === "center") {
    point.x = screenCenter.x - windowCenter.x;
    point.y = screenCenter.y - windowCenter.y;
  } else {
    const [h, v] = position.toString().split("-");
    if (h === "left") point.x = 0;
    if (h === "center") point.x = screenCenter.x - windowCenter.x;
    if (h === "right") point.x = screenSize.width - windowSize.width;
    if (v === "top") point.y = menuHeight;
    if (v === "center") point.y = screenCenter.y - windowCenter.y;
    if (v === "bottom") point.y = screenSize.height - windowSize.height;
  }

  return point;
}
