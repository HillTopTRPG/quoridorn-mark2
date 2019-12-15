import { CompareInfo } from "@/@types/compare";
import { Point } from "@/@types/address";

export interface ContextTaskInfo extends Point {
  type: string;
  target: string | null;
}

// 項目(表示条件ありなし)
export type ContextTextItem<T> = {
  taskName?: string;
  text: string;
  taskArg: T;
  isViewCompare?: CompareInfo;
  children?: ContextItemDeclareInfo[];
};

// 区切り線(表示条件あり)
export type ContextHrItem = {
  isViewCompare: CompareInfo;
};

export type ContextItemDeclareInfo =
  | ContextTextItem<any>
  | ContextHrItem
  | null;

export type ContextDeclareInfo = {
  [type in string]: ContextItemDeclareInfo[];
};
