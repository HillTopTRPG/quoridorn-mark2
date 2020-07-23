import { Point } from "address";
import { createPoint } from "../utility/CoordinateUtility";

/**
 * ２点間の距離を算出する
 * @param p1
 * @param p2
 */
export function getDistance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 始点と終点とを結んだ線分の角度を正の値の射出角度として算出する
 * @param start
 * @param end
 */
function calcInjectionRad(start: Point, end: Point) {
  const inputRad = Math.PI - calcRadius(end, start);
  const rad = start.x < end.x ? inputRad : Math.PI - inputRad;
  return rad > Math.PI / 2 ? rad - Math.PI * 2 : rad;
}

/**
 * ２点を結んだ線分の角度を算出する
 * @param p1
 * @param p2
 */
function calcRadius(p1: Point, p2: Point) {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

export function deg2rad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function rad2deg(rad: number) {
  return (rad * 180) / Math.PI;
}

/**
 * 終点と終点を起点とする角度から始点を算出する
 * @param end
 * @param inputRad
 */
export function calcStartPoint(end: Point, inputRad: number): Point {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // 左下の角と終点との角度
  const r1 = -Math.PI / 2 - calcRadius(createPoint(0, height), end);
  // 右下の角と終点との角度
  const r2 = -Math.PI / 2 - calcRadius(createPoint(width, height), end);

  // 始点は画面の下辺のどこか
  if (r1 < inputRad && inputRad < r2)
    return createPoint(end.x + end.y * Math.tan(inputRad), height);

  // 始点は画面の左辺か右辺のどこか
  const xDiff = Math.tan(Math.PI / 2 - inputRad) * end.x;
  return inputRad < 0
    ? createPoint(0, end.y - xDiff)
    : createPoint(width, end.y + xDiff);
}

/**
 * 放物線の軌跡を算出する
 * @param radius
 * @param ratio
 * @param splitNum
 */
export function calcParabola(
  radius: number,
  ratio: number,
  splitNum: number = 20
): { points: Point[]; distanceRatio: number } {
  const momentLocus: Point[] = [];

  const w = window.innerWidth;
  const h = window.innerHeight;
  const ep = createPoint(w / 2, h / 2);
  const sp = calcStartPoint(ep, radius);

  const lLineRad = calcInjectionRad(sp, ep);
  const injectionRad = Math.min(
    ((Math.PI / 2 - lLineRad) * 4 * ratio) / 5 + lLineRad,
    deg2rad(85)
  );

  const xr = ep.x - sp.x;
  for (let x = 0, i = 0; i <= splitNum; x += Math.abs(xr) / splitNum, i++) {
    const y = getY(sp, ep, x, injectionRad);
    const p = createPoint(sp.x + (sp.x < ep.x ? x : -x), sp.y - y);
    momentLocus.push(p);
  }
  return {
    points: momentLocus,
    distanceRatio: getDistance(sp, ep) / getDistance(createPoint(0, 0), ep)
  };
}

/**
 * 放物線の式にX座標を代入することでY座標を算出する
 * @param sp 始点
 * @param ep 終点
 * @param x 求める座標のX
 * @param injectionRad 射出角度
 */
function getY(sp: Point, ep: Point, x: number, injectionRad: number): number {
  const xr = Math.abs(ep.x - sp.x);
  const yr = sp.y - ep.y;
  const tanT = Math.tan(injectionRad);
  return ((yr - xr * tanT) / (xr * xr)) * x * x + tanT * x;
}

/**
 * 終点を起点としたマウス座標から、入力角度を-90度 ~ 90度の範囲で算出する
 * @param mouse
 * @param end
 * @param degBlur
 */
export function calcInputRad(
  mouse: Point,
  end: Point,
  degBlur: number = 15
): number {
  const rad = calcRadius(mouse, end);
  const deg = rad2deg(rad);
  const radBlur = deg2rad(degBlur);

  // 始点は禁止範囲(上)のどこか
  if (mouse.y < end.y) return (Math.sign(mouse.x - end.x) * Math.PI) / 2;

  // 始点は禁止範囲(下)のどこか
  if (-90 - degBlur < deg && deg < -90 + degBlur)
    return Math.sign(mouse.x - end.x) * radBlur;

  // 始点は許可範囲
  return -rad - Math.PI / 2;
}
