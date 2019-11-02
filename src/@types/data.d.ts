export type TouchRequest = {
  id: string;
  collection: string;
};
export type ReleaseTouchRequest = TouchRequest;

export type CreateDataRequest = TouchRequest & {
  data: any;
};
export type DeleteDataRequest = TouchRequest;
export type UpdateDataRequest = CreateDataRequest;
