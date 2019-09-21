import {
  CompareInfo,
  MultiCompareInfo,
  Operand,
  SimpleCompareInfo
} from "@/@types/compare";
import { ApplicationError } from "@/app/core/error/ApplicationError";

/**
 * オペランドの値を取得する
 * @param o オペランド
 * @param target 値を取得するオブジェクトが持つターゲット
 * @param getObj storeからオブジェクトを取得できる関数
 */
function getOperandValue(
  o: Operand,
  target: string | null | undefined,
  getObj: (key: string) => any
): any {
  if (typeof o === "object") {
    const getProperty = (key: string, prop: string) => {
      const syncObj: any = getObj(key);
      return syncObj ? syncObj[prop] : undefined;
    };
    if (o.refType === "sync-obj-exist") return !!getObj(o.key);
    if (o.refType === "sync-obj-property")
      return getProperty(o.key, o.property);
    if (o.refType === "store-property") return getObj(o.property);
    if (o.refType === "attendant-key-exist") return !!target;
    if (o.refType === "attendant-key-obj-exist") {
      if (!target) throw new ApplicationError("Invalid target non exist.");
      return getObj(target);
    }
    if (o.refType === "attendant-key-obj-property") {
      if (!target) throw new ApplicationError("Invalid target non exist.");
      return getProperty(target, o.property);
    }
    throw new ApplicationError(`Un supported refType='${(<any>o).refType}'`);
  }
  return o;
}

/**
 * 比較情報を基に比較を行い、その結果を返却する
 * @param comp 比較情報
 * @param target 比較オブジェクトから指定された対象
 * @param getObj storeからオブジェクトを取得できる関数
 */
export function judgeCompare(
  comp: CompareInfo | null | undefined,
  target: string | null | undefined,
  getObj: (key: string) => any
): boolean {
  if (!comp) return true;
  if ((<MultiCompareInfo>comp).list && (<MultiCompareInfo>comp).list) {
    const mComp: MultiCompareInfo = comp as MultiCompareInfo;
    const r: boolean[] = mComp.list.map((c: SimpleCompareInfo) => {
      const lhs: any = getOperandValue(c.lhs, target, getObj);
      const rhs: any = getOperandValue(c.rhs, target, getObj);
      return c.isNot ? lhs !== rhs : lhs === rhs;
    });
    const trueCount: number = r.filter((r: boolean) => r).length;
    return mComp.operator === "and" ? trueCount === r.length : trueCount > 0;
  }
  if ((<SimpleCompareInfo>comp).lhs && (<SimpleCompareInfo>comp).rhs) {
    const sComp: SimpleCompareInfo = comp as SimpleCompareInfo;
    const lhs: any = getOperandValue(sComp.lhs, target, getObj);
    const rhs: any = getOperandValue(sComp.rhs, target, getObj);
    return sComp.isNot ? lhs !== rhs : lhs === rhs;
  }
  throw new ApplicationError("Invalid comp info type");
}
