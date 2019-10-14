type SyncObj = {
  key: string;
  name: string;
  updateTime: number;
  owner: string;
};

type SyncObjList<T extends SyncObj> = {
  list: T[];
  nextKey: number;
};
