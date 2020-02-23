import Nekostore from "nekostore/lib/Nekostore";
import QuerySnapshot from "nekostore/src/QuerySnapshot";
import Unsubscribe from "nekostore/src/Unsubscribe";
import CollectionReference from "nekostore/src/CollectionReference";
import DocumentReference from "nekostore/src/DocumentReference";
import DocumentSnapshot from "nekostore/lib/DocumentSnapshot";
import { Permission, StoreObj, StoreUseData } from "@/@types/store";
import SocketFacade, {
  getStoreObj
} from "@/app/core/api/app-server/SocketFacade";
import {
  AddDirectRequest,
  CreateDataRequest,
  DeleteDataRequest,
  ReleaseTouchRequest,
  TouchModifyRequest,
  TouchRequest,
  UpdateDataRequest
} from "@/@types/data";
import GameObjectManager from "@/app/basic/GameObjectManager";

export default class NekostoreCollectionController<T> {
  constructor(
    private readonly socket: any,
    private readonly nekostore: Nekostore,
    private readonly collectionName: string
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
    await this.touchList
      .map((touchId: string) => () => this.releaseTouch(touchId))
      .reduce((prev, curr) => prev.then(curr), Promise.resolve());
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
    column?: string
  ): Promise<StoreUseData<T>[]> {
    const c = this.getCollection();
    const sortColumn = column || "order";
    const list = (await c.orderBy(sortColumn).get()).docs
      .filter(doc => doc.exists() && doc.data.data)
      .map(doc => getStoreObj<T>(doc)!);
    await this.setCollectionSnapshot(
      "NekostoreCollectionController",
      (snapshot: QuerySnapshot<StoreObj<T>>) => {
        snapshot.docs.forEach(() => {
          let wantSort = false;
          snapshot.docs.forEach(doc => {
            const index = list.findIndex(p => p.id === doc.ref.id);
            if (doc.type === "removed") {
              list.splice(index, 1);
            } else {
              const status = doc.data!.status;
              if (
                (status !== "initial-touched" && index === -1) ||
                status === "added" ||
                status === "modified"
              ) {
                const obj = getStoreObj(doc)!;
                list.splice(index, index < 0 ? 0 : 1, obj);
                wantSort = true;
              }
            }
          });
          if (wantSort)
            list.sort((i1: any, i2: any) => {
              if (i1[sortColumn] < i2[sortColumn]) return -1;
              if (i1[sortColumn] > i2[sortColumn]) return 1;
              return 0;
            });
        });
      }
    );
    return list;
  }

  public async getData(id: string): Promise<StoreUseData<T> | null> {
    const c = this.getCollection();
    const docSnap = await c.doc(id).get();
    if (!docSnap || !docSnap.data || !docSnap.exists()) return null;
    return getStoreObj<T>(docSnap);
  }

  public async find(
    property: string,
    operand: "==",
    value: any
  ): Promise<StoreUseData<T>[] | null> {
    const c = this.getCollection();
    const docs = (await c.where(property, operand, value).get()).docs;
    if (!docs) return null;
    return docs
      .filter(item => item && item.exists())
      .map(item => getStoreObj(item)!);
  }

  public async touch(option?: Partial<StoreUseData<any>>): Promise<string> {
    let id: string | undefined = undefined;
    let owner: string = GameObjectManager.instance.mySelfId;
    if (option) {
      id = option.id || undefined;
      if (option.owner) owner = option.owner;
    }
    const docId = await SocketFacade.instance.socketCommunication<
      TouchRequest,
      string
    >("touch-data", {
      collection: this.collectionName,
      id,
      owner
    });
    this.touchList.push(docId);
    return docId;
  }

  public async touchModify(id: string): Promise<string> {
    const docId = await SocketFacade.instance.socketCommunication<
      TouchModifyRequest,
      never
    >("touch-data-modify", {
      collection: this.collectionName,
      id
    });
    this.touchList.push(docId);
    return docId;
  }

  public async releaseTouch(id: string): Promise<void> {
    const index = this.touchList.findIndex(listId => listId === id);
    this.touchList.splice(index, 1);
    await SocketFacade.instance.socketCommunication<ReleaseTouchRequest, never>(
      "release-touch-data",
      {
        collection: this.collectionName,
        id
      }
    );
  }

  public async add(
    id: string,
    data: T,
    permission?: Permission
  ): Promise<string> {
    const index = this.touchList.findIndex(listId => listId === id);
    this.touchList.splice(index, 1);
    return await SocketFacade.instance.socketCommunication<
      CreateDataRequest,
      string
    >("create-data", {
      collection: this.collectionName,
      id,
      data,
      permission: permission || GameObjectManager.DEFAULT_PERMISSION
    });
  }

  public async addDirect(
    dataList: T[],
    option?: Partial<StoreObj<any>>
  ): Promise<string[]> {
    let permission: Permission = GameObjectManager.DEFAULT_PERMISSION;
    let owner: string = GameObjectManager.instance.mySelfId;
    if (option) {
      if (option.permission) permission = option.permission;
      if (option.owner) owner = option.owner;
    }
    return await SocketFacade.instance.socketCommunication<
      AddDirectRequest,
      string[]
    >("add-direct", {
      collection: this.collectionName,
      dataList,
      permission,
      owner
    });
  }

  public async update(
    id: string,
    data: T,
    option?: Partial<StoreObj<unknown>> & { continuous?: boolean }
  ) {
    const index = this.touchList.findIndex(listId => listId === id);
    this.touchList.splice(index, 1);
    await SocketFacade.instance.socketCommunication<UpdateDataRequest, never>(
      "update-data",
      {
        collection: this.collectionName,
        id,
        data,
        option
      }
    );
  }

  public async delete(id: string): Promise<void> {
    const index = this.touchList.findIndex(listId => listId === id);
    this.touchList.splice(index, 1);
    await SocketFacade.instance.socketCommunication<DeleteDataRequest, never>(
      "delete-data",
      {
        collection: this.collectionName,
        id
      }
    );
  }

  public async setSnapshot(
    ownerKey: string,
    docId: string,
    onNext: (snapshot: DocumentSnapshot<StoreObj<T>>) => void
  ): Promise<() => void> {
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
  ): Promise<() => void> {
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
