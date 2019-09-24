import { Point, Rectangle } from "@/@types/address";

export function createPoint(x: number, y: number): Point {
  return { x, y };
}

export function createRectangle(
  x: number,
  y: number,
  width: number,
  height: number
): Rectangle {
  return {
    ...createPoint(x, y),
    width,
    height
  };
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
