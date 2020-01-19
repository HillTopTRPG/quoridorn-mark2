export type Operand =
  | { refType: "db-id-exist" }
  | { refType: "exclusion-check" }
  | { refType: "permission-check"; type: "view" | "edit" | "chmod" }
  | { refType: "db-search-exist"; searchProperty: string; searchValue: string }
  | { refType: "db-search-length"; searchProperty: string; searchValue: string }
  | { refType: "db-id-property"; property: string }
  | {
      refType: "db-search-property";
      searchProperty: string;
      searchValue: string;
      property: string;
    }
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
