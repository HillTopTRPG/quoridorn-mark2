type SyncObj = {
  key: string;
  name: string;
  processTime: number;
  owner: string;
};

type SyncObjList<T extends SyncObj> = {
  list: T[];
  nextKey: number;
};
