import Nekostore from "nekostore/lib/Nekostore";
import QuerySnapshot from "nekostore/src/QuerySnapshot";
import Unsubscribe from "nekostore/src/Unsubscribe";
import CollectionReference from "nekostore/src/CollectionReference";
import DocumentSnapshot from "nekostore/lib/DocumentSnapshot";
import Query from "nekostore/lib/Query";
import {
  AddDirectRequest,
  DeleteDataRequest,
  ReleaseTouchRequest,
  TouchModifyRequest,
  UpdateDataRequest
} from "@/@types/data";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";

export default class NekostoreCollectionController<T> {
  constructor(
    private readonly socket: any,
    private readonly nekostore: Nekostore,
    public readonly collectionName: string,
    public readonly collectionNameSuffix: string
  ) {}

  private touchKeyList: string[] = [];

  /*****************************************************************************
   * 破棄時には全ての全ての監視を解除する
   */
  public async destroy() {
    Object.values(this.snapshotMap).forEach(unsubscribe => {
      unsubscribe();
    });
    Object.keys(this.snapshotMap).forEach(key => {
      delete this.snapshotMap[key];
    });

    // releaseTouchを直列の非同期で全部実行する
    await this.releaseTouch(this.touchKeyList);
  }

  private snapshotMap: { [ownerKey in string]: Unsubscribe } = {};

  private getCollection() {
    return this.nekostore.collection<StoreData<T>>(this.collectionName);
  }

  /*****************************************************************************
   * データ一覧を取得する
   * @param isSync 返却リストの中身を変更に伴って自動更新するかどうか
   * @param argList 返却リスト
   * @param column リスト内のソートに用いるカラム（パス指定）
   */
  public async getList(
    isSync: boolean,
    argList?: StoreUseData<T>[],
    column?: string
  ): Promise<StoreUseData<T>[]> {
    const c = this.getCollection();
    const sortColumn = column || "order";
    if (!argList) argList = [];
    const list = (await c.orderBy(sortColumn).get()).docs
      .filter(doc => doc.exists() && doc.data.data)
      .map(doc => ({
        id: doc.ref.id,
        ...doc.data!
      }));
    argList.push(...list);
    await this.setCollectionSnapshot(
      "NekostoreCollectionController",
      (snapshot: QuerySnapshot<StoreData<T>>) => {
        let wantSort = false;
        snapshot.docs.forEach(doc => {
          const index = argList!.findIndex(p => p.id === doc.ref.id);
          if (doc.type === "removed" && index >= 0) {
            argList!.splice(index, 1);
          } else {
            const status = doc.data!.status;
            if (
              (status !== "initial-touched" && index === -1) ||
              status === "added" ||
              status === "modified" ||
              status === "modify-touched"
            ) {
              argList!.splice(index, index < 0 ? 0 : 1, {
                id: doc.ref.id,
                ...doc.data!
              });
              wantSort = true;
            }
          }
        });
        if (wantSort) {
          argList!.sort((i1: any, i2: any) => {
            if (i1[sortColumn] < i2[sortColumn]) return -1;
            if (i1[sortColumn] > i2[sortColumn]) return 1;
            return 0;
          });
          // console.log("sorted", argList!);
        }
      }
    );
    return argList!;
  }

  /*****************************************************************************
   * データを複数件検索する
   * @param options 検索条件
   */
  public async findList(
    options: { property: string; operand: "=="; value: any }[]
  ): Promise<DocumentSnapshot<StoreData<T>>[] | null> {
    let c: Query<StoreData<T>> = this.getCollection();
    options.forEach(o => {
      c = c.where(o.property, o.operand, o.value);
    });
    const docs = (await c.get()).docs;
    if (!docs) return null;
    return docs.filter(doc => doc && doc.exists());
  }

  /*****************************************************************************
   * データを１件取得する
   * @param property 検索プロパティ
   * @param value 検索値
   */
  public async findSingle(
    property: string,
    value: any
  ): Promise<DocumentSnapshot<StoreData<T>> | null> {
    const list = await this.findList([{ property, operand: "==", value }]);
    return list ? list[0] : null;
  }

  /*****************************************************************************
   * 更新のための排他制御
   * @param keyList キーのリスト
   */
  public async touchModify(keyList: string[]): Promise<string[]> {
    const touchKeyList = await SocketFacade.instance.socketCommunication<
      TouchModifyRequest<any>,
      string[]
    >("touch-data-modify", {
      collection: this.collectionName,
      list: keyList.map(key => ({ key }))
    });
    this.touchKeyList.push(...touchKeyList);
    return touchKeyList;
  }

  /*****************************************************************************
   * 更新のための排他制御の解除
   * @param keyList キーのリスト
   */
  public async releaseTouch(keyList: string[]): Promise<void> {
    keyList.forEach(k => {
      const index = this.touchKeyList.findIndex(tk => tk === k);
      this.touchKeyList.splice(index, 1);
    });
    await SocketFacade.instance.socketCommunication<
      ReleaseTouchRequest<any>,
      void
    >("release-touch-data", {
      collection: this.collectionName,
      list: keyList.map(key => ({ key }))
    });
  }

  /*****************************************************************************
   * 更新のための排他制御
   * @param list データリスト
   */
  public async addDirect(
    list: (Partial<StoreData<T>> & { data: any })[]
  ): Promise<string[]> {
    return await SocketFacade.instance.socketCommunication<
      AddDirectRequest,
      string[]
    >("add-direct", {
      collection: this.collectionName,
      list
    });
  }

  /*****************************************************************************
   * データを複数件検索する
   * list
   */
  public async update(
    list: (Partial<StoreData<T>> & {
      key: string;
      continuous?: boolean;
    })[]
  ) {
    list.forEach(l => {
      const index = this.touchKeyList.findIndex(tk => tk === l.key);
      if (index < 0) return;
      this.touchKeyList.splice(index, 1);
    });
    await SocketFacade.instance.socketCommunication<UpdateDataRequest<T>, void>(
      "update-data",
      {
        collection: this.collectionName,
        list
      }
    );
  }

  public async updatePackage(
    list: (Partial<StoreData<T>> & {
      key: string;
      data: T;
      continuous?: boolean;
    })[]
  ) {
    await SocketFacade.instance.socketCommunication<
      UpdateDataRequest<T>,
      never
    >("update-data-package", {
      collection: this.collectionName,
      list
    });
  }

  public async delete(keyList: string[]): Promise<void> {
    keyList.forEach(k => {
      const index = this.touchKeyList.findIndex(tk => tk === k);
      this.touchKeyList.splice(index, 1);
    });
    await SocketFacade.instance.socketCommunication<
      DeleteDataRequest<any>,
      void
    >("delete-data", {
      collection: this.collectionName,
      list: keyList.map(key => ({ key }))
    });
  }

  public async deletePackage(keyList: string[]): Promise<void> {
    await SocketFacade.instance.socketCommunication<
      DeleteDataRequest<any>,
      never
    >("delete-data-package", {
      collection: this.collectionName,
      list: keyList.map(key => ({ key }))
    });
  }

  public async setSnapshot(
    ownerKey: string,
    key: string,
    onNext: (snapshot: DocumentSnapshot<StoreData<T>>) => void
  ): Promise<Unsubscribe> {
    const doc = (await this.findSingle("key", key))!;
    const unsubscribe = await doc.ref.onSnapshot(onNext);
    if (this.snapshotMap[ownerKey]) this.snapshotMap[ownerKey]();
    this.snapshotMap[ownerKey] = unsubscribe;
    return async () => {
      await unsubscribe();
      delete this.snapshotMap[ownerKey];
    };
  }

  public async setCollectionSnapshot(
    ownerKey: string,
    onNext: (snapshot: QuerySnapshot<StoreData<T>>) => void
  ): Promise<Unsubscribe> {
    const target: CollectionReference<StoreData<T>> = this.getCollection();
    const unsubscribe = await target.onSnapshot(onNext);
    if (this.snapshotMap[ownerKey]) this.snapshotMap[ownerKey]();
    this.snapshotMap[ownerKey] = unsubscribe;
    return async () => {
      await unsubscribe();
      delete this.snapshotMap[ownerKey];
    };
  }
}
