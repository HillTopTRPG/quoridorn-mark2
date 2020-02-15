declare module "skyway-js";
declare module "jszip";
declare module "file-saver";
declare module "vuedraggable";
declare module "vue-slider-component";
declare module "mustache";
declare module "mathjs";
declare module "moment";
declare module "crypto-js";
declare module "js-yaml";
declare module "uuid";
declare module "escape-html";
declare module "vue-password-strength-meter";
declare function parseInt(s: string, radix?: number): number;
declare module "socket.io";
declare var YT: any;

declare module "address" {
  type Point = {
    x: number;
    y: number;
  };

  type Size = {
    width: number;
    height: number;
  };

  type Rectangle = Point & Size;

  type Matrix = {
    column: number;
    row: number;
  };

  type Address = Point & Matrix;

  type Anchor =
    | "left-top"
    | "left-center"
    | "left-bottom"
    | "center-top"
    | "center"
    | "center-bottom"
    | "right-top"
    | "right-center"
    | "right-bottom";
}

declare module "compare" {
  type Operand =
    | { refType: "db-id-exist" }
    | { refType: "exclusion-check" }
    | { refType: "permission-check"; type: "view" | "edit" | "chmod" }
    | {
        refType: "db-search-exist";
        searchProperty: string;
        searchValue: string;
      }
    | {
        refType: "db-search-length";
        searchProperty: string;
        searchValue: string;
      }
    | { refType: "db-id-property"; property: string }
    | {
        refType: "db-search-property";
        searchProperty: string;
        searchValue: string;
        property: string;
      }
    | string
    | number
    | boolean;

  type SimpleCompareInfo = {
    lhs: Operand;
    rhs: Operand;
    isNot?: boolean;
  };

  type MultiCompareInfo = {
    operator: "and" | "or";
    list: SimpleCompareInfo[];
  };

  type CompareInfo = SimpleCompareInfo | MultiCompareInfo;
}

declare module "mode" {
  type ModeInfo = WheelModeInfo | ModalModeInfo | CreateRoomModeInfo;

  type WheelModeInfo = {
    type: "wheel";
    value: "on" | "off";
  };

  type ModalModeInfo = {
    type: "modal";
    value: "on" | "off";
  };

  type CreateRoomModeInfo = {
    type: "create-room";
    value: "on" | "off";
  };
}

declare module "task" {
  interface TaskDeclare {
    isIgniteWithParam: boolean;
    isLastValueCapture: boolean;
    isTraceFinally: boolean;
    isTest: boolean;
    statusList: StatusList;
  }

  interface TaskDeclareJson {
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

  interface Task<T, U> extends TaskDeclare, TaskInput<T> {
    readonly key: string;
    status: string;
    resolve: (resultList?: U[]) => void;
    reject: (reason?: any) => void;
  }

  type TaskResult<U> = {
    nextStatus?: string;
    value?: U;
  };
}

declare module "context" {
  import { Point } from "address";
  import { CompareInfo } from "compare";

  interface ContextTaskInfo extends Point {
    type: string;
    target: string | null;
  }

  // 項目(表示条件ありなし)
  type ContextTextItem<T> = {
    taskName?: string;
    text: string;
    taskArg: T;
    isViewCompare?: CompareInfo;
    isDisabledCompare?: CompareInfo;
    children?: ContextItemDeclareInfo[];
  };

  // 区切り線(表示条件あり)
  type ContextHrItem = {
    isViewCompare: CompareInfo;
  };

  type Reference = {
    ref: string;
  };

  type ContextItemDeclareBlock = {
    [type in string]: ContextItemDeclareInfo;
  };

  type ContextItemDeclareInfo = ContextTextItem<any> | ContextHrItem | null;

  type ContextItemDeclare = ContextItemDeclareInfo | Reference;

  type ContextDeclareInfo = ContextItemDeclare[] | Reference;

  type ContextDeclare = {
    [type in string]: ContextDeclareInfo;
  };
}
