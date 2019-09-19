import { CompareInfo } from "@/@types/compare";
import { Point } from "@/@types/address";

export interface ContextTaskInfo extends Point {
  type: string;
  target: string | null;
}

export type ContextItemDeclareInfo = {
  emitName?: string;
  text?: string;
  isViewCompare?: CompareInfo;
  children?: ContextItemDeclareInfo[];
};

export type ContextDeclareInfo = {
  [type in string]: ContextItemDeclareInfo[];
};
