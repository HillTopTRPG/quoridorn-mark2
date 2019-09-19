type OperandRefType =
  | "sync-obj-exist"
  | "sync-obj-property"
  | "store-property"
  | "attendant-key-exist"
  | "attendant-key-obj-exist"
  | "attendant-key-obj-property";

type CompOperator = "and" | "or";

export type Operand =
  | {
      refType: OperandRefType;
      property?: string;
      key?: string;
    }
  | string
  | number
  | boolean;

export type SimpleCompareInfo = {
  type: "single";
  lhs: Operand;
  rhs: Operand;
  isNot?: boolean;
};

export type MultiCompareInfo = {
  type: "multiple";
  operator: CompOperator;
  list: SimpleCompareInfo[];
};

export type CompareInfo = SimpleCompareInfo | MultiCompareInfo;
