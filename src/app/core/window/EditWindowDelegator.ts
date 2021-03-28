import LifeCycle from "@/app/core/decorator/LifeCycle";
import { findRequireByKey } from "@/app/core/utility/Utility";
import SocketFacade, {
  permissionCheck
} from "@/app/core/api/app-server/SocketFacade";
import WindowVue from "@/app/core/window/WindowVue";
import NekostoreCollectionController from "@/app/core/api/app-server/NekostoreCollectionController";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { Task, TaskResult } from "task";
import LanguageManager from "@/LanguageManager";

export interface EditWindow<T> extends WindowVue<DataReference, boolean> {
  pullStoreData(data: StoreData<T>): void;
  pushStoreData(data: StoreData<T>): Promise<void>;
  isCommitAble(): boolean;
  isDuplicate(): boolean;
}

export default class EditWindowDelegator<T, U extends keyof T> {
  public docKey: string = "";
  public cc: NekostoreCollectionController<T> | null = null;
  public list: StoreData<T>[] = [];
  public obj: StoreData<T> | null = null;

  public constructor(
    protected parent: EditWindow<T>,
    protected uniqueProperty: U
  ) {}

  @LifeCycle
  public async init(): Promise<void> {
    await this.parent.init();
    this.docKey = this.parent.windowInfo.args!.key;

    const type = this.parent.windowInfo.args!.type;
    this.list = GameObjectManager.instance.getList<T>(type)!;
    this.cc = SocketFacade.instance.getCC(type);
    this.obj = findRequireByKey(this.list, this.docKey);

    if (this.parent.windowInfo.status === "window") {
      // 排他チェック
      if (this.obj.exclusionOwner) {
        this.isProcessed = true;
        await this.parent.close();
        return;
      }

      // パーミッションチェック
      if (!permissionCheck(this.obj, "edit")) {
        this.isProcessed = true;
        await this.parent.close();
        return;
      }
    }

    this.parent.pullStoreData(this.obj);

    if (this.parent.windowInfo.status === "window") {
      try {
        await this.cc!.touchModify([this.docKey]);
      } catch (err) {
        console.warn(err);
        this.isProcessed = true;
        await this.parent.close();
      }
    }
  }

  protected isProcessed: boolean = false;

  public async commit(): Promise<void> {
    console.log("commit", this.parent.isCommitAble());
    if (this.parent.isCommitAble()) {
      await this.parent.pushStoreData(this.obj!);
      await this.cc!.update([this.obj!]);
    }
    this.isProcessed = true;
    await this.parent.finally(true);
  }

  public async windowCloseClosing(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value !== this.parent.windowInfo.key) return;
    if (!this.isProcessed) {
      this.isProcessed = true;
      await this.rollback();
      await this.parent.finally(false);
    }
  }

  public async rollback(): Promise<void> {
    try {
      await this.cc!.releaseTouch([this.docKey!]);
    } catch (err) {
      // nothing
    }
    if (!this.isProcessed) {
      this.isProcessed = true;
      await this.parent.finally(false);
    }
  }

  public isDuplicateBasic(value: T[U]): boolean {
    return this.list.some(
      cp => cp.data![this.uniqueProperty] === value && cp.key !== this.docKey
    );
  }

  public onChangeIsDuplicateBasic(): string {
    const isDuplicate = this.parent.isDuplicate();
    return LanguageManager.instance.getText(
      `message.${isDuplicate ? "duplicate" : "original"}`,
      {
        text: isDuplicate
          ? LanguageManager.instance.getText(`label.${this.uniqueProperty}`)
          : this.obj!.data![this.uniqueProperty]
      }
    );
  }
}
