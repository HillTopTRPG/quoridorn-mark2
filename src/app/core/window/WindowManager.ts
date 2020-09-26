import {
  WindowDeclareInfo,
  WindowInfo,
  WindowOpenInfo,
  WindowSize,
  WindowTableInfo
} from "@/@types/window";
import {
  calcWindowPosition,
  createPoint,
  createRectangle,
  getWindowSize
} from "../utility/CoordinateUtility";
import { getCssPxNum } from "../css/Css";
import TaskManager from "../task/TaskManager";
import { ApplicationError } from "../error/ApplicationError";
import { clone } from "../utility/PrimaryDataUtility";
import { findRequireByKey } from "../utility/Utility";
import { Point } from "@/@types/store-data-optional";

type WindowDeclareInfoContainer = {
  [type: string]: WindowDeclareInfo;
};

const windowDeclareInfo: WindowDeclareInfoContainer = require("../window.yaml");

export default class WindowManager {
  // シングルトン
  public static get instance(): WindowManager {
    if (!WindowManager._instance) WindowManager._instance = new WindowManager();
    return WindowManager._instance;
  }
  private static _instance: WindowManager;

  public static createFilter = (status: string) => (
    list: WindowInfo<unknown>[]
  ) => list.filter(info => info.status.indexOf(status) > -1);

  // コンストラクタの隠蔽
  private constructor() {}

  private readonly windowDeclareInfoContainer = Object.seal(windowDeclareInfo);
  private readonly __windowInfoList: WindowInfo<any>[] = [];
  private keyCount: number = 0;
  private __activeWindowKey: string | null = null;

  public get windowInfoList() {
    return this.__windowInfoList;
  }

  public get activeWindow() {
    if (!this.__activeWindowKey) return null;
    return this.getWindowInfo(this.__activeWindowKey);
  }

  public getOpenedWindowInfo(type: string): WindowInfo<any> | null {
    return this.__windowInfoList.find(wi => wi.type === type) || null;
  }

  public async activeWindowForce(type: string): Promise<void> {
    const windowInfo = this.getOpenedWindowInfo(type);
    if (windowInfo) {
      TaskManager.instance
        .ignition<string, never>({
          type: "window-active",
          owner: "Quoridorn",
          value: windowInfo.key
        })
        .then();
    } else {
      this.open<WindowOpenInfo<void>>({ type });
    }
  }

  public set activeWindowKey(windowKey: string) {
    this.__activeWindowKey = windowKey;
  }

  public getWindowInfo<T>(key: string): WindowInfo<T> {
    return findRequireByKey(this.__windowInfoList, key) as WindowInfo<T>;
  }

  private resist<T>(
    type: string,
    declareInfo: WindowDeclareInfo,
    taskKey?: string,
    args?: T
  ): string {
    if (!declareInfo) {
      throw new ApplicationError(`No such window type='${type}'`);
    }
    declareInfo = clone(declareInfo)!;
    const setDefault = (size: WindowSize | undefined) => {
      if (!size) return;
      size.widthPx = size.widthPx || 0;
      size.widthEm = size.widthEm || 0;
      size.widthRem = size.widthRem || 0;
      size.widthScrollBar = size.widthScrollBar || 0;
      size.heightPx = size.heightPx || 0;
      size.heightEm = size.heightEm || 0;
      size.heightRem = size.heightRem || 0;
      size.heightScrollBar = size.heightScrollBar || 0;
    };
    setDefault(declareInfo.size);
    setDefault(declareInfo.minSize);
    setDefault(declareInfo.maxSize);
    const tableInfoList: WindowTableInfo[] = declareInfo.tableInfoList.map(
      tableInfo => ({
        selectLineKey: null,
        hoverLineIndex: null,
        operateDividerIndex: null,
        columnWidthList: tableInfo.columnList.map(column => column.width)
      })
    );

    const windowSize = declareInfo.size;
    const position = declareInfo.position;
    const menuHeight = getCssPxNum("--menu-bar-height");
    const windowSizePx = getWindowSize(windowSize);
    const point = calcWindowPosition(position, windowSizePx, menuHeight);

    const key = `window-${this.keyCount++}`;
    this.__windowInfoList.push({
      key,
      taskKey,
      title: "",
      status: "window",
      message: declareInfo.message,
      args,
      type,
      declare: declareInfo,
      ...point,
      diffRect: createRectangle(0, 0, 0, 0),
      ...windowSize,
      order: this.__windowInfoList.length,
      paneOrder: this.__windowInfoList.length,
      paneY: 0,
      isLocked: false,
      isMinimized: false,
      minimizeIndex: 0,
      isMinimizeAnimationEnd: false,
      tableInfoList
    });
    this.arrangePoint(key);
    return key;
  }

  public arrangePointAll() {
    this.__windowInfoList.forEach((wi, index) => {
      wi.isMinimized = false;
      this.arrangePoint(wi.key, true);
      wi.order = index;
    });
    this.activeWindowKey = this.__windowInfoList[
      this.__windowInfoList.length - 1
    ].key;
  }

  public arrangePoint(targetKey: string, flg: boolean = false) {
    const target = findRequireByKey(this.__windowInfoList, targetKey);
    const position = target.declare.position;
    if (flg) {
      const menuHeight = getCssPxNum("--menu-bar-height");
      const point = calcWindowPosition(
        position,
        getWindowSize(target),
        menuHeight
      );
      target.x = point.x;
      target.y = point.y;
    }
    this.__windowInfoList.forEach(info => {
      if (info.key === targetKey) return;
      if (info.isMinimized) return;
      if (info.status !== "window") return;
      if (info.x !== target.x || info.y !== target.y) return;

      const arrangeDistance = getCssPxNum("--window-title-height");
      const arrange: Point = createPoint(arrangeDistance, arrangeDistance);

      if (typeof position === "string") {
        if (position.toString().indexOf("right") > -1) arrange.x *= -1;
        if (position.toString().indexOf("bottom") > -1) arrange.y *= -1;
      }
      target.x += arrange.x;
      target.y += arrange.y;
      this.arrangePoint(targetKey, false);
    });
  }

  public open<T>(info: WindowOpenInfo<T>, taskKey?: string): string {
    if (!info)
      throw new ApplicationError(
        "Illegal arguments error. WindowManager.instance#open"
      );
    const type = info.type;
    return this.resist<T>(
      type,
      this.windowDeclareInfoContainer[type],
      taskKey,
      info.args
    );
  }

  public async destroy() {
    const promiseList = this.windowInfoList.map(info => {
      return TaskManager.instance.ignition<string, never>({
        type: "window-close",
        owner: "Quoridorn",
        value: info.key
      });
    });
    await Promise.all(promiseList);
  }
}
