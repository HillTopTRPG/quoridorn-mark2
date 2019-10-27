import {
  WindowDeclareInfo,
  WindowInfo,
  WindowOpenInfo,
  WindowTableInfo
} from "@/@types/window";
import { calcWindowPosition, createPoint, getWindowSize } from "../Coordinate";
import { Point } from "@/@types/address";
import { getCssPxNum } from "../Css";
import { ApplicationError } from "@/app/core/error/ApplicationError";
import TaskManager from "@/app/core/task/TaskManager";

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
  private readonly __windowInfoList: WindowInfo<unknown>[] = [];
  private keyCount: number = 0;
  private __activeWindowKey: string | null = null;

  public get windowInfoList() {
    return this.__windowInfoList;
  }

  public get activeWindow() {
    if (!this.__activeWindowKey) return null;
    return this.getWindowInfo(this.__activeWindowKey);
  }

  public set activeWindowKey(windowKey: string) {
    this.__activeWindowKey = windowKey;
  }

  public getWindowInfo<T>(key: string): WindowInfo<T> {
    return this.__windowInfoList.filter(
      info => info.key === key
    )[0] as WindowInfo<T>;
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
    declareInfo = JSON.parse(JSON.stringify(declareInfo)) as WindowDeclareInfo;
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
    const point = calcWindowPosition(
      position,
      getWindowSize(windowSize),
      menuHeight
    );

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

  public arrangePoint(targetKey: string) {
    const target = this.__windowInfoList.filter(
      info => info.key === targetKey
    )[0];
    this.__windowInfoList.forEach(info => {
      if (info.key === targetKey) return;
      if (info.isMinimized) return;
      if (info.status !== "window") return;
      if (info.x !== target.x || info.y !== target.y) return;

      const arrangeDistance = getCssPxNum("--window-title-height");
      const arrange: Point = createPoint(arrangeDistance, arrangeDistance);

      const position = target.declare.position;
      if (typeof position === "string") {
        if (position.toString().indexOf("right") > -1) arrange.x *= -1;
        if (position.toString().indexOf("bottom") > -1) arrange.y *= -1;
      }
      target.x += arrange.x;
      target.y += arrange.y;
      this.arrangePoint(targetKey);
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
