import { BcdiceSystemInfo, DiceSystem } from "@/@types/bcdice";
import TaskManager from "@/app/core/task/TaskManager";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import LanguageManager from "@/LanguageManager";

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
  private constructor() {}

  public async init() {
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
    if (SocketFacade.instance.connectInfo) {
      return this.doGetBcdiceSystemList();
    } else {
      return new Promise((resolve: Function, reject: Function) => {
        const intervalId = window.setInterval(async () => {
          if (SocketFacade.instance.connectInfo) {
            clearInterval(intervalId);
            resolve(await this.doGetBcdiceSystemList());
          }
        });
      });
    }
  }

  /**
   * BCDice-APIからシステム一覧を取得する
   */
  private static async doGetBcdiceSystemList(): Promise<DiceSystem[]> {
    return new Promise((resolve: Function, reject: Function) => {
      const url = `${SocketFacade.instance.connectInfo.bcdiceServer}/v1/names`;
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

  public static async getBcdiceSystemInfo(
    system: string
  ): Promise<BcdiceSystemInfo> {
    return new Promise((resolve: Function, reject: Function) => {
      const params = new URLSearchParams();
      params.append("system", system);
      const url = `${
        SocketFacade.instance.connectInfo.bcdiceServer
      }/v1/systeminfo?${params.toString()}`;
      fetch(url)
        .then(response => response.json())
        .then(json => {
          if (json.ok) {
            resolve(json.systeminfo as BcdiceSystemInfo);
          } else {
            reject(json);
          }
        })
        .catch(err => reject(err));
    });
  }

  public static async getBcdiceSystemName(
    system: string | null
  ): Promise<string | null> {
    if (!system) return null;
    if (system === "DiceBot")
      return LanguageManager.instance.getText("label.default-dicebot");
    const info = await BCDiceFacade.getBcdiceSystemInfo(system);
    window.console.log(info);
    return info.name;
  }

  /**
   * ダイスコマンドを送信して結果を取得する
   * @param system
   * @param command
   */
  public static async sendBcdiceServer({
    system,
    command
  }: {
    system: string;
    command: string;
  }) {
    return new Promise((resolve: Function, reject: Function) => {
      const params: string = [
        `system=${system}`,
        `command=${encodeURIComponent(command)}`
      ].join("&");
      const url = `${SocketFacade.instance.connectInfo.bcdiceServer}/v1/diceroll?${params}`;

      try {
        fetch(url)
          .then(response => response.json())
          .then(json => {
            resolve(json);
          });
        // .catch(err => { /* 無視 */ }); // reject(err)
      } catch (error) {
        window.console.error(error);
        // 無視
      }
    });
  }
}
