export type Operand =
  | { refType: "sync-obj-exist"; key: string }
  | { refType: "sync-obj-property"; key: string; property: string }
  | { refType: "store-property"; property: string }
  | { refType: "attendant-key-exist" }
  | { refType: "attendant-key-obj-exist" }
  | { refType: "attendant-key-obj-property"; property: string }
  | string
  | number
  | boolean;

export type SimpleCompareInfo = {
  lhs: Operand;
  rhs: Operand;
  isNot?: boolean;
};

export type MultiCompareInfo = {
  operator: "and" | "or";
  list: SimpleCompareInfo[];
};

export type CompareInfo = SimpleCompareInfo | MultiCompareInfo;
