import { Anchor, Point, Rectangle, Size } from "@/@types/address";

export type WindowTableDeclareInfo = {
  readonly isColumnVariableLength: boolean;
  readonly isFixTotalWidth: boolean;
  readonly initColumnWidthList: number[];
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

export type WindowDeclareContentsInfo = {
  [type in string]: WindowDeclareInfo;
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

export interface WindowInfo extends Rectangle, WindowTaskInfo {
  readonly key: string;
  readonly title: string;
  message: string;
  order: number;
  isLocked: boolean;
  isMinimized: boolean;
  minimizeIndex: number;
  isMinimizeAnimationEnd: boolean;
  readonly tableInfoList: WindowTableInfo[];
}
