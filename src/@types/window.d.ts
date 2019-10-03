import { Anchor, Point, Rectangle, Size } from "@/@types/address";

export type WindowTableColumn = {
  width: number;
  type: string;
  title: string;
  target: string;
};

export type WindowTableDeclareInfo = {
  readonly isColumnVariableLength: boolean;
  readonly isFixTotalWidth: boolean;
  readonly columnList: WindowTableColumn[];
};

export type WindowDeclareInfo = {
  readonly parentTypeList: string[];
  readonly title: string;
  readonly message: string;
  readonly position: Point | Anchor;
  readonly size: Size;
  readonly minSize?: Size;
  readonly maxSize?: Size;
  readonly closable: boolean;
  readonly fontSizePickable: boolean;
  readonly resizable: boolean;
  readonly tableInfoList: WindowTableDeclareInfo[];
};

export type WindowMoveInfo = {
  mouse: Point;
  windowKey: string;
};

export type PaneMoveInfo = {
  point: Point;
  windowKey: string;
};

export type WindowOpenInfo<T> = {
  type: string;
  key: string;
  args?: T;
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

export interface WindowInfo<T> extends Rectangle, WindowTaskInfo {
  readonly key: string;
  readonly title: string;
  status: WindowStatus;
  message: string;
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
