/**
 * DBに格納されるデータのラッパー
 */
export type StoreObj<T> = {
  ownerType: string | null;
  owner: string | null; // 部屋データに含まれるデータのオーナー。部屋データにはオーナーは存在しない
  order: number;
  exclusionOwner: string | null; // 排他制御のオーナー
  lastExclusionOwner: string | null; // 排他制御のオーナー
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

/**
 * DBのメタデータ
 */
type StoreMetaData = {
  id: string | null;
};

/**
 * メタデータ付き、DBデータ
 */
export type StoreUseData<T> = StoreObj<T> & StoreMetaData;

/**
 * 権限対象の種別
 */
export type PermissionNodeType = "group" | "actor" | "owner";

/**
 * 権限対象1件の表現
 */
export type PermissionNode = {
  type: PermissionNodeType;
  id?: string;
};

/**
 * 権限のルールタイプ
 */
export type PermissionRuleType = "none" | "allow" | "deny";

/**
 * 権限のルール単位の表現
 */
export type PermissionRule = {
  type: PermissionRuleType;
  list: PermissionNode[];
};

/**
 * 表示・編集・権限編集の3種の権限の集合体。
 * これがDBデータ1件ごとに設定される
 */
export type Permission = {
  view: PermissionRule;
  edit: PermissionRule;
  chmod: PermissionRule;
};
