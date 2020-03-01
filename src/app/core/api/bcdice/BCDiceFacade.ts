import {
  BcdiceSystemInfo,
  BcdiceVersionInfo,
  DiceSystem
} from "@/@types/bcdice";
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
  public readonly diceSystemList: DiceSystem[] = [];
  private __isReady: boolean = false;

  // コンストラクタの隠蔽
  private constructor() {}

  public async init() {
    BCDiceFacade.initBcdiceSystemList().then(async list => {
      this.diceSystemList.push(...list);
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

  /**
   * BCDice-APIからシステム一覧を取得する
   */
  private static async initBcdiceSystemList(): Promise<DiceSystem[]> {
    if (SocketFacade.instance.connectInfo) {
      return await BCDiceFacade.getBcdiceSystemList(
        SocketFacade.instance.connectInfo.bcdiceServer
      );
    } else {
      return new Promise((resolve: Function) => {
        const intervalId = window.setInterval(async () => {
          if (SocketFacade.instance.connectInfo) {
            clearInterval(intervalId);
            resolve(
              await BCDiceFacade.getBcdiceSystemList(
                SocketFacade.instance.connectInfo.bcdiceServer
              )
            );
          }
        }, 50);
      });
    }
  }

  /**
   * BCDice-APIからシステム一覧を取得する
   */
  public static async getBcdiceVersionInfo(
    baseUrl: string
  ): Promise<BcdiceVersionInfo> {
    const url = `${baseUrl}/v1/version`;
    return new Promise((resolve: Function, reject: Function) => {
      fetch(url)
        .then(response => response.json())
        .then((json: any) => {
          resolve(json as BcdiceVersionInfo);
        })
        .catch(err => reject(err));
    });
  }

  /**
   * BCDice-APIからシステム一覧を取得する
   */
  public static async getBcdiceSystemList(
    baseUrl: string
  ): Promise<DiceSystem[]> {
    const url = `${baseUrl}/v1/names`;
    return new Promise((resolve: Function, reject: Function) => {
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
    baseUrl: string,
    system: string
  ): Promise<BcdiceSystemInfo> {
    return new Promise((resolve: Function, reject: Function) => {
      const params = new URLSearchParams();
      params.append("system", system);
      const url = `${baseUrl}/v1/systeminfo?${params.toString()}`;
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
    baseUrl: string,
    system: string | null
  ): Promise<string | null> {
    if (!system) return null;
    if (system === "DiceBot")
      return LanguageManager.instance.getText("label.default-dicebot");
    const info = await BCDiceFacade.getBcdiceSystemInfo(baseUrl, system);
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
