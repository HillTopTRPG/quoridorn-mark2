import {
  BcdiceSystemInfo,
  BcdiceVersionInfo,
  BcdiceDiceRollInfo,
  DiceSystem
} from "@/@types/bcdice";
import TaskManager from "@/app/core/task/TaskManager";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import LanguageManager from "@/LanguageManager";
import { loadYaml } from "@/app/core/File";
import { CustomDiceBotInfo } from "@/@types/room";

export default class BcdiceManager {
  // シングルトン
  public static get instance(): BcdiceManager {
    if (!BcdiceManager._instance) BcdiceManager._instance = new BcdiceManager();
    return BcdiceManager._instance;
  }

  private static _instance: BcdiceManager;
  public readonly diceSystemList: DiceSystem[] = [];
  public readonly customDiceBotList: CustomDiceBotInfo[] = [];
  private __isReady: boolean = false;

  // コンストラクタの隠蔽
  private constructor() {}

  public async setRoomUrl(baseUrl: string) {
    const {
      diceSystemList,
      customDiceBotList
    } = await BcdiceManager.getBcdiceSystemList(baseUrl);
    SocketFacade.instance.connectInfo.bcdiceServer = baseUrl;

    this.diceSystemList.splice(0, this.diceSystemList.length);
    this.diceSystemList.push(...diceSystemList);
    this.customDiceBotList.splice(0, this.customDiceBotList.length);
    this.customDiceBotList.push(...customDiceBotList);
  }

  public async init(baseUrl: string) {
    await BcdiceManager.instance.setRoomUrl(baseUrl);
    this.__isReady = true;
    await TaskManager.instance.ignition<never, never>({
      type: "bcdice-ready",
      owner: "Quoridorn",
      value: null
    });
  }

  public isReady(): boolean {
    return this.__isReady;
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
  private static async getBcdiceSystemList(
    baseUrl: string
  ): Promise<{
    diceSystemList: DiceSystem[];
    customDiceBotList: CustomDiceBotInfo[];
  }> {
    const url = `${baseUrl}/v1/names`;

    const json: any = await (await fetch(url)).json();
    const diceSystemList: DiceSystem[] = json.names as DiceSystem[];
    diceSystemList.sort((i1: any, i2: any) => {
      if (i1.name === "DiceBot") return -1;
      if (i2.name === "DiceBot") return 1;
      if (i1.name > i2.name) return 1;
      if (i1.name < i2.name) return -1;
      return 0;
    });

    const customDiceBotList: CustomDiceBotInfo[] = [];
    const loadCustomDiceBotYaml = async (ds: DiceSystem): Promise<void> => {
      const path = `/static/conf/system/${ds.system}/customDiceBot.yaml`;
      try {
        const list = (await loadYaml(path)) as CustomDiceBotInfo[];
        list.forEach(cdb => {
          cdb.system = ds.system;
        });
        customDiceBotList.push(...list);
      } catch (err) {
        // Nothing.
      }
    };
    await diceSystemList
      .map((ds: DiceSystem) => () => loadCustomDiceBotYaml(ds))
      .reduce((prev, curr) => prev.then(curr), Promise.resolve());

    return { diceSystemList, customDiceBotList };
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
    const info = await BcdiceManager.getBcdiceSystemInfo(baseUrl, system);
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
  }): Promise<BcdiceDiceRollInfo> {
    const params: string = [
      `system=${system}`,
      `command=${encodeURIComponent(command)}`
    ].join("&");
    const url = `${SocketFacade.instance.connectInfo.bcdiceServer}/v1/diceroll?${params}`;

    const json: any = await (await fetch(url)).json();
    if (json.ok) {
      json.result = json.result.replace(/(^: )/g, "").replace(/＞/g, "→");
    }
    return json as BcdiceDiceRollInfo;
  }
}
