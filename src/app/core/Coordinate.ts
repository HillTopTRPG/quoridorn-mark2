import { Anchor, Point, Rectangle, Size } from "@/@types/address";
import { WindowInfo } from "@/@types/window";
import WindowManager from "@/app/core/window/WindowManager";
import { getCssPxNum } from "@/app/core/Css";
import { ApplicationError } from "@/app/core/error/ApplicationError";

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

export function isContain(r: Rectangle, p: Point) {
  if (!r || !p) return false;
  if (p.x < r.x) return false;
  if (p.x > r.x + r.width) return false;
  if (p.y < r.y) return false;
  return p.y <= r.y + r.height;
}

export function ps(p: Point): string {
  return `(${Math.floor(p.x)}, ${Math.floor(p.y)})`;
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
  throw new ApplicationError("ありえない分岐");
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
  const screenSize = getPageSize();
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

export function getRightPaneRectangle(): Rectangle {
  const appElm = document.querySelector("#app") as HTMLDivElement;
  const top = getCssPxNum("--menu-bar-height", appElm);
  const width = getCssPxNum("--right-pane-width", appElm);
  const bottom = getCssPxNum("--window-title-height", appElm);
  const scrollBarWidth = getCssPxNum("--scroll-bar-width");
  const windowSize = createSize(window.innerWidth, window.innerHeight);
  return createRectangle(
    windowSize.width - width - scrollBarWidth,
    top,
    width,
    windowSize.height - top - bottom
  );
}
