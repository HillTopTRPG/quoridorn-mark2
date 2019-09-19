import { Anchor, Point, Rectangle, Size } from "@/@types/address";

export type WindowTableDeclareInfo = {
  readonly isColumnVariableLength: boolean;
  readonly isFixTotalWidth: boolean;
  readonly initColumnWidthList: number[];
};

export type WindowDeclareContentsInfo = {
  readonly parentTypeList: string[];
  readonly minSize?: Size;
  readonly maxSize?: Size;
  readonly fixSize?: Size;
  readonly defaultPosition: Point | Anchor;
  readonly tableDeclareInfoList: WindowTableDeclareInfo[];
};

export type WindowDeclareInfo = {
  [type in string]: WindowDeclareContentsInfo;
};

export type WindowTableInfo = {
  selectLineKey: string | null;
  hoverLineIndex: number | null;
  operateDividerIndex: number | null;
};

export interface WindowInfo extends Rectangle {
  readonly type: string;
  readonly declare: WindowDeclareContentsInfo;
  readonly key: string;
  readonly parentKey: string;
  order: number;
  isLocked: boolean;
  isMinimized: boolean;
  readonly tableInfoList: WindowTableInfo[];
}
