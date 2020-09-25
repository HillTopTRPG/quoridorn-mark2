import { Matrix, Point } from "address";
import { StoreObj } from "./store";

export type TouchModifyRequest<T> = {
  collection: string;
  list: (Partial<StoreObj<T>> & { key: string; continuous?: boolean })[];
};
export type ReleaseTouchRequest<T> = TouchModifyRequest<T> & {
  list: (Partial<StoreObj<T>> & { continuous?: boolean })[];
};
export type AddDirectRequest = {
  collection: string;
  list: (Partial<StoreObj<any>> & { data: any })[];
};
export type DeleteDataRequest<T> = TouchModifyRequest<T>;
export type UpdateDataRequest<T> = TouchModifyRequest<T> & {
  list: (Partial<StoreObj<T>> & { key: string; continuous?: boolean })[];
};

export type DataReference = {
  type: string;
  key: string;
};

export type AddObjectInfo = {
  dropWindow: string;
  point: Point;
  matrix: Matrix;
};
