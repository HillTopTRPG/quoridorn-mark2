declare module "jszip";
declare module "vuedraggable";
declare module "vue-slider-component";
declare module "mustache";
declare module "mathjs";
declare module "moment";
declare module "js-yaml";
declare module "uuid";
declare module "escape-html";
declare module "vue-password-strength-meter";
declare module "socket.io";
declare module "create-keyframe-animation";
declare module "url-join";
declare module "body-scroll-lock";
declare module "jsonp";
declare var swal: (
  ...pref: (
    | string
    | {
        title?: string;
        text?: string;
        icon?: "warning" | "error" | "success" | "info";
        button?: string;
        buttons?: string[];
        dangerMode?: boolean;
      }
  )[]
) => Promise<boolean>;
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
    | { refType: "variable-myself" }
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
    | { refType: "db-id-owner-property"; level: number; property: string }
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
  type ModeInfo =
    | ModalModeInfo
    | ThrowParabolaModeInfo
    | ViewCardDeckInfo
    | DropPieceModeInfo
    | ProcessInfo
    | SpecialDragMode;

  type ModalModeInfo = {
    type: "modal";
    value: "on" | "off";
  };

  type ThrowParabolaModeInfo = {
    type: "throw-parabola";
    value: "on" | "off";
  };

  type ViewCardDeckInfo = {
    type: "view-card-deck";
    value: {
      flag: "on" | "off";
      cardDeckId: string;
    };
  };

  type DropPieceModeInfo = {
    type: "drop-piece";
    value: "on" | "off";
  };

  type ProcessInfo = {
    type: "view-progress";
    value: {
      message: string;
      all: number;
      current: number;
    };
  };

  type SpecialDragMode = {
    type: "special-drag";
    value: "on" | "off";
  };
}

declare module "task-info" {
  type ThrowParabolaInfo = {
    key?: string;
    char: string;
    radius: number;
    ratio: number;
  };

  type BgmPlayInfo = {
    id: string;
  };

  type BgmStandByInfo = {
    id: string;
  };

  type StandByReturnInfo = {
    windowKey: string;
  };

  type TabMoveInfo = {
    windowKey: string;
    addIndex: 1 | -1;
  };

  type RowSelectInfo = {
    windowKey: string;
    addIndex: 1 | -1;
  };

  type DropPieceInfo = {
    type: string;
    dropWindow: string;
    offsetX: number;
    offsetY: number;
    pageX: number;
    pageY: number;
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
    pieceId?: string;
  }

  // 項目(表示条件ありなし)
  type ContextTextItem<T> = {
    text: string;
    isRawText?: boolean;
    taskName?: string;
    isViewCompare?: CompareInfo;
    isDisabledCompare?: CompareInfo;
    taskArg: T;
    argRef?: string;
    children?: ContextItemDeclare[];
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
