export type StoreObj<T> = {
  order: number;
  exclusionOwner: string | null; // 排他制御のオーナー
  data?: T;
  createTime: Date;
  updateTime: Date | null;
};

export type StoreMetaData = {
  id: string | null;
};
