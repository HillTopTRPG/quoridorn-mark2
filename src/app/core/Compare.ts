import { CompareInfo, Operand, SimpleCompareInfo } from "@/@types/compare";
import { ApplicationError } from "@/app/core/ApplicationError";
import App from "@/views/App.vue";

function getOperand(
  o: Operand,
  target: string | null | undefined,
  getObj: (key: string) => any
): any {
  if (typeof o === "object") {
    const getProperty = (key: string) => {
      const syncObj: any = getObj(key);
      return syncObj ? syncObj[o.property!] : undefined;
    };
    if (o.refType === "sync-obj-exist") return !!getObj(o.key!);
    if (o.refType === "sync-obj-property") return getProperty(o.key!);
    if (o.refType === "store-property") return getObj(o.property!);
    if (o.refType === "attendant-key-exist") return !!target;
    if (o.refType === "attendant-key-obj-exist") {
      if (!target) throw new ApplicationError("Invalid target non exist.");
      return getObj(target);
    }
    if (o.refType === "attendant-key-obj-property") {
      if (!target) throw new ApplicationError("Invalid target non exist.");
      return getProperty(target);
    }
    throw new ApplicationError(`Un supported refType='${o.refType}'`);
  }
  return o;
}

export function judgeCompare(
  comp: CompareInfo | null | undefined,
  target: string | null | undefined,
  getObj: (key: string) => any
): boolean {
  if (!comp) return true;
  if (comp.type === "multiple") {
    const r: boolean[] = comp.list.map((c: SimpleCompareInfo) => {
      const lhs: any = getOperand(c.lhs, target, getObj);
      const rhs: any = getOperand(c.rhs, target, getObj);
      return c.isNot ? lhs !== rhs : lhs === rhs;
    });
    const trueCount: number = r.filter((r: boolean) => r).length;
    return comp.operator === "and" ? trueCount === r.length : trueCount > 0;
  }
  if (comp.type === "single") {
    const lhs: any = getOperand(comp.lhs, target, getObj);
    const rhs: any = getOperand(comp.rhs, target, getObj);
    return comp.isNot ? lhs !== rhs : lhs === rhs;
  }
  throw new ApplicationError("Invalid comp info type");
}
