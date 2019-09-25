import { WindowDeclareInfo, WindowInfo, WindowTaskInfo } from "@/@types/window";
import TaskManager from "@/app/core/task/TaskManager";

type WindowDeclareInfoContainer = {
  [type: string]: WindowDeclareInfo;
};

const windowDeclareInfo: WindowDeclareInfoContainer = require("./window.yaml");

export default class WindowManager {
  // シングルトン
  public static get instance(): WindowManager {
    if (!this._instance) this._instance = new WindowManager();
    return this._instance;
  }
  private static _instance: WindowManager;

  // コンストラクタの隠蔽
  private constructor() {}

  private windowDeclareInfoContainer = windowDeclareInfo;

  public async resistWindowOpenTask(type: string) {
    await TaskManager.instance.ignition<WindowTaskInfo>({
      type: "open-window",
      owner: "Quoridorn",
      value: {
        type: type,
        declare: this.getWindowDeclareInfo(type)
      }
    });
  }

  public getWindowDeclareInfo(type: string): WindowDeclareInfo {
    return this.windowDeclareInfoContainer[type];
  }
}
