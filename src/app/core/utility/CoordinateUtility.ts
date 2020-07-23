import { Address, Anchor, Matrix, Point, Rectangle, Size } from "address";
import { getCssPxNum } from "../css/Css";
import { WindowSize } from "../../../@types/window";
import WindowManager from "../window/WindowManager";

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

  let point: Point = createPoint(0, 0);
  const sceneSize = getPageSize();
  const sceneCenter = calcCenter({
    ...createPoint(0, menuHeight),
    width: sceneSize.width,
    height: sceneSize.height - menuHeight
  });
  const windowCenter = calcCenter({
    ...createPoint(0, menuHeight),
    ...windowSize
  });

  if (position === "center") {
    point.x = sceneCenter.x - windowCenter.x;
    point.y = sceneCenter.y - windowCenter.y;
  } else {
    const windowTitleHeight = getCssPxNum("--window-title-height");
    const windowPadding = getCssPxNum("--window-padding");
    const scrollBarWidth = getCssPxNum("--scroll-bar-width");
    const [h, v] = position.toString().split("-");
    if (h === "left") point.x = 0;
    if (h === "center") point.x = sceneCenter.x - windowCenter.x;
    if (h === "right")
      point.x =
        sceneSize.width -
        windowSize.width -
        windowPadding * 2 -
        scrollBarWidth -
        2;
    if (v === "top") point.y = menuHeight;
    if (v === "center") point.y = sceneCenter.y - windowCenter.y;
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
