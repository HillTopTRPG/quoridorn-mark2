interface TaskInput<T> {
  type: string;
  owner: string;
  isPrivate: boolean;
  isExclusion: boolean;
  isIgniteWithParam: boolean;
  isLastValueCapture: boolean;
  to?: string[];
  value: T | null;
  statusList: StatusList;
}

type TaskProcess<T> = (
  task: Task<T>,
  param: any,
  processorRemover: () => void
) => Promise<string | void>;

type TaskListenerContainer = {
  [P in string]: TaskProcess<any>[];
};

type TaskListenerParameterContainer = {
  [P in string]: any[];
};

type StatusList = string[];

export interface Task<T> extends TaskInput<T> {
  readonly key: string;
  status: string;
  resolve: null | ((task: Task<T>) => void);
  reject: null | ((reason?: any) => void);
  time: {
    start: number;
    end: number;
  };
}

type TaskPromiseExecutor<T> = (
  resolve: (task: Task<T>) => void,
  reject: (reason?: any) => void
) => void;
