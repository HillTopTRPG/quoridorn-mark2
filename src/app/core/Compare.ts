import { Operand, CompareInfo, SimpleCompareInfo } from "@/@types/compare";
import { ApplicationError } from "@/app/core/error/ApplicationError";
import SocketFacade, {
  permissionCheck
} from "@/app/core/api/app-server/SocketFacade";
import GameObjectManager from "@/app/basic/GameObjectManager";

/**
 * オペランドの値を取得する
 * @param o オペランド
 * @param type
 * @param docId
 */
async function getOperandValue(
  o: Operand,
  type: string | null,
  docId: string | null
): Promise<any> {
  if (typeof o === "object") {
    if (o.refType === "db-id-exist") {
      const list = GameObjectManager.instance.getList(type!);
      if (!list) throw new ApplicationError(`Un supported type='${type}'`);
      const useData = list.filter(d => d.id === docId!)[0];
      return !!useData;
    }
    if (o.refType === "db-search-exist") {
      const cc = SocketFacade.instance.getCC(type!);
      const dataList = await cc.find(o.searchProperty, "==", o.searchValue);
      return dataList && dataList.length > 0;
    }
    if (o.refType === "db-search-length") {
      const cc = SocketFacade.instance.getCC(type!);
      const dataList = await cc.find(o.searchProperty, "==", o.searchValue);
      return dataList ? dataList.length : 0;
    }
    if (o.refType === "db-id-property") {
      const list = GameObjectManager.instance.getList(type!);
      if (!list) throw new ApplicationError(`Un supported type='${type}'`);
      const useData = list.filter(d => d.id === docId!)[0];
      if (!useData) throw new ApplicationError(`Un supported docId='${docId}'`);
      return useData.data ? (useData.data as any)[o.property] : null;
    }
    if (o.refType === "db-search-property") {
      const cc = SocketFacade.instance.getCC(type!);
      const dataList = await cc.find(o.searchProperty, "==", o.searchValue);
      return dataList && dataList.length ? dataList[0].data[o.property] : null;
    }
    if (o.refType === "permission-check") {
      const list = GameObjectManager.instance.getList(type!);
      if (!list) throw new ApplicationError(`Un supported type='${type}'`);
      const useData = list.filter(d => d.id === docId!)[0];
      if (!useData) throw new ApplicationError(`Un supported docId='${docId}'`);
      return permissionCheck(useData!, o.type);
    }
    if (o.refType === "exclusion-check") {
      const list = GameObjectManager.instance.getList(type!);
      if (!list) throw new ApplicationError(`Un supported type='${type}'`);
      const useData = list.filter(d => d.id === docId!)[0];
      return useData && !useData.exclusionOwner;
    }
    throw new ApplicationError(`Un supported refType='${(<any>o).refType}'`);
  }
  return o;
}

/**
 * 比較情報を基に比較を行い、その結果を返却する
 * @param comp 比較情報
 * @param type
 * @param docId
 */
export async function judgeCompare(
  comp: CompareInfo | null | undefined,
  type: string | null,
  docId: string | null
): Promise<boolean> {
  if (!comp) return true;

  // 判定メソッド
  const judgement = async (c: SimpleCompareInfo): Promise<boolean> => {
    const lhs: any = await getOperandValue(c.lhs, type, docId);
    const rhs: any = await getOperandValue(c.rhs, type, docId);
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
