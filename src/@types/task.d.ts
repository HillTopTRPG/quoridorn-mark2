interface TaskInput<T> {
  type: string;
  owner: string;
  isPrivate: boolean;
  isExclusion: boolean;
  to?: string[];
  value?: T | null;
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
