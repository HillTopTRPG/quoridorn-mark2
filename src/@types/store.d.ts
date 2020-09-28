/**
 * DBに格納されるデータのラッパー
 */
type DataReference = {
  type: string;
  key: string;
};

type StoreData<T> = {
  collection: string;
  key: string;
  order: number;
  ownerType: string | null;
  owner: string | null; // 部屋データに含まれるデータのオーナー。部屋データにはオーナーは存在しない
  exclusionOwner: string | null; // 排他制御のオーナー
  lastExclusionOwner: string | null; // 排他制御のオーナー
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
  refList: DataReference[]; // このデータへの参照
  data?: T;
};

type StoreUseData<T> = StoreData<T> & {
  id: string;
};

/**
 * 権限対象の種別
 */
type PermissionNodeType = "group" | "actor" | "owner";

/**
 * 権限対象1件の表現
 */
type PermissionNode = {
  type: PermissionNodeType;
  key?: string;
};

/**
 * 権限のルールタイプ
 */
type PermissionRuleType = "none" | "allow" | "deny";

/**
 * 権限のルール単位の表現
 */
type PermissionRule = {
  type: PermissionRuleType;
  list: PermissionNode[];
};

/**
 * 表示・編集・権限編集の3種の権限の集合体。
 * これがDBデータ1件ごとに設定される
 */
type Permission = {
  view: PermissionRule;
  edit: PermissionRule;
  chmod: PermissionRule;
};
