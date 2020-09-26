import { CompareInfo, Operand, SimpleCompareInfo } from "compare";
import GameObjectManager from "../../basic/GameObjectManager";
import { ApplicationError } from "../error/ApplicationError";
import SocketFacade, { permissionCheck } from "../api/app-server/SocketFacade";
import { findRequireByKey } from "./Utility";

/**
 * オペランドの値を取得する
 * @param o オペランド
 * @param type
 * @param key
 */
async function getOperandValue(
  o: Operand | any,
  type: string | null,
  key: string | null
): Promise<any> {
  if (!o || typeof o !== "object") return o;
  if (o.refType === "variable-myself") {
    return SocketFacade.instance.userKey;
  }
  if (o.refType === "db-id-exist") {
    const list = GameObjectManager.instance.getList(type!);
    if (!list) throw new ApplicationError(`Un supported type='${type}'`);
    return list.some(d => d.key === key);
  }
  if (o.refType === "db-search-exist") {
    const cc = SocketFacade.instance.getCC(type!);
    const dataList = await cc.findList([
      {
        property: o.searchProperty,
        operand: "==",
        value: o.searchValue
      }
    ]);
    return dataList && dataList.length > 0;
  }
  if (o.refType === "db-search-length") {
    const cc = SocketFacade.instance.getCC(type!);
    const dataList = await cc.findList([
      {
        property: o.searchProperty,
        operand: "==",
        value: o.searchValue
      }
    ]);
    return dataList ? dataList.length : 0;
  }
  const getObject = (type: string, key: string): StoreData<any> => {
    const list = GameObjectManager.instance.getList(type);
    if (!list) throw new ApplicationError(`Un supported type='${type}'`);
    return findRequireByKey(list, key);
  };
  const getProperty = (obj: any, prop: string): any => {
    if (!obj || !prop) return null;
    const props = prop.split(".");
    const result = obj[props.shift()!];
    return props.length === 0 ? result : getProperty(result, props.join("."));
  };
  if (o.refType === "db-id-property") {
    const useData = getObject(type!, key!);
    return getProperty(useData, o.property);
  }
  if (o.refType === "db-id-owner-property") {
    let useData: StoreData<any> = getObject(type!, key!);
    for (let level = 0; level < o.level; level++) {
      if (!useData.ownerType || !useData.owner) {
        throw new ApplicationError(
          `Un supported ownerType='${useData.ownerType}', owner='${useData.owner}'`
        );
      }
      useData = getObject(useData.ownerType, useData.owner);
    }
    return getProperty(useData, o.property);
  }
  if (o.refType === "db-search-property") {
    const cc = SocketFacade.instance.getCC(type!);
    const dataList = await cc.findList([
      {
        property: o.searchProperty,
        operand: "==",
        value: o.searchValue
      }
    ]);
    return dataList && dataList.length
      ? getProperty(dataList[0].data!, o.property)
      : null;
  }
  if (o.refType === "permission-check") {
    const list = GameObjectManager.instance.getList(type!);
    if (!list) throw new ApplicationError(`Un supported type='${type}'`);
    const useData = findRequireByKey(list, key);
    return permissionCheck(useData, o.type);
  }
  if (o.refType === "exclusion-check") {
    const list = GameObjectManager.instance.getList(type!);
    if (!list) throw new ApplicationError(`Un supported type='${type}'`);
    const useData = findRequireByKey(list, key);
    return !useData.exclusionOwner;
  }
  throw new ApplicationError(`Un supported refType='${(<any>o).refType}'`);
}

/**
 * 比較情報を基に比較を行い、その結果を返却する
 * @param comp 比較情報
 * @param type
 * @param key
 */
export async function judgeCompare(
  comp: CompareInfo | null | undefined,
  type: string | null,
  key: string | null
): Promise<boolean> {
  if (!comp) return true;

  // 判定メソッド
  const judgement = async (c: SimpleCompareInfo): Promise<boolean> => {
    const lhs: any = await getOperandValue(c.lhs, type, key);
    const rhs: any = await getOperandValue(c.rhs, type, key);
    return c.isNot ? lhs !== rhs : lhs === rhs;
  };

  // MultiCompareInfo の場合
  if ("operator" in comp && "list" in comp) {
    const mComp = comp;
    const r: boolean[] = await Promise.all(mComp.list.map(c => judgement(c)));
    const trueCount: number = r.filter((r: boolean) => r).length;
    return mComp.operator === "and" ? trueCount === r.length : trueCount > 0;
  }

  // SingleCompareInfo の場合
  if ("lhs" in comp && "rhs" in comp) return await judgement(comp);

  // どっちでもない場合はエラー
  throw new ApplicationError("Invalid comp info type");
}
