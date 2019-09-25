import {
  Task,
  TaskInput,
  TaskListenerContainer,
  TaskListenerParameterContainer,
  TaskProcess,
  TaskPromiseExecutor
} from "@/@types/task";

export type MouseMoveParam = {
  key: string;
  type: string;
};

export default class TaskManager {
  // シングルトン
  public static get instance(): TaskManager {
    if (!this._instance) this._instance = new TaskManager();
    return this._instance;
  }
  private static _instance: TaskManager;

  // コンストラクタの隠蔽
  private constructor() {}

  private readonly taskQueue: Task<any>[] = [];
  private readonly taskListener: TaskListenerContainer = {};
  private readonly taskParam: TaskListenerParameterContainer = {};
  private readonly taskLastValue: { [type: string]: any } = {};
  private nextKey: number = 0;

  /**
   * タスクリスナーを追加する
   * @param type
   * @param process
   * @param key
   */
  public addTaskListener<T>(
    type: string,
    process: TaskProcess<T>,
    key: string
  ): void {
    let processContainer = this.taskListener[type];
    if (!processContainer) {
      this.taskListener[type] = processContainer = {};
    }
    let processList = processContainer[key];
    if (!processList) {
      processContainer[key] = processList = [];
    }
    processList.push(process);
  }

  /**
   * タスクリスナーを削除する
   * @param type
   * @param key
   */
  public removeTaskListener(type: string, key?: string): void {
    if (!key) {
      delete this.taskListener[type];
      return;
    }

    if (this.taskListener[type]) {
      delete this.taskListener[type][key];
    }
  }

  /**
   * タスクパラメータを設定する
   * @param type
   * @param param
   */
  public setTaskParam<T>(type: string, param: T): void {
    this.taskParam[type] = param as any;
  }

  /**
   * タスクの最後の値を取得する（タスク登録時にオプションを指定しないとundefinedになる）
   * @param type
   */
  public getLastValue<T>(type: string): T {
    return this.taskLastValue[type] as T;
  }

  /**
   * タスクを登録する
   * @param taskInput タスク情報
   */
  public resistTask<T>(taskInput: TaskInput<T>): Promise<Task<T>> {
    const key: string = `task-${this.nextKey++}`;
    if (taskInput.isLastValueCapture) {
      this.taskLastValue[taskInput.type] = JSON.parse(
        JSON.stringify(taskInput.value)
      );
    }

    // ちゃんと処理されないタスクを感知する
    const timeoutID = window.setTimeout(() => {
      window.console.error(`🐧💢${taskInput.type}`);
    }, 300);

    const promiseExecutor: TaskPromiseExecutor<T> = async (
      resolve: (task: Task<T>) => void,
      reject: (reason?: any) => void
    ) => {
      const task: Task<T> = {
        ...taskInput,
        key,
        status: taskInput.statusList[0],
        resolve: (task: Task<T>) => {
          resolve(task);
          clearTimeout(timeoutID);
          task.resolve = () => {};
          task.reject = () => {};
        },
        reject: (reason?: any) => {
          reject(reason);
          clearTimeout(timeoutID);
          task.resolve = () => {};
          task.reject = () => {};
        },
        time: {
          start: 0,
          end: 0
        }
      };
      this.taskQueue.push(task);
      await this.process(task);
    };
    return new Promise(promiseExecutor);
  }

  private dequeTask(key: string) {
    this.taskQueue.splice(this.taskQueue.findIndex(t => t.key === key), 1);
  }

  private async process<T>(task: Task<T>) {
    const nextStatusIndex: number = await this.callProcess(task);
    if (!task.resolve || !task.reject) {
      this.dequeTask(task.key);
      return;
    }

    let nextStatus: string;

    // 処理が登録されてなかったら、次のステータスを採用
    if (nextStatusIndex === -1) {
      const currentIndex: number = task.statusList.findIndex(
        (status: string) => status === task.status
      );
      nextStatus = task.statusList[currentIndex + 1];

      // 最終ステータスの処理が実施されなかった場合はここでresolve
      if (!nextStatus && task.resolve) task.resolve(task);
    } else {
      nextStatus = task.statusList[nextStatusIndex];
    }

    // 最終ステータスに到達するまでステータスを進めながら呼び出していく
    if (nextStatus) {
      task.status = nextStatus;
      await this.process(task);
    } else {
      // 最終ステータスの処理が終わったらキューから削除する
      this.dequeTask(task.key);
    }
  }

  private async callProcess<T>(task: Task<T>): Promise<number> {
    const eventName: string = `${task.type}-${task.status}`;
    let logText: string = `🐧💣${eventName}`;
    let nextStatusIndex: number = -1;

    // 登録された処理の呼び出し
    const param: any = this.taskParam[eventName];
    if (task.isIgniteWithParam && !param) {
      // パラメータ必須タスクでパラメータがないため実施しない
      window.console.log(`${logText}🏷️🈚`);
      return nextStatusIndex;
    }
    const processContainer: {
      [key in string]: TaskProcess<any>[];
    } = this.taskListener[eventName];
    const reducer = (a: TaskProcess<T>[], c: TaskProcess<T>[]) => a.concat(c);
    const processList: TaskProcess<T>[] = processContainer
      ? Object.values(processContainer).reduce(reducer)
      : [];
    if (!processList || !processList.length) {
      // 登録された処理がない
      window.console.log(`${logText}🈳`);
      return nextStatusIndex;
    }

    // window.console.warn(
    //   `${logText}💥`,
    //   task.value,
    //   "🏷️" + (param ? "" : "️🈚"),
    //   param || ""
    // );
    const processRemover = (taskProcess: TaskProcess<T>) => () => {
      const index: number = processList.findIndex(
        (process: TaskProcess<T>) => process === taskProcess
      );
      processList.splice(index, 1);
    };
    const promiseList: Promise<string | void>[] = processList.map(
      (taskProcess: TaskProcess<T>) =>
        taskProcess(task, param, processRemover(taskProcess))
    );

    // 登録された処理を全部非同期実行して、次のステータスを受け取る
    const nextStatusList: (string | void)[] | void = await Promise.all(
      promiseList
    ).catch((reason: any) => {
      if (task.reject) {
        task.reject(reason);
        task.reject = null;
        task.resolve = null;
        task.status = "rejected";
      }
    });

    // 受け取った次のステータスの中で最も進んでいるものを採用
    if (nextStatusList && nextStatusList.length) {
      const useStatusList: string[] = nextStatusList.filter(
        (status: string | void) => status
      ) as string[];
      if (useStatusList.length) {
        nextStatusIndex = Math.max(
          ...useStatusList.map((nextStatus: string) =>
            task.statusList.findIndex((status: string) => status === nextStatus)
          )
        );
      }
    }
    return nextStatusIndex;
  }
}
