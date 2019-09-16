import Vue from "vue";

interface TaskInput<T> {
  type: string;
  owner: string;
  isPrivate: boolean;
  isExclusion: boolean;
  to?: string[];
  value?: T | void;
  statusList: StatusList;
}

type TaskProcessor<T> = (
  task: Task<T>,
  processorRemover: () => void
) => Promise<string | void>;

type TaskListenerContainer = {
  [P in string]: TaskProcessor<any>[];
};

interface TaskListenerInput<T> {
  type: string;
  processor: TaskProcessor<T>;
}

// type Status = "unapproved" | "processing";

type StatusList = string[];

export interface Task<T> extends TaskInput<T> {
  key: string;
  status: string;
  resolve: null | ((task: Task<T>) => void);
  reject: null | ((reason?: any) => void);
  time: {
    start: number;
    end: number;
  };
}

type TaskQueue = {
  queue: Task<any>[];
  nextKey: number;
  taskListener: TaskListenerContainer;
};

type TaskPromiseExecutor<T> = (
  resolve: (task: Task<T>) => void,
  reject: (reason?: any) => void
) => void;

const state: TaskQueue = {
  queue: [],
  nextKey: 0,
  taskListener: {}
};

function addTaskListener<T>(
  state: TaskQueue,
  payload: TaskListenerInput<T>
): void {
  const processorList: TaskProcessor<any>[] | undefined =
    state.taskListener[payload.type];
  if (processorList) {
    processorList.push(payload.processor);
  } else {
    Vue.set(state.taskListener, payload.type, [payload.processor]);
    window.console.log("【set taskListener】", payload.type);
  }
}

function removeTaskListener(state: TaskQueue, type: string): void {
  delete state.taskListener[type];
}

function resistTask<T>(
  { state }: { state: TaskQueue },
  {
    type,
    owner,
    isPrivate = true,
    isExclusion = false,
    to = [],
    value,
    statusList = ["unapproved", "processing", "finished"]
  }: TaskInput<T>
): Promise<Task<T>> {
  const key: string = `task-${state.nextKey++}`;

  const promiseExecutor: TaskPromiseExecutor<T> = async (
    resolve: (task: Task<T>) => void,
    reject: (reason?: any) => void
  ) => {
    const task: Task<T> = {
      type,
      owner,
      to,
      isPrivate,
      isExclusion,
      value,
      key,
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
    state.queue.push(task);

    const process = async () => {
      const eventName: string = `${type}-${task.status}`;
      window.console.log("+++ call event-status +++", eventName);

      // 登録された処理の呼び出し
      const processorList: TaskProcessor<T>[] | undefined =
        state.taskListener[eventName];
      let nextStatusIndex: number = -1;
      if (processorList) {
        const processorRemover = (taskProcessor: TaskProcessor<T>) => () => {
          const index: number = processorList.findIndex(
            (processor: TaskProcessor<T>) => processor === taskProcessor
          );
          processorList.splice(index, 1);
        };
        const processList: Promise<string | void>[] = processorList!.map(
          (taskProcessor: TaskProcessor<T>) =>
            taskProcessor(task, processorRemover(taskProcessor))
        );

        // 登録された処理を全部非同期実行して、次のステータスを受け取る
        const nextStatusList: (string | void)[] | void = await Promise.all(
          processList
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
                statusList.findIndex((status: string) => status === nextStatus)
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
      }
    };
    await process();
  };
  return new Promise(promiseExecutor);
}

export default {
  // privateデータは、データ保存時に public.room.members に含める
  state,
  actions: {
    resistTask
  },
  mutations: {
    addTaskListener,
    removeTaskListener
  },
  getters: {
    // nextKey: (state: TaskQueue): number => state.nextKey,
    // taskListenerContainer: (state: TaskQueue): TaskListenerContainer => state.taskListener,
    taskQueue: (state: TaskQueue): Task<any>[] => state.queue
  }
};
