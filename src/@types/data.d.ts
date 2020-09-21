import { Matrix, Point } from "address";
import { StoreObj } from "./store";

export type TouchModifyRequest = {
  collection: string;
  idList: string[];
  optionList?: Partial<StoreObj<unknown>>[];
};
export type ReleaseTouchRequest = TouchModifyRequest & {
  optionList?: (Partial<StoreObj<unknown>> & { continuous?: boolean })[];
};
export type AddDirectRequest = {
  collection: string;
  dataList: any[];
  optionList?: Partial<StoreObj<unknown>>[];
};
export type DeleteDataRequest = TouchModifyRequest;
export type UpdateDataRequest = TouchModifyRequest & {
  dataList: any[];
  optionList?: (Partial<StoreObj<unknown>> & { continuous?: boolean })[];
};

export type DataReference = {
  type: string;
  docId: string;
};

export type AddObjectInfo = {
  dropWindow: string;
  point: Point;
  matrix: Matrix;
};
