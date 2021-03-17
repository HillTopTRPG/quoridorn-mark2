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

  public async setRoomUrl(baseUrl: string, version: string) {
    const {
      diceSystemList,
      customDiceBotList
    } = await BcdiceManager.getBcdiceSystemList(baseUrl, version);
    SocketFacade.instance.connectInfo.bcdiceServer = baseUrl;

    listToEmpty(this.diceSystemList);
    this.diceSystemList.push(...diceSystemList);
    listToEmpty(this.customDiceBotList);
    this.customDiceBotList.push(...customDiceBotList);
  }

  public async init(baseUrl: string, version: string) {
    await BcdiceManager.instance.setRoomUrl(baseUrl, version);
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
    baseUrl: string,
    version: string
  ): Promise<BcdiceVersionInfo> {
    const url = `${baseUrl}/${version}/version`;
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
    baseUrl: string,
    version: string
  ): Promise<{
    diceSystemList: DiceSystem[];
    customDiceBotList: CustomDiceBotInfo[];
  }> {
    let suffix = "";
    switch (version) {
      case "v1":
        suffix = "names";
        break;
      case "v2":
        suffix = "game_system";
        break;
      default:
    }
    const url = `${baseUrl}/${version}/${suffix}`;

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
    const diceSystemList: DiceSystem[] = [];
    switch (version) {
      case "v1":
        diceSystemList.push(...json.names);
        break;
      case "v2":
        diceSystemList.push(
          ...json.game_system.map((s: any) => ({
            system: s.id,
            name: s.name,
            sort_key: s.sort_key
          }))
        );
        break;
      default:
    }
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
    version: string,
    system: string
  ): Promise<BcdiceSystemInfo> {
    let suffix = "";
    switch (version) {
      case "v1":
        const params = new URLSearchParams();
        params.append("system", system);
        suffix = `systeminfo?${params.toString()}`;
        break;
      case "v2":
        suffix = `game_system/${system}`;
        break;
      default:
    }
    const url = `${baseUrl}/${version}/${suffix}`;
    return new Promise((resolve: Function, reject: Function) => {
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
    version: string,
    system: string | null
  ): Promise<string | null> {
    if (!system) return null;
    if (system === "DiceBot")
      return LanguageManager.instance.getText(
        "bcdice-manager.label.default-dicebot"
      );
    const info = await BcdiceManager.getBcdiceSystemInfo(
      baseUrl,
      version,
      system
    );
    return info.name;
  }

  /**
   * ダイスコマンドを送信して結果を取得する
   * @param baseUrl
   * @param version
   * @param system
   * @param command
   */
  public static async sendBcdiceServer({
    baseUrl,
    version,
    system,
    command
  }: {
    baseUrl: string;
    version: string;
    system: string;
    command: string;
  }): Promise<BcdiceDiceRollResult> {
    let suffix = "";
    switch (version) {
      case "v1":
        const params: string = [
          `system=${system}`,
          `command=${encodeURIComponent(command)}`
        ].join("&");
        suffix = `diceroll?${params}`;
        break;
      case "v2":
        suffix = `game_system/${system}/roll?command=${command}`;
        break;
      default:
    }
    const url = `${SocketFacade.instance.connectInfo.bcdiceServer}/${version}/${suffix}`;

    const json: any = await (await fetch(url)).json();
    json.verson = version;
    if (json.ok) {
      switch (version) {
        case "v1":
          json.result = json.result.replace(/(^: )/g, "").replace(/＞/g, "→");
          if (json.detailed_rands) {
            json.dices = json.detailed_rands;
            delete json.detailed_rands;
          } else {
            json.dices.forEach((d: any) => (d.kind = "normal"));
          }
          break;
        case "v2":
          json.result = json.text.replace(/(^: )/g, "").replace(/＞/g, "→");
          delete json.text;
          json.dices = json.rands;
          delete json.rands;
          break;
        default:
      }
    }
    return json as BcdiceDiceRollResult;
  }
}
