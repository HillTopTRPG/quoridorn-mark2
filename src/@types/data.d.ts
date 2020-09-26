import { Matrix, Point } from "@/@types/store-data-optional";

type TouchModifyRequest<T> = {
  collection: string;
  list: (Partial<StoreData<T>> & { key: string; continuous?: boolean })[];
};
type ReleaseTouchRequest<T> = TouchModifyRequest<T> & {
  list: (Partial<StoreData<T>> & { continuous?: boolean })[];
};
type AddDirectRequest = {
  collection: string;
  list: (Partial<StoreData<any>> & { data: any })[];
};
type DeleteDataRequest<T> = TouchModifyRequest<T>;
type UpdateDataRequest<T> = TouchModifyRequest<T> & {
  list: (Partial<StoreData<T>> & { key: string; continuous?: boolean })[];
};

type DataReference = {
  type: string;
  key: string;
};

type AddObjectInfo = {
  dropWindow: string;
  point: Point;
  matrix: Matrix;
};
