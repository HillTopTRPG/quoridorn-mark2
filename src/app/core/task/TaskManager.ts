import {
  Task,
  TaskDeclareJson,
  TaskInput,
  TaskListenerContainer,
  TaskListenerParameterContainer,
  TaskProcess,
  TaskPromiseExecutor,
  TaskResult
} from "@/@types/task";
import { ApplicationError } from "@/app/core/error/ApplicationError";

const uuid = require("uuid");

const taskDeclareJsonList: TaskDeclareJson[] = require("./task.yaml");

export type MouseMoveParam = {
  key: string;
  type: string | null;
};

export default class TaskManager {
  // シングルトン
  public static get instance(): TaskManager {
    if (!TaskManager._instance) TaskManager._instance = new TaskManager();
    return TaskManager._instance;
  }
  private static _instance: TaskManager;

  // コンストラクタの隠蔽
  private constructor() {}

  private readonly taskStore: { [type: string]: Task<any, any>[] } = {};
  private readonly taskListener: TaskListenerContainer = {};
  private readonly taskParam: TaskListenerParameterContainer = {};
  private readonly taskLastValue: { [type: string]: any } = {};
  private readonly taskDeclareJsonList = taskDeclareJsonList;

  public getTask(type: string, taskKey: string): Task<unknown, unknown> | null {
    const list = this.taskStore[type];
    if (!list) return null;
    return list.filter(task => task.key === taskKey)[0] || null;
  }

  /**
   * タスクリスナーを追加する
   * @param type
   * @param process
   * @param key
   */
  public addTaskListener<T, U>(
    type: string,
    process: TaskProcess<T, U>,
    key: string
  ): void {
    let processContainer = this.taskListener[type];
    if (!processContainer) this.taskListener[type] = processContainer = {};

    let processList = processContainer[key];
    if (!processList) processContainer[key] = processList = [];

    processList.push(process);
  }

  /**
   * タスクリスナーを削除する
   * @param type
   * @param key
   */
  public removeTaskListener(type: string, key?: string): void {
    if (key) {
      delete this.taskListener[type][key];
      return;
    }

    delete this.taskListener[type];
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
   * タスク実行
   * @param taskInput タスク情報
   */
  public async ignition<T, U>(taskInput: TaskInput<T>): Promise<U[]> {
    const taskKey: string = uuid.v4();
    const taskDeclareJson = this.taskDeclareJsonList.filter(
      tdj => tdj.types.findIndex(t => t === taskInput.type) > -1
    )[0];
    if (!taskDeclareJson) {
      throw new ApplicationError(`No such declare. task='${taskInput.type}'`);
    }
    const taskDeclare = taskDeclareJson.taskAttribute;
    if (!taskDeclare) {
      throw new ApplicationError(`Illegal task.yaml. task='${taskInput.type}'`);
    }
    if (taskDeclare.isLastValueCapture) {
      this.taskLastValue[taskInput.type] = JSON.parse(
        JSON.stringify(taskInput.value)
      );
    }

    // 一定時間以上放置されたタスクを警告する
    const timeoutID = window.setTimeout(() => {
      window.console.warn(`🐧💢${taskInput.type}`);
    }, 300);

    return new Promise(
      async (
        resolve: (resultList?: U[]) => void,
        reject: (reason?: any) => void
      ) => {
        const finallyFunc = () => {
          clearTimeout(timeoutID);
          task.resolve = () => {};
          task.reject = () => {};
          this.dequeTask(taskInput.type, taskKey);
        };
        const task: Task<T, U> = {
          ...taskInput,
          ...taskDeclare,
          key: taskKey,
          status: taskDeclare.statusList[0],
          resolve: (resultList?: U[]) => {
            resolve(resultList);
            finallyFunc();
          },
          reject: (reason?: any) => {
            reject(reason);
            finallyFunc();
          }
        };
        let taskList = this.taskStore[taskInput.type];
        if (!taskList) taskList = this.taskStore[taskInput.type] = [];
        taskList.push(task);
        await this.process(task);
      }
    );
  }

  private dequeTask(type: string, taskKey: string) {
    const list = this.taskStore[type];
    const index = list.findIndex(task => task.key === taskKey);
    list.splice(index, 1);
  }

  private async process<T, U>(task: Task<T, U>): Promise<U[] | null> {
    try {
      const resultList = await this.callProcess<T, U>(task);
      if (!task.resolve || !task.reject) return null;

      // 受け取った次のステータスの中で最も進んでいるものを採用
      let nextStatusIndex = -1;
      let processResult: U[] = [];
      if (resultList && resultList.length) {
        const useStatusList: string[] = resultList
          .filter(result => result && result.nextStatus)
          .map(result => result.nextStatus) as string[];
        if (useStatusList.length) {
          nextStatusIndex = Math.max(
            ...useStatusList.map((nextStatus: string) =>
              task.statusList.findIndex(
                (status: string) => status === nextStatus
              )
            )
          );
        }
        processResult = resultList
          .filter(result => result && result.value)
          .map(result => result.value) as U[];
      }

      let nextStatus: string;

      // 処理が登録されてなかったら、次のステータスを採用
      if (nextStatusIndex === -1) {
        const currentIndex: number = task.statusList.findIndex(
          (status: string) => status === task.status
        );

        nextStatus = task.statusList[currentIndex + 1];
      } else {
        nextStatus = task.statusList[nextStatusIndex];
      }

      // 最終ステータスに到達するまでステータスを進めながら呼び出していく
      if (nextStatus) {
        task.status = nextStatus;
        return await this.process(task);
      } else {
        // 最終ステータスの処理が終わった
        if (!task.isTraceFinally) {
          task.resolve(processResult);
        }
      }
      return processResult;
    } catch (err) {
      task.reject(err);
      throw err;
    }
  }

  private async callProcess<T, U>(
    task: Task<T, U>
  ): Promise<TaskResult<U>[] | null> {
    const eventName: string = `${task.type}-${task.status}`;
    let logText: string = `🐧💣${eventName}`;

    // 登録された処理の呼び出し
    const param: any = this.taskParam[eventName];
    if (task.isIgniteWithParam && !param) {
      // パラメータ必須タスクでパラメータがないため実施しない
      if (task.isTest) window.console.log(`${logText}🏷️🈚`);
      return null;
    }
    const processContainer: {
      [key in string]: TaskProcess<any, any>[];
    } = this.taskListener[eventName];
    const reducer = (a: TaskProcess<T, U>[], c: TaskProcess<T, U>[]) =>
      a.concat(c);
    const processList: TaskProcess<T, U>[] = processContainer
      ? Object.values(processContainer).reduce(reducer)
      : [];
    if (!processList || !processList.length) {
      // 登録された処理がない
      if (task.isTest) window.console.log(`${logText}🈳`);
      return null;
    }

    if (task.isTest) {
      window.console.warn(
        `${logText}💥`,
        task.value,
        "🏷️" + (param ? "" : "️🈚"),
        param || ""
      );
    }
    const processRemover = (taskProcess: TaskProcess<T, U>) => () => {
      const index: number = processList.findIndex(
        (process: TaskProcess<T, U>) => process === taskProcess
      );
      processList.splice(index, 1);
    };
    const promiseList: Promise<TaskResult<U>>[] = processList.map(
      (taskProcess: TaskProcess<T, U>) =>
        taskProcess(task, param, processRemover(taskProcess))
    );

    // 登録された処理を全部非同期実行する
    return await Promise.all(promiseList);
  }
}
