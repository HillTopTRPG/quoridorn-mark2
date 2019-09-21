import {
  Task,
  TaskInput,
  TaskListenerContainer,
  TaskProcess,
  TaskPromiseExecutor
} from "@/@types/task";

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
  private nextKey: number = 0;

  /**
   * タスクリスナーを追加する
   * @param type
   * @param process
   */
  public addTaskListener<T>(type: string, process: TaskProcess<T>): void {
    let processList: TaskProcess<any>[] | undefined = this.taskListener[type];
    if (!processList) {
      this.taskListener[type] = processList = [];
    }
    processList.push(process);
  }

  /**
   * タスクリスナーを削除する
   * @param type
   */
  public removeTaskListener(type: string): void {
    delete this.taskListener[type];
  }

  /**
   * タスクを登録する
   * @param type
   * @param owner
   * @param isPrivate
   * @param isExclusion
   * @param to
   * @param value
   * @param statusList
   */
  public resistTask<T>({
    type,
    owner,
    isPrivate = true,
    isExclusion = false,
    to = [],
    value,
    statusList = ["unapproved", "processing", "finished"]
  }: TaskInput<T>): Promise<Task<T>> {
    const key: string = `task-${this.nextKey++}`;

    const promiseExecutor: TaskPromiseExecutor<T> = async (
      resolve: (task: Task<T>) => void,
      reject: (reason?: any) => void
    ) => {
      const task: Task<T> = {
        key,
        type,
        owner,
        to,
        isPrivate,
        isExclusion,
        value,
        statusList,
        status: statusList[0],
        resolve: (task: Task<T>) => {
          resolve(task);
          task.resolve = () => {};
          task.reject = () => {};
        },
        reject: (reason?: any) => {
          reject(reason);
          task.resolve = () => {};
          task.reject = () => {};
        },
        time: {
          start: 0,
          end: 0
        }
      };
      this.taskQueue.push(task);

      const process = async () => {
        const eventName: string = `${type}-${task.status}`;
        window.console.log("+++ call event-status +++", eventName);

        // 登録された処理の呼び出し
        const processList: TaskProcess<T>[] | undefined = this.taskListener[
          eventName
        ];
        let nextStatusIndex: number = -1;
        if (processList) {
          const processRemover = (taskProcess: TaskProcess<T>) => () => {
            const index: number = processList.findIndex(
              (process: TaskProcess<T>) => process === taskProcess
            );
            processList.splice(index, 1);
          };
          const promiseList: Promise<string | void>[] = processList!.map(
            (taskProcess: TaskProcess<T>) =>
              taskProcess(task, processRemover(taskProcess))
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
                  statusList.findIndex(
                    (status: string) => status === nextStatus
                  )
                )
              );
            }
          }
        }

        // 処理が登録されてなかったら、次のステータスを採用
        if (nextStatusIndex === -1) {
          const currentIndex: number = statusList.findIndex(
            (status: string) => status === task.status
          );
          nextStatusIndex = currentIndex + 1;
        }

        // 最終ステータスに到達するまでステータスを進めながら呼び出していく
        const nextStatus: string = statusList[nextStatusIndex];
        // window.console.log(nextStatus);
        if (nextStatus) {
          task.status = nextStatus;
          await process();
        } else {
          // 最終ステータスの処理が終わったらキューから削除する
          const index: number = this.taskQueue.findIndex(
            (task: Task<T>) => task.key === key
          );
          this.taskQueue.splice(index, 1);
        }
      };
      await process();
    };
    return new Promise(promiseExecutor);
  }
}
