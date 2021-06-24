import { Anchor } from "address";
import { getCssPxNum } from "../css/Css";
import { WindowSize } from "@/@types/window";
import WindowManager from "../window/WindowManager";
import {
  Address,
  Line,
  Matrix,
  Point,
  Rectangle,
  Size
} from "@/@types/store-data-optional";

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

export function createMatrix(column: number, row: number): Matrix {
  return { column, row };
}

export function createAddress(
  x: number,
  y: number,
  column: number,
  row: number
): Address {
  return {
    ...createPoint(x, y),
    ...createMatrix(column, row)
  };
}

export function copyAddress(from: Address, to: Address) {
  to.x = from.x;
  to.y = from.y;
  to.column = from.column;
  to.row = from.row;
}

export function getWindowSize(s: WindowSize, elm?: HTMLElement): Size {
  const scrollBarWidth = getCssPxNum("--scroll-bar-width");
  const rootFontSize = getCssPxNum("font-size");
  const elmFontSize = elm ? getCssPxNum("font-size", elm) : 12;
  const getEmSize = (n: number) => n * elmFontSize;
  const getRemSize = (n: number) => n * rootFontSize;
  return {
    width:
      s.widthPx +
      getEmSize(s.widthEm) +
      getRemSize(s.widthRem) +
      scrollBarWidth * s.widthScrollBar,
    height:
      s.heightPx +
      getEmSize(s.heightEm) +
      getRemSize(s.heightRem) +
      scrollBarWidth * s.heightScrollBar
  };
}

export function isContain(r: Rectangle, p: Point) {
  if (!r || !p) return false;
  if (p.x < r.x) return false;
  if (p.x > r.x + r.width) return false;
  if (p.y < r.y) return false;
  return p.y <= r.y + r.height;
}

function p2s(p: Point): string {
  const x = Math.floor(p.x);
  const y = Math.floor(p.y);
  return `r(${x}, ${y})`;
}

function m2s(m: Matrix): string {
  const r = m.row;
  const c = m.column;
  return `m(r: ${r}, c: ${c})`;
}

function s2s(s: Size): string {
  const w = Math.floor(s.width);
  const h = Math.floor(s.height);
  return `s(${w}, ${h})`;
}

function r2s(r: Rectangle): string {
  const x = Math.floor(r.x);
  const y = Math.floor(r.y);
  const w = Math.floor(r.width);
  const h = Math.floor(r.height);
  return `r(${x}, ${y}, ${w}, ${h})`;
}

function a2s(a: Address): string {
  const ps = p2s(a);
  const ms = m2s(a);
  return `a(${ps}, ${ms})`;
}

export function c2s(v: Point | Rectangle | Size | Address): string {
  if (!v) return "Nothing.";
  if ("width" in v) return "x" in v ? r2s(v) : s2s(v);
  return "row" in v ? a2s(v) : p2s(v);
}

export function getQuerySelectorRectangle(query: string): Rectangle | null {
  const elm = document.querySelector(query) as HTMLElement;
  return elm ? (elm.getBoundingClientRect() as Rectangle) : null;
}

export function getWindowRectangle(windowKey: string): Rectangle | null {
  return getQuerySelectorRectangle(`#${windowKey}`);
}

export function getEventPoint(event: MouseEvent | TouchEvent): Point {
  return "touches" in event
    ? createPoint(event.changedTouches[0].pageX, event.changedTouches[0].pageY)
    : createPoint(event.pageX, event.pageY);
}

export function calcStrWidth(element: HTMLElement, str: string) {
  const spanElm = document.createElement("span");
  spanElm.innerHTML = str;
  spanElm.style.whiteSpace = "nowrap";
  spanElm.style.visibility = "hidden";
  element.appendChild(spanElm);
  const width = spanElm.offsetWidth;
  element.removeChild(spanElm);
  return width;
}

export function getPaneHeight(windowKey: string): number {
  const windowInfo = WindowManager.instance.getWindowInfo(windowKey);
  const windowTitleHeight = getCssPxNum("--window-title-height");

  // ペインに表示されている要素の高さを取得、あれば返却
  let paneRectangle: Rectangle | null = null;
  if (windowInfo.status.startsWith("window-")) return windowTitleHeight;
  if (windowInfo.status.indexOf("right") > -1) {
    paneRectangle = getQuerySelectorRectangle(`#right-pane-${windowKey}`);
  }
  if (windowInfo.status.indexOf("left") > -1) {
    paneRectangle = getQuerySelectorRectangle(`#left-pane-${windowKey}`);
  }
  if (paneRectangle) {
    return paneRectangle.height;
  }

  // // 子画面のコンテンツ高さとタイトル高さの合計を算出
  // const windowContents = document.querySelector(
  //   `#${windowKey} ._contents *`
  // ) as HTMLElement;
  // if (windowContents) {
  //   const windowContentsHeight = getCssPxNum("height", windowContents);
  //   return windowContentsHeight + windowTitleHeight + windowPadding * 2;
  // }
  return 0;
  // throw new ApplicationError("ありえない分岐");
}

export function getPageSize(): Size {
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

  const point: Point = createPoint(0, 0);
  const sceneSize = getPageSize();
  const sceneCenter = calcCenter({
    ...createPoint(0, menuHeight),
    width: sceneSize.width,
    height: sceneSize.height - menuHeight
  });

  if (position === "center") {
    point.x = (sceneSize.width * 3) / 10;
    point.y = (sceneSize.height * 3) / 10;
  } else {
    const windowTitleHeight = getCssPxNum("--window-title-height");
    const windowPadding = getCssPxNum("--window-padding");
    const scrollBarWidth = getCssPxNum("--scroll-bar-width");
    const [h, v] = position.toString().split("-");
    if (h === "left") point.x = 0;
    if (h === "center") point.x = (sceneSize.width * 3) / 10;
    if (h === "right")
      point.x =
        sceneSize.width -
        windowSize.width -
        // windowPadding * 2 -
        scrollBarWidth -
        2;
    if (v === "top") point.y = menuHeight;
    if (v === "center") point.y = (sceneSize.height * 3) / 10;
    if (v === "bottom")
      point.y =
        sceneSize.height -
        windowSize.height -
        windowPadding * 2 -
        windowTitleHeight;
  }

  return point;
}

export function getRightPaneRectangle(): Rectangle {
  const appElm = document.querySelector("#app") as HTMLDivElement;
  const top = getCssPxNum("--menu-bar-height", appElm);
  const width = getCssPxNum("--right-pane-width", appElm);
  const bottom = getCssPxNum("--window-title-height", appElm);
  const scrollBarWidth = getCssPxNum("--scroll-bar-width");
  const windowPadding = getCssPxNum("--window-padding");
  const windowSize = createSize(window.innerWidth, window.innerHeight);
  return createRectangle(
    windowSize.width - width - scrollBarWidth - windowPadding * 2,
    top,
    width + scrollBarWidth + windowPadding * 2,
    windowSize.height - top - bottom
  );
}

export function getCrossLines(
  lineList1: Line[],
  lineList2: Line[] | null = null
): Point[] {
  return (lineList1
    .flatMap(l1 => (lineList2 || lineList1).map(l2 => getCrossPoint(l1, l2)))
    .filter(
      (p, idx, self) =>
        p && self.findIndex(s => s && s.x === p.x && s.y === p.y) === idx
    ) as Point[]).sort((p1, p2) => {
    if (p1.y < p2.y) return -1;
    if (p1.y > p2.y) return 1;
    if (p1.x < p2.x) return -1;
    if (p1.x > p2.x) return 1;
    return 0;
  });
}

export function getCrossPoint(l1: Line, l2: Line): Point | null {
  const a0 =
    ((l2.p2.x - l2.p1.x) * (l1.p1.y - l2.p1.y) -
      (l2.p2.y - l2.p1.y) * (l1.p1.x - l2.p1.x)) *
    0.5;
  const a1 =
    ((l2.p2.x - l2.p1.x) * (l2.p1.y - l1.p2.y) -
      (l2.p2.y - l2.p1.y) * (l2.p1.x - l1.p2.x)) *
    0.5;

  const x = l1.p1.x + (l1.p2.x - l1.p1.x) * (a0 / (a0 + a1));
  const y = l1.p1.y + (l1.p2.y - l1.p1.y) * (a0 / (a0 + a1));
  const result: Point = { x, y };

  const maxJudge = (line: Line, prop: keyof Point) =>
    result[prop] <= Math.max(line.p1[prop], line.p2[prop]);
  const minJudge = (line: Line, prop: keyof Point) =>
    result[prop] >= Math.min(line.p1[prop], line.p2[prop]);
  const flag =
    Number.isFinite(result.x) &&
    Number.isFinite(result.y) &&
    !Number.isNaN(result.x) &&
    !Number.isNaN(result.y) &&
    maxJudge(l1, "x") &&
    minJudge(l1, "x") &&
    maxJudge(l2, "x") &&
    minJudge(l2, "x") &&
    maxJudge(l1, "y") &&
    minJudge(l1, "y") &&
    maxJudge(l2, "y") &&
    minJudge(l2, "y");

  // console.log(JSON.stringify(l1), JSON.stringify(l2), flag, x, y);

  return flag ? result : null;
}

export function getHalfPoint(p1: Point, p2: Point): Point {
  return createPoint((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
}
