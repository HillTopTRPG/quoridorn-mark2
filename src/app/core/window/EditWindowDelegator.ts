import LifeCycle from "@/app/core/decorator/LifeCycle";
import { findRequireByKey } from "@/app/core/utility/Utility";
import SocketFacade, {
  permissionCheck
} from "@/app/core/api/app-server/SocketFacade";
import WindowVue from "@/app/core/window/WindowVue";
import NekostoreCollectionController from "@/app/core/api/app-server/NekostoreCollectionController";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { Task, TaskResult } from "task";

export interface EditWindow<T> extends WindowVue<DataReference, boolean> {
  pullStoreData(data: StoreData<T>): void;
  pushStoreData(data: StoreData<T>): Promise<void>;
  isCommitAble(): boolean;
}

export default class EditWindowDelegator<T> {
  public docKey: string = "";
  public cc: NekostoreCollectionController<T> | null = null;
  public list: StoreData<T>[] = [];

  public constructor(protected parent: EditWindow<T>) {}

  @LifeCycle
  public async init(): Promise<void> {
    await this.parent.init();
    this.docKey = this.parent.windowInfo.args!.key;

    const type = this.parent.windowInfo.args!.type;
    this.list = GameObjectManager.instance.getList<T>(type)!;
    this.cc = SocketFacade.instance.getCC(type);
    if (this.list && this.cc) {
      console.log(type, "正常に起動");
    } else {
      console.log(
        type,
        `list: ${this.list ? "OK" : "null"}`,
        `cc: ${this.cc ? "OK" : "null"}`
      );
    }
    const data = findRequireByKey(this.list, this.docKey);

    if (this.parent.windowInfo.status === "window") {
      // 排他チェック
      if (data.exclusionOwner) {
        this.isProcessed = true;
        await this.parent.close();
        return;
      }

      // パーミッションチェック
      if (!permissionCheck(data, "edit")) {
        this.isProcessed = true;
        await this.parent.close();
        return;
      }
    }

    this.parent.pullStoreData(data);

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
      const data = findRequireByKey(this.list, this.docKey);
      await this.parent.pushStoreData(data);
      await this.cc!.update([data]);
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
}
