import { Task, TaskResult } from "task";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import WindowVue from "@/app/core/window/WindowVue";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";

export interface AddWindow<T> extends WindowVue<T, boolean> {
  setStoreData(data: T): void;
  getStoreDataList(): Promise<DelegateStoreData<T>[]>;
  isCommitAble(): boolean;
}

export default class AddWindowDelegator<T> {
  public constructor(protected parent: AddWindow<T>) {}

  protected isProcessed: boolean = false;

  @LifeCycle
  public async init(): Promise<void> {
    await this.parent.init();
    const data = this.parent.windowInfo.args;
    if (data) {
      this.parent.setStoreData(data);
    }
  }

  public async commit(): Promise<string[] | null> {
    if (!this.parent.isCommitAble()) return null;
    const storeDataList = await this.parent.getStoreDataList();
    const keyList: string[] = [];
    if (storeDataList.length) {
      const cc = SocketFacade.instance.getCC(storeDataList[0].collection);
      keyList.push(...(await cc.addDirect(storeDataList)));
    }
    this.isProcessed = true;
    await this.parent.finally(true);
    return keyList;
  }

  public async windowCloseClosing(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value !== this.parent.windowInfo.key) return;
    if (!this.isProcessed) {
      this.isProcessed = true;
      await this.rollback();
    }
  }

  public async rollback(): Promise<void> {
    if (!this.isProcessed) {
      this.isProcessed = true;
      await this.parent.finally(false);
    }
  }
}
