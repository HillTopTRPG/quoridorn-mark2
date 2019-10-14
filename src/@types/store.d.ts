export type StoreObj<T> = {
  order: number;
  exclusionOwner: string | null; // 排他制御のオーナー
  data?: T;
};

export type StoreMetaData = {
  id: string | null;
  createTime: Date | null;
  updateTime: Date | null;
};
