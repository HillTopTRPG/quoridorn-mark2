export type TouchRequest = {
  collection: string;
};
export type TouchModifyRequest = TouchRequest & {
  id: string;
};
export type ReleaseTouchRequest = TouchModifyRequest;

export type CreateDataRequest = TouchModifyRequest & {
  data: any;
};
export type DeleteDataRequest = TouchModifyRequest;
export type UpdateDataRequest = CreateDataRequest;
