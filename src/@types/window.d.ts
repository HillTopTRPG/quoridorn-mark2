import { Anchor, Point, Rectangle } from "address";

export type WindowSize = {
  widthEm: number;
  widthRem: number;
  widthPx: number;
  widthScrollBar: number;
  heightEm: number;
  heightRem: number;
  heightPx: number;
  heightScrollBar: number;
};

export type WindowTableColumn = {
  width: number;
  type: string;
  align: "left" | "center" | "right";
  target: string;
};

export type WindowTableDeclareInfo = {
  readonly type: "free" | "fix-on-side" | "fix-on-right";
  height?: number;
  readonly classificationProp: string;
  readonly classificationType: "string" | "range";
  readonly classificationOrdinal?: number;
  readonly columnList: WindowTableColumn[];
};

export type WindowDeclareInfo = {
  readonly icon: string;
  readonly parentTypeList: string[];
  readonly isInputWindow: boolean;
  readonly isMovingRendering: boolean;
  readonly message: string;
  readonly position: Point | Anchor;
  readonly size: WindowSize;
  readonly minSize?: WindowSize;
  readonly maxSize?: WindowSize;
  readonly closable: boolean;
  readonly minimizable: boolean;
  readonly paneContainable: boolean;
  readonly fontSizePickable: boolean;
  readonly resizable: boolean;
  readonly tableInfoList: WindowTableDeclareInfo[];
};

export type WindowMoveInfo = {
  point: Point;
  windowKey: string;
};

export type PaneMoveInfo = {
  point: Point;
  windowKey: string;
};

export type WindowOpenInfo<T> = {
  type: string;
  args?: T;
  key?: string;
};

export type WindowResizeInfo = {
  key: string;
  status: string;
};

export type WindowTableInfo = {
  selectLineKey: string | null;
  hoverLineIndex: number | null;
  operateDividerIndex: number | null;
  columnWidthList: number[];
};

export interface WindowTaskInfo {
  readonly type: string;
  readonly declare: WindowDeclareInfo;
  readonly parentKey?: string;
}

export type TaskInfo = {
  taskKey?: string;
};

type WindowStatus =
  | "left-pane"
  | "left-pane-moving"
  | "left-pane-window"
  | "window-left-pane"
  | "window"
  | "window-right-pane"
  | "right-pane-window"
  | "right-pane"
  | "right-pane-moving";

export interface WindowInfo<T>
  extends Point,
    WindowSize,
    WindowTaskInfo,
    TaskInfo {
  readonly key: string;
  title: string;
  status: WindowStatus;
  message: string;
  diffRect: Rectangle;
  args?: T;
  order: number;
  paneY: number;
  paneOrder: number;
  isLocked: boolean;
  isMinimized: boolean;
  minimizeIndex: number;
  isMinimizeAnimationEnd: boolean;
  readonly tableInfoList: WindowTableInfo[];
}

export type TabInfo = {
  key: string;
  text: string;
  target:
    | string
    | {
        from: number;
        to: number;
      };
};

export type HtmlOptionInfo = {
  value: string | null;
  text: string;
  key: string | null;
  disabled: boolean;
};
