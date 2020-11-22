import { listToEmpty } from "../../utility/PrimaryDataUtility";
import TaskManager from "../../task/TaskManager";
import { CustomDiceBotInfo } from "@/@types/room";
import SocketFacade from "../app-server/SocketFacade";
import LanguageManager from "../../../../LanguageManager";
import { loadYaml } from "../../utility/FileUtility";
import { BcdiceDiceRollResult } from "@/@types/store-data-optional";
import { errorDialog } from "@/app/core/utility/Utility";

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

    listToEmpty(this.diceSystemList);
    this.diceSystemList.push(...diceSystemList);
    listToEmpty(this.customDiceBotList);
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

    let json: any = null;
    try {
      const jsonStr = await fetch(url);
      json = await jsonStr.json();
    } catch (err) {
      await errorDialog({
        title: LanguageManager.instance.getText("message.error"),
        text: "BCDice-APIとの通信に失敗しました。"
      });
      console.error("[!!CAUTION!!] これは問題ですっ！🐧💦");
      console.error(err);
      // TODO 対症療法
      return { diceSystemList: [], customDiceBotList: [] };
      // throw err;
    }
    const diceSystemList: DiceSystem[] = json.names as DiceSystem[];
    diceSystemList.sort((i1: DiceSystem, i2: DiceSystem) => {
      if (i1.sort_key && i2.sort_key) {
        // BCDice Ver2.06でレスポンスに "sort_key" が追加されたので、あれば使う。
        if (i1.sort_key > i2.sort_key) return 1;
        if (i1.sort_key < i2.sort_key) return -1;
        return 0;
      }
      if (i1.name === "DiceBot") return -1;
      if (i2.name === "DiceBot") return 1;
      if (i1.name > i2.name) return 1;
      if (i1.name < i2.name) return -1;
      return 0;
    });

    const customDiceBotList: CustomDiceBotInfo[] = [];
    const loadCustomDiceBotYaml = async (ds: DiceSystem): Promise<void> => {
      const path = `static/conf/system/${ds.system}/customDiceBot.yaml`;
      try {
        // トライアンドエラー方式読み込みのため、throwは握りつぶす
        const list = await loadYaml<CustomDiceBotInfo[]>(path, true);
        list.forEach(cdb => {
          cdb.system = ds.system;
        });
        customDiceBotList.push(...list);
      } catch (err) {
        // Nothing.
      }
    };
    const modInfoList = await loadYaml<
      { system: string; customDiceBot: boolean }[]
    >("static/conf/system/mod-list.yaml");
    await diceSystemList
      .filter(ds =>
        modInfoList.some(mi => mi.system === ds.system && mi.customDiceBot)
      )
      .map(ds => () => loadCustomDiceBotYaml(ds))
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
      return LanguageManager.instance.getText(
        "bcdice-manager.label.default-dicebot"
      );
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
  }): Promise<BcdiceDiceRollResult> {
    const params: string = [
      `system=${system}`,
      `command=${encodeURIComponent(command)}`
    ].join("&");
    const url = `${SocketFacade.instance.connectInfo.bcdiceServer}/v1/diceroll?${params}`;

    const json: any = await (await fetch(url)).json();
    if (json.ok) {
      json.result = json.result.replace(/(^: )/g, "").replace(/＞/g, "→");
    }
    return json as BcdiceDiceRollResult;
  }
}
