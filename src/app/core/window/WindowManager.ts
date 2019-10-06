import {
  WindowDeclareInfo,
  WindowInfo,
  WindowTableInfo
} from "@/@types/window";
import { calcWindowPosition, createPoint } from "../Coordinate";
import { Point } from "@/@types/address";
import { getCssPxNum } from "../Css";
import { ApplicationError } from "@/app/core/error/ApplicationError";

type WindowDeclareInfoContainer = {
  [type: string]: WindowDeclareInfo;
};

const windowDeclareInfo: WindowDeclareInfoContainer = require("../window.yaml");

export default class WindowManager {
  // シングルトン
  public static get instance(): WindowManager {
    if (!this._instance) this._instance = new WindowManager();
    return this._instance;
  }
  private static _instance: WindowManager;

  public static createFilter = (status: string) => (
    list: WindowInfo<unknown>[]
  ) => list.filter(info => info.status.indexOf(status) > -1);

  // コンストラクタの隠蔽
  private constructor() {}

  private readonly windowDeclareInfoContainer = Object.seal(windowDeclareInfo);
  private readonly __windowInfoList: WindowInfo<unknown>[] = [];
  private key: number = 0;

  public get windowInfoList() {
    return this.__windowInfoList;
  }

  public getWindowInfo<T>(key: string): WindowInfo<T> {
    return this.__windowInfoList.filter(
      info => info.key === key
    )[0] as WindowInfo<T>;
  }

  private resist<T>(
    type: string,
    declareInfo: WindowDeclareInfo,
    args: T
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
    const point = calcWindowPosition(position, windowSize, menuHeight);

    const key = `window-${this.key++}`;
    this.__windowInfoList.push({
      key,
      title: declareInfo.title,
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

  public async open<T>(type: string, args?: T): Promise<string> {
    return this.resist(type, this.windowDeclareInfoContainer[type], args);
  }
}
