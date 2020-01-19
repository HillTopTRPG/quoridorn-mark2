export type StoreObj<T> = {
  order: number;
  exclusionOwner: string | null; // 排他制御のオーナー
  owner: string | null; // 部屋データに含まれるデータのオーナー。部屋データにはオーナーは存在しない
  data?: T;
  permission: Permission | null; // 通常はnullではない
  status:
    | "initial-touched"
    | "added"
    | "modify-touched"
    | "touched-released"
    | "modified"
    | null;
  createTime: Date;
  updateTime: Date | null;
};

type StoreMetaData = {
  id: string | null;
};

export type StoreUseData<T> = StoreObj<T> & StoreMetaData;

export type PermissionNodeType = "group" | "user" | "character" | "owner";
export type PermissionNode = {
  type: PermissionNodeType;
  id?: string;
};

export type PermissionRuleType = "none" | "allow" | "deny";
export type PermissionRule = {
  type: PermissionRuleType;
  list: PermissionNode[];
};

export type Permission = {
  view: PermissionRule;
  edit: PermissionRule;
  chmod: PermissionRule;
};

export type ActorGroup = {
  name: string;
  isSystem: boolean;
  isChatGroup: boolean;
  list: {
    type: "user" | "character";
    id: string;
  }[];
};
