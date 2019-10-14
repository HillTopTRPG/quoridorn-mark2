interface TaskDeclare {
  isIgniteWithParam: boolean;
  isLastValueCapture: boolean;
  isTraceFinally: boolean;
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

type TaskProcess<T, U> = (
  task: Task<T, U>,
  param: any,
  processorRemover: () => void
) => Promise<TaskResult<U>>;

type TaskListenerContainer = {
  [type in string]: {
    [key in string]: TaskProcess<any, any>[];
  };
};

type TaskListenerParameterContainer = {
  [P in string]: any[];
};

type StatusList = string[];

export interface Task<T, U> extends TaskDeclare, TaskInput<T> {
  readonly key: string;
  status: string;
  resolve: (resultList?: U[]) => void;
  reject: (reason?: any) => void;
}

type TaskPromiseExecutor<U> = (
  resolve: (resultList?: U[]) => void,
  reject: (reason?: any) => void
) => void;

type TaskResult<U> = {
  nextStatus?: string;
  value?: U;
};
