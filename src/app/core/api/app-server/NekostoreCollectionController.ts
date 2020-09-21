import Nekostore from "nekostore/lib/Nekostore";
import QuerySnapshot from "nekostore/src/QuerySnapshot";
import Unsubscribe from "nekostore/src/Unsubscribe";
import CollectionReference from "nekostore/src/CollectionReference";
import DocumentReference from "nekostore/src/DocumentReference";
import DocumentSnapshot from "nekostore/lib/DocumentSnapshot";
import Query from "nekostore/lib/Query";
import { StoreObj, StoreUseData } from "@/@types/store";
import {
  AddDirectRequest,
  DeleteDataRequest,
  ReleaseTouchRequest,
  TouchModifyRequest,
  UpdateDataRequest
} from "@/@types/data";
import SocketFacade, {
  getStoreObj
} from "@/app/core/api/app-server/SocketFacade";

export default class NekostoreCollectionController<T> {
  constructor(
    private readonly socket: any,
    private readonly nekostore: Nekostore,
    public readonly collectionName: string
  ) {}

  private touchList: string[] = [];

  public async destroy() {
    Object.values(this.snapshotMap).forEach(unsubscribe => {
      unsubscribe();
    });
    Object.keys(this.snapshotMap).forEach(key => {
      delete this.snapshotMap[key];
    });

    // releaseTouchを直列の非同期で全部実行する
    await this.releaseTouch(this.touchList);
  }

  private snapshotMap: { [ownerKey in string]: Unsubscribe } = {};

  private getCollection() {
    return this.nekostore.collection<StoreObj<T>>(this.collectionName);
  }

  // private async getDocSnap(
  //   id: string,
  //   collection?: CollectionReference<StoreObj<T>>
  // ): Promise<DocumentSnapshot<StoreObj<T>>> {
  //   return await (collection || this.getCollection()).doc(id).get();
  // }

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
      .map(doc => getStoreObj<T>(doc)!);
    argList.push(...list);
    await this.setCollectionSnapshot(
      "NekostoreCollectionController",
      (snapshot: QuerySnapshot<StoreObj<T>>) => {
        snapshot.docs.forEach(() => {
          let wantSort = false;
          snapshot.docs.forEach(doc => {
            const index = argList!.findIndex(p => p.id === doc.ref.id);
            if (doc.type === "removed") {
              argList!.splice(index, 1);
            } else {
              const status = doc.data!.status;
              if (
                (status !== "initial-touched" && index === -1) ||
                status === "added" ||
                status === "modified" ||
                status === "modify-touched"
              ) {
                const obj = getStoreObj(doc)!;
                argList!.splice(index, index < 0 ? 0 : 1, obj);
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
        });
      }
    );
    return argList!;
  }

  public async getData(id: string): Promise<StoreUseData<T> | null> {
    const c = this.getCollection();
    const docSnap = await c.doc(id).get();
    if (!docSnap || !docSnap.data || !docSnap.exists()) return null;
    return getStoreObj<T>(docSnap);
  }

  public async find(
    options: { property: string; operand: "=="; value: any }[]
  ): Promise<StoreUseData<T>[] | null> {
    let c: Query<StoreObj<T>> = this.getCollection();
    options.forEach(o => {
      c = c.where(o.property, o.operand, o.value);
    });
    const docs = (await c.get()).docs;
    if (!docs) return null;
    return docs
      .filter(item => item && item.exists())
      .map(item => getStoreObj(item)!);
  }

  public async touchModify(idList: string[]): Promise<string[]> {
    const docIdList = await SocketFacade.instance.socketCommunication<
      TouchModifyRequest,
      string[]
    >("touch-data-modify", {
      collection: this.collectionName,
      idList
    });
    this.touchList.push(...docIdList);
    return docIdList;
  }

  public async releaseTouch(idList: string[]): Promise<void> {
    idList.forEach(id => {
      const index = this.touchList.findIndex(listId => listId === id);
      this.touchList.splice(index, 1);
    });
    await SocketFacade.instance.socketCommunication<ReleaseTouchRequest, never>(
      "release-touch-data",
      {
        collection: this.collectionName,
        idList
      }
    );
  }

  public async addDirect(
    dataList: T[],
    optionList?: Partial<StoreObj<any>>[]
  ): Promise<string[]> {
    return await SocketFacade.instance.socketCommunication<
      AddDirectRequest,
      string[]
    >("add-direct", {
      collection: this.collectionName,
      dataList,
      optionList
    });
  }

  public async update(
    idList: string[],
    dataList: T[],
    optionList?: (Partial<StoreObj<unknown>> & { continuous?: boolean })[]
  ) {
    idList.forEach(id => {
      const index = this.touchList.findIndex(listId => listId === id);
      this.touchList.splice(index, 1);
    });
    await SocketFacade.instance.socketCommunication<UpdateDataRequest, never>(
      "update-data",
      {
        collection: this.collectionName,
        idList,
        dataList,
        optionList
      }
    );
  }

  public async updatePackage(
    idList: string[],
    dataList: T[],
    optionList?: (Partial<StoreObj<unknown>> & { continuous?: boolean })[]
  ) {
    await SocketFacade.instance.socketCommunication<UpdateDataRequest, never>(
      "update-data-package",
      {
        collection: this.collectionName,
        idList,
        dataList,
        optionList
      }
    );
  }

  public async delete(idList: string[]): Promise<void> {
    idList.forEach(id => {
      const index = this.touchList.findIndex(listId => listId === id);
      this.touchList.splice(index, 1);
    });
    await SocketFacade.instance.socketCommunication<DeleteDataRequest, never>(
      "delete-data",
      {
        collection: this.collectionName,
        idList
      }
    );
  }

  public async deletePackage(idList: string[]): Promise<void> {
    await SocketFacade.instance.socketCommunication<DeleteDataRequest, never>(
      "delete-data-package",
      {
        collection: this.collectionName,
        idList
      }
    );
  }

  public async setSnapshot(
    ownerKey: string,
    docId: string,
    onNext: (snapshot: DocumentSnapshot<StoreObj<T>>) => void
  ): Promise<Unsubscribe> {
    let target: DocumentReference<StoreObj<T>> = this.getCollection().doc(
      docId
    );
    const unsubscribe = await target.onSnapshot(onNext);
    if (this.snapshotMap[ownerKey]) this.snapshotMap[ownerKey]();
    this.snapshotMap[ownerKey] = unsubscribe;
    return async () => {
      await unsubscribe();
      delete this.snapshotMap[ownerKey];
    };
  }

  public async setCollectionSnapshot(
    ownerKey: string,
    onNext: (snapshot: QuerySnapshot<StoreObj<T>>) => void
  ): Promise<Unsubscribe> {
    let target: CollectionReference<StoreObj<T>> = this.getCollection();
    const unsubscribe = await target.onSnapshot(onNext);
    if (this.snapshotMap[ownerKey]) this.snapshotMap[ownerKey]();
    this.snapshotMap[ownerKey] = unsubscribe;
    return async () => {
      await unsubscribe();
      delete this.snapshotMap[ownerKey];
    };
  }
}
