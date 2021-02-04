import { Anchor } from "address";
import { Point, Rectangle } from "@/@types/store-data-optional";

type WindowSize = {
  widthEm: number;
  widthRem: number;
  widthPx: number;
  widthScrollBar: number;
  heightEm: number;
  heightRem: number;
  heightPx: number;
  heightScrollBar: number;
};

type WindowTableColumn = {
  width: number;
  type: string;
  align: "left" | "center" | "right";
  target: string;
};

type WindowTableDeclareInfo = {
  readonly type: "free" | "fix-on-side" | "fix-on-right";
  height?: number;
  readonly classificationProp: string;
  readonly classificationType: "string" | "range";
  readonly classificationOrdinal?: number;
  readonly columnList: WindowTableColumn[];
};

type WindowDeclareInfo = {
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

type WindowMoveInfo = {
  point: Point;
  windowKey: string;
};

type PaneMoveInfo = {
  point: Point;
  windowKey: string;
};

type WindowOpenInfo<T> = {
  type: string;
  args?: T;
  key?: string;
};

type WindowResizeInfo = {
  key: string;
  status: string;
};

type WindowTableInfo = {
  selectLineKey: string | null;
  hoverLineIndex: number | null;
  operateDividerIndex: number | null;
  columnWidthList: number[];
};

interface WindowTaskInfo {
  readonly type: string;
  readonly declare: WindowDeclareInfo;
  readonly parentKey?: string;
}

type TaskInfo = {
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

interface WindowInfo<T> extends Point, WindowSize, WindowTaskInfo, TaskInfo {
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

type TabInfo = {
  key: string;
  text: string;
  isDisabled: boolean;
  color?: string;
  target:
    | string
    | {
        from: number;
        to: number;
      };
};

type HtmlOptionInfo = {
  value: string | null;
  text: string;
  key: string | null;
  disabled: boolean;
};
