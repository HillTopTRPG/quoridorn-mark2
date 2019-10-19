import { DiceSystem } from "@/@types/bcdice";
import { ConnectInfo } from "@/@types/connect";
import TaskManager from "@/app/core/task/TaskManager";

const connectInfo: ConnectInfo = require("../../../../../public/static/conf/connect.yaml");

export default class BCDiceFacade {
  // シングルトン
  public static get instance(): BCDiceFacade {
    if (!BCDiceFacade._instance) BCDiceFacade._instance = new BCDiceFacade();
    return BCDiceFacade._instance;
  }

  private static _instance: BCDiceFacade;
  private diceInfoList: DiceSystem[] = [];
  private __isReady: boolean = false;

  // コンストラクタの隠蔽
  private constructor() {
    BCDiceFacade.getBcdiceSystemList().then(async list => {
      this.diceInfoList = list;
      this.__isReady = true;
      await TaskManager.instance.ignition<never, never>({
        type: "bcdice-ready",
        owner: "Quoridorn",
        value: null
      });
    });
  }

  public isReady(): boolean {
    return this.__isReady;
  }

  public getDiceSystemList(): DiceSystem[] {
    return this.diceInfoList;
  }

  /**
   * BCDice-APIからシステム一覧を取得する
   */
  private static async getBcdiceSystemList(): Promise<DiceSystem[]> {
    return new Promise((resolve: Function, reject: Function) => {
      const url = `${connectInfo.bcdiceServer}/v1/names`;
      fetch(url)
        .then(response => response.json())
        .then((json: any) => {
          json.names.sort((i1: any, i2: any) => {
            if (i1.name === "DiceBot") return -1;
            if (i2.name === "DiceBot") return 1;
            if (i1.name > i2.name) return 1;
            if (i1.name < i2.name) return -1;
            return 0;
          });
          resolve(json.names as DiceSystem[]);
        })
        .catch(err => reject(err));
    });
  }

  public static async getBcdiceSystemInfo(system: string) {
    return new Promise((resolve: Function, reject: Function) => {
      const params: string = `system=${system}`;
      const url = `${connectInfo.bcdiceServer}/v1/systeminfo?${params}`;
      fetch(url)
        .then(response => response.json())
        .then(json => {
          if (json.ok) {
            resolve(json.systeminfo);
          } else {
            reject(json);
          }
        })
        .catch(err => reject(err));
    });
  }
}
