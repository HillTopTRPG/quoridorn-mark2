interface TaskDeclare {
  isPrivate: boolean;
  isExclusion: boolean;
  isIgniteWithParam: boolean;
  isLastValueCapture: boolean;
  isTest: boolean;
  statusList: StatusList;
}

export interface TaskDeclareJson {
  types: string[];
  taskAttribute: TaskDeclare;
}

interface TaskInput<T> {
  type: string;
  owner: string;
  to?: string[];
  value: T | null;
}

type TaskProcess<T> = (
  task: Task<T>,
  param: any,
  processorRemover: () => void
) => Promise<string | void>;

type TaskListenerContainer = {
  [type in string]: {
    [key in string]: TaskProcess<any>[];
  };
};

type TaskListenerParameterContainer = {
  [P in string]: any[];
};

type StatusList = string[];

export interface Task<T> extends TaskDeclare, TaskInput<T> {
  readonly key: string;
  status: string;
  resolve: null | ((task: Task<T>) => void);
  reject: null | ((reason?: any) => void);
}

type TaskPromiseExecutor<T> = (
  resolve: (task: Task<T>) => void,
  reject: (reason?: any) => void
) => void;
