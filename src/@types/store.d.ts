export type StoreObj<T> = {
  order: number;
  exclusionOwner: string | null; // 排他制御のオーナー
  data?: T;
  createTime: Date;
  updateTime: Date | null;
};

type StoreMetaData = {
  id: string | null;
};

export type StoreUseData<T> = StoreObj<T> & StoreMetaData;
