import Nekostore from "nekostore/lib/Nekostore";
import QuerySnapshot from "nekostore/src/QuerySnapshot";
import Unsubscribe from "nekostore/src/Unsubscribe";
import CollectionReference from "nekostore/src/CollectionReference";
import DocumentReference from "nekostore/src/DocumentReference";
import DocumentSnapshot from "nekostore/lib/DocumentSnapshot";
import { StoreMetaData, StoreObj } from "@/@types/store";

export default class NecostoreCollectionController<T> {
  constructor(
    private readonly nekostore: Nekostore,
    private readonly collectionName: string
  ) {}

  public destroy() {
    Object.values(this.snapshotMap).forEach(unsubscribe => {
      unsubscribe();
    });
    Object.keys(this.snapshotMap).forEach(key => {
      delete this.snapshotMap[key];
    });
  }

  private snapshotMap: { [ownerKey in string]: Unsubscribe } = {};

  private getCollection() {
    return this.nekostore.collection<StoreObj<T>>(this.collectionName);
  }

  public async getList(): Promise<(StoreObj<T> & StoreMetaData)[]> {
    const c = this.getCollection();
    return (await c.orderBy("updateTime").get()).docs.map(doc => {
      window.console.log(doc.createTime, doc.updateTime);
      return {
        ...doc.data!,
        id: doc.ref.id,
        createTime: doc.createTime ? doc.createTime.toDate() : null,
        updateTime: doc.updateTime ? doc.updateTime.toDate() : null
      };
    });
  }

  public async add(inputInfo: T) {
    const c = this.getCollection();
    await c.add({
      order: 1,
      exclusionOwner: null,
      data: inputInfo
    });
  }

  public async delete(key: string): Promise<void> {
    const c = this.getCollection();
    const target = await c.where("key", "==", key).get();
    target.docs.forEach(doc => {
      doc.ref.delete();
    });
  }

  public async addSnapshot(
    ownerKey: string,
    docId: string,
    onNext: (snapshot: DocumentSnapshot<StoreObj<T>>) => void
  ): Promise<void> {
    let target: DocumentReference<StoreObj<T>> = this.getCollection().doc(
      docId
    );
    const unsubscribe = await target.onSnapshot(onNext);
    if (!this.snapshotMap[ownerKey]) this.snapshotMap[ownerKey]();
    this.snapshotMap[ownerKey] = unsubscribe;
  }

  public async addCollectionSnapshot(
    ownerKey: string,
    onNext: (snapshot: QuerySnapshot<StoreObj<T>>) => void
  ): Promise<void> {
    let target: CollectionReference<StoreObj<T>> = this.getCollection();
    const unsubscribe = await target.onSnapshot(onNext);
    if (this.snapshotMap[ownerKey]) this.snapshotMap[ownerKey]();
    this.snapshotMap[ownerKey] = unsubscribe;
  }
}
