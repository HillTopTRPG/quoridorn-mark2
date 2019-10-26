import Nekostore from "nekostore/lib/Nekostore";
import QuerySnapshot from "nekostore/src/QuerySnapshot";
import Unsubscribe from "nekostore/src/Unsubscribe";
import CollectionReference from "nekostore/src/CollectionReference";
import DocumentReference from "nekostore/src/DocumentReference";
import DocumentSnapshot from "nekostore/lib/DocumentSnapshot";
import { StoreMetaData, StoreObj } from "@/@types/store";
import { ApplicationError } from "@/app/core/error/ApplicationError";
import { SystemError } from "@/app/core/error/SystemError";
import { getStoreObj } from "@/app/core/api/app-server/SocketFacade";

export type CollectionType = "editable";

export default class NecostoreCollectionController<T> {
  constructor(
    private readonly socket: any,
    private readonly nekostore: Nekostore,
    private readonly collectionName: string,
    private readonly types: CollectionType[]
  ) {}

  private touchList: number[] = [];

  public async destroy() {
    Object.values(this.snapshotMap).forEach(unsubscribe => {
      unsubscribe();
    });
    Object.keys(this.snapshotMap).forEach(key => {
      delete this.snapshotMap[key];
    });

    // releaseTouchを直列の非同期で全部実行する
    await this.touchList
      .map((touchOrder: number) => () => this.releaseTouch(touchOrder))
      .reduce((prev, curr) => prev.then(curr), Promise.resolve());
  }

  private snapshotMap: { [ownerKey in string]: Unsubscribe } = {};

  private getCollection() {
    return this.nekostore.collection<StoreObj<T>>(this.collectionName);
  }

  private async getOrderDocs(
    order: number,
    collection?: CollectionReference<StoreObj<T>>
  ) {
    return (await (collection || this.getCollection())
      .where("order", "==", order)
      .get()).docs;
  }

  private checkOneDoc(order: number, docs: DocumentSnapshot<StoreObj<T>>[]) {
    if (!docs.length)
      throw new SystemError(
        `No such object info. Please touch. order=${order}`
      );
    if (docs.length > 1)
      throw new ApplicationError(
        `Duplicate object info. Please report to server administrator. order=${order}`
      );
  }

  public async getList(
    column?: string
  ): Promise<(StoreObj<T> & StoreMetaData)[]> {
    const c = this.getCollection();
    return (await c.orderBy(column || "order").get()).docs
      .filter(doc => doc.exists())
      .map(doc => {
        return getStoreObj(doc)!;
      });
  }

  public async touch(order: number): Promise<void> {
    const c = this.getCollection();
    this.touchList.push(order);
    const docs = await this.getOrderDocs(order, c);
    if (!docs.length) {
      await c.add({
        order,
        exclusionOwner: this.getSocketId()
      });
    } else {
      if (docs.length > 1)
        throw new ApplicationError(
          `Duplicate object info. Please report to server administrator. order=${order}`
        );
      if (this.types.findIndex(t => t === "editable") > -1) {
        docs[0].ref.update({
          exclusionOwner: this.getSocketId()
        });
      } else
        throw new ApplicationError(`Unsupported operation. order=${order}`);
    }
  }

  public async releaseTouch(order: number): Promise<void> {
    const docs = await this.getOrderDocs(order);
    this.checkOneDoc(order, docs);

    if (!docs[0].exists()) return;
    if (docs[0].data!.data) {
      docs[0].ref.update({
        exclusionOwner: null
      });
    } else {
      docs[0].ref.delete();
    }

    const index = this.touchList.findIndex(listOrder => listOrder === order);
    this.touchList.splice(index, 1);
  }

  public async add(order: number, inputInfo: T) {
    const docs = await this.getOrderDocs(order);
    this.checkOneDoc(order, docs);

    docs[0].ref.update({
      data: inputInfo
    });

    const index = this.touchList.findIndex(listOrder => listOrder === order);
    this.touchList.splice(index, 1);
  }

  public async update(order: number, inputInfo: T) {
    const docs = await this.getOrderDocs(order);
    this.checkOneDoc(order, docs);

    docs[0].ref.update({
      data: inputInfo
    });

    const index = this.touchList.findIndex(listOrder => listOrder === order);
    this.touchList.splice(index, 1);
  }

  public async delete(target: string | number): Promise<void> {
    const c = this.getCollection();
    const docs = (await c
      .where(typeof target === "string" ? "id" : "order", "==", target)
      .get()).docs;

    this.checkOneDoc(typeof target === "string" ? -1 : target, docs);
    await docs[0].ref.delete();
  }

  private getSocketId(): string {
    return this.socket.id;
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
