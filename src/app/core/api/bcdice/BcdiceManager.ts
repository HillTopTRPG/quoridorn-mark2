import { OriginalTableStore } from "@/@types/room";
import { BcdiceDiceRollResult } from "@/@types/store-data-optional";
import { errorDialog } from "@/app/core/utility/Utility";
import TaskManager from "@/app/core/task/TaskManager";
import LanguageManager from "@/LanguageManager";
import { loadYaml } from "@/app/core/utility/FileUtility";
import { convertNumberZero } from "@/app/core/utility/PrimaryDataUtility";

abstract class BcdiceApiCommander {
  public static SUPPORT_VERSION_MAP: Map<
    string,
    (baseUrl: string) => BcdiceApiCommander
  > = new Map<string, (baseUrl: string) => BcdiceApiCommander>([
    ["v1", (baseUrl: string) => new BcdiceV1Commander(baseUrl)],
    ["v2", (baseUrl: string) => new BcdiceV2Commander(baseUrl)]
  ]);

  public static create(baseUrl: string, version: string): BcdiceApiCommander {
    const factoryMethod = BcdiceApiCommander.SUPPORT_VERSION_MAP.get(version);
    if (!factoryMethod) throw `Un supported version ${version}`;
    return factoryMethod(baseUrl);
  }

  protected constructor(public baseUrl: string, public version: string) {}

  protected static async fetch<T>(
    url: string,
    nonErrorOutput: boolean = false
  ): Promise<T> {
    try {
      return await (await fetch(url)).json();
    } catch (err) {
      if (!nonErrorOutput) {
        await errorDialog({
          title: LanguageManager.instance.getText("message.error"),
          text: "BCDice-APIとの通信に失敗しました。"
        });
        console.error("[!!CAUTION!!] これは問題ですっ！🐧💦");
        console.error(err);
      }
      throw err;
    }
  }

  protected sortDiceSystem(diceSystemList: DiceSystem[]): void {
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
  }

  protected async getCustomDiceBotList(
    systemList: string[]
  ): Promise<OriginalTableStore[]> {
    const customDiceBotList: OriginalTableStore[] = [];
    const loadCustomDiceBotYaml = async (system: string): Promise<void> => {
      const path = `static/conf/system/${system}/customDiceBot.yaml`;
      try {
        // トライアンドエラー方式読み込みのため、throwは握りつぶす
        const list = await loadYaml<OriginalTableStore[]>(path, true);
        list.forEach(cdb => {
          cdb.system = system;
        });
        customDiceBotList.push(...list);
      } catch (err) {
        // Nothing.
      }
    };
    const modInfoList = await loadYaml<
      { system: string; customDiceBot: boolean }[]
    >("static/conf/system/mod-list.yaml");
    await systemList
      .filter(system =>
        modInfoList.some(mi => mi.system === system && mi.customDiceBot)
      )
      .map(system => () => loadCustomDiceBotYaml(system))
      .reduce((prev, curr) => prev.then(curr), Promise.resolve());

    return customDiceBotList;
  }

  public static async getServerInfo(
    baseUrl: string,
    version: string,
    nonErrorOutput: boolean = false
  ): Promise<BcdiceServerInfo> {
    return await BcdiceApiCommander.fetch<BcdiceServerInfo>(
      `${baseUrl}/${version}/version`,
      nonErrorOutput
    );
  }

  abstract async getSystemList(): Promise<DiceSystem[]>;
  abstract async getSystemInfo(system: string): Promise<BcdiceSystemInfo>;
  abstract async sendCommand(
    system: string,
    command: string
  ): Promise<BcdiceDiceRollResult>;
}

class BcdiceV1Commander extends BcdiceApiCommander {
  public constructor(baseUrl: string) {
    super(baseUrl, "v1");
  }

  async getSystemList(): Promise<DiceSystem[]> {
    const json = await BcdiceApiCommander.fetch<any>(
      `${this.baseUrl}/${this.version}/game_system`
    );
    const diceSystemList: DiceSystem[] = json.names as DiceSystem[];
    diceSystemList.forEach(ds => (ds.systemInfo = null));
    this.sortDiceSystem(diceSystemList);
    return diceSystemList;
  }

  public async getSystemInfo(system: string): Promise<BcdiceSystemInfo> {
    const params = new URLSearchParams();
    params.append("system", system);
    const json = await BcdiceApiCommander.fetch<any>(
      `${this.baseUrl}/${this.version}/systeminfo?${params.toString()}`
    );
    if (!json.ok) throw json;
    return json.systeminfo as BcdiceSystemInfo;
  }

  public async sendCommand(
    system: string,
    command: string
  ): Promise<BcdiceDiceRollResult> {
    const params: string = [
      `system=${system}`,
      `command=${encodeURIComponent(command)}`
    ].join("&");
    const json: any = await BcdiceApiCommander.fetch(
      `${this.baseUrl}/${this.version}/diceroll?${params}`
    );
    json.verson = this.version;
    if (!json.ok) throw json;

    json.result = json.result.replace(/(^: )/g, "").replace(/＞/g, "→");
    if (json.detailed_rands) {
      json.dices = json.detailed_rands;
      delete json.detailed_rands;
    } else {
      json.dices.forEach((d: any) => (d.kind = "normal"));
    }

    return json as BcdiceDiceRollResult;
  }
}

class BcdiceV2Commander extends BcdiceApiCommander {
  public constructor(baseUrl: string) {
    super(baseUrl, "v2");
  }

  async getSystemList(): Promise<DiceSystem[]> {
    const json = await BcdiceApiCommander.fetch<any>(
      `${this.baseUrl}/${this.version}/game_system`
    );
    const diceSystemList: DiceSystem[] = json.game_system.map((s: any) => ({
      system: s.id,
      name: s.name,
      sort_key: s.sort_key,
      systemInfo: null
    })) as DiceSystem[];
    this.sortDiceSystem(diceSystemList);
    // const errorMap: Map<string, string> = new Map<string, string>();
    //
    // const func = async (ds: DiceSystem): Promise<void> => {
    //   const systemInfo = await this.getSystemInfo(ds.system);
    //   try {
    //     new RegExp(systemInfo.commandPattern!);
    //     // console.log(
    //     //   JSON.stringify(
    //     //     {
    //     //       check: "success",
    //     //       system: ds.system,
    //     //       commandPattern: systemInfo.commandPattern
    //     //     },
    //     //     null,
    //     //     "  "
    //     //   )
    //     // );
    //   } catch (err) {
    //     errorMap.set(ds.system, systemInfo.commandPattern!);
    //   }
    // };
    //
    // // 直列の非同期で全部実行する
    // await diceSystemList
    //   .map(ds => () => func(ds))
    //   .reduce((prev, curr) => prev.then(curr), Promise.resolve());
    //
    // console.log(errorMap.size);
    // errorMap.forEach((val, key) => {
    //   console.log(`${key}~${val}`);
    // });
    return diceSystemList;
  }

  public async getSystemInfo(system: string): Promise<BcdiceSystemInfo> {
    const json = await BcdiceApiCommander.fetch<any>(
      `${this.baseUrl}/${this.version}/game_system/${system}`
    );
    if (!json.ok) throw json;

    // 2021/03/21時点のBCDice-APIの不具合に対するパッチ処理
    json.commandPattern = json.command_pattern.replace(
      /\|\(\?i-mx:RTT\[1-6]\?\)/,
      "|RTT[1-6]"
    );

    return {
      gameType: json.id,
      info: json.help_message,
      name: json.name,
      commandPattern: json.commandPattern
    };
  }

  public async sendCommand(
    system: string,
    command: string
  ): Promise<BcdiceDiceRollResult> {
    const json: any = await BcdiceApiCommander.fetch(
      `${this.baseUrl}/${
        this.version
      }/game_system/${system}/roll?command=${encodeURIComponent(command)}`
    );
    json.verson = this.version;
    if (!json.ok) throw json;

    json.result = json.text.replace(/(^: )/g, "").replace(/＞/g, "→");
    delete json.text;
    json.dices = json.rands;
    delete json.rands;

    return json as BcdiceDiceRollResult;
  }
}

type BcdiceServerStruct = {
  systemMap: Map<string, DiceSystem>;
  versionMap: Map<
    string, // v1/v2
    BcdiceServerVersionStruct
  >;
};

type BcdiceServerVersionStruct = {
  commander: BcdiceApiCommander;
  serverInfo: BcdiceServerInfo | null;
};

export default class BcdiceManager {
  // シングルトン
  public static get instance(): BcdiceManager {
    if (!BcdiceManager._instance) BcdiceManager._instance = new BcdiceManager();
    return BcdiceManager._instance;
  }

  private static _instance: BcdiceManager;
  private readonly __diceSystemMap: Map<string, BcdiceServerStruct> = new Map<
    string,
    BcdiceServerStruct
  >();
  private __isReady: boolean = false;

  // コンストラクタの隠蔽
  private constructor() {}

  private async getServerStruct(
    baseUrl: string,
    isInstant: boolean = false
  ): Promise<BcdiceServerStruct> {
    let serverInfo = this.__diceSystemMap.get(baseUrl);
    if (!serverInfo) {
      serverInfo = {
        systemMap: new Map<string, DiceSystem>(),
        versionMap: (await this.getSupportVersion(baseUrl)).reduce((m, v) => {
          m.set(v, {
            commander: BcdiceApiCommander.create(baseUrl, v),
            serverInfo: null
          });
          return m;
        }, new Map<string, BcdiceServerVersionStruct>())
      };
      if (!isInstant) {
        this.__diceSystemMap.set(baseUrl, serverInfo);
      }
    }
    return serverInfo;
  }

  private async getVersionStruct(
    baseUrl: string,
    version: string
  ): Promise<BcdiceServerVersionStruct> {
    const serverStruct = await this.getServerStruct(baseUrl);
    const versionStruct = serverStruct.versionMap.get(version);
    if (!versionStruct) throw `Un supported version '${version}'`;
    return versionStruct;
  }

  public async getDiceSystemMap(
    baseUrl: string,
    version: string
  ): Promise<Map<string, DiceSystem>> {
    const serverStruct = await this.getServerStruct(baseUrl);
    if (!serverStruct.systemMap.size) {
      const versionStruct = await this.getVersionStruct(baseUrl, version);
      (await versionStruct.commander.getSystemList()).reduce(
        (m, ds) => m.set(ds.system, ds),
        serverStruct!.systemMap
      );
    }
    return serverStruct.systemMap;
  }

  public async getSupportVersion(url: string): Promise<string[]> {
    const resultList: string[] = [];

    const getVersionFunc = async (v: string): Promise<void> => {
      if (resultList.length) return;

      const logPrefix = `[BCDice-API] '${url}/${v}' `;

      let serverInfo: BcdiceServerInfo;
      try {
        serverInfo = await BcdiceApiCommander.getServerInfo(url, v, true);
      } catch (err) {
        console.log(`${logPrefix}存在しなかった`);
        return;
      }
      const latestVersion = convertNumberZero(serverInfo.api?.split(".")[0]);
      const oldVersion = latestVersion - 1;
      if (latestVersion > 0) resultList.push(`v${latestVersion}`);
      if (oldVersion > 0) resultList.push(`v${oldVersion}`);
      if (resultList.length) {
        console.log(
          `${logPrefix}${resultList.join("/")}をサポートしていることがわかった`
        );
      } else {
        console.log(
          `${logPrefix}fetchは成功したが、サポートバージョンを取得できなかった（BCDice-APIサーバじゃない可能性大）`
        );
      }
    };

    // Quoridornが知る最新バージョンから試す。
    // それでダメなら次にv1を試す。
    // それでもダメなら次にQuoridornが知る最新バージョンの次のバージョンを試す。
    // あとは残った数を昇順で試していく
    const maxSupportVersionNum = Array.from(
      BcdiceApiCommander.SUPPORT_VERSION_MAP.keys()
    ).length;
    const versionList = new Array(maxSupportVersionNum + 2)
      .fill(null)
      .map((_, i) => i + 1)
      .sort((n1, n2) => {
        const judge = (num: number): number => {
          if (n1 === num) return -1;
          if (n2 === num) return 1;
          return 0;
        };
        const result =
          judge(maxSupportVersionNum) ||
          judge(1) ||
          judge(maxSupportVersionNum + 1);
        if (result) return result;
        if (n1 < n2) return -1;
        if (n1 > n2) return 1;
        return 0;
      })
      .map(v => `v${v}`);

    // 直列の非同期で全部実行する
    await versionList
      .map(v => () => getVersionFunc(v))
      .reduce((prev, curr) => prev.then(curr), Promise.resolve());

    return resultList;
  }

  public async getServerInfo(
    baseUrl: string,
    version: string
  ): Promise<BcdiceServerInfo> {
    const versionStruct = await this.getVersionStruct(baseUrl, version);
    if (!versionStruct.serverInfo) {
      versionStruct.serverInfo = await BcdiceApiCommander.getServerInfo(
        baseUrl,
        version
      );
    }
    return versionStruct.serverInfo;
  }

  public async getSystemInfo(
    baseUrl: string,
    version: string,
    system: string
  ): Promise<BcdiceSystemInfo> {
    const diceSystemMap: Map<string, DiceSystem> = await this.getDiceSystemMap(
      baseUrl,
      version
    );
    const diceSystem: DiceSystem | undefined = diceSystemMap.get(system);
    if (!diceSystem) throw `No such system '${system}'`;
    if (!diceSystem.systemInfo) {
      diceSystem.systemInfo = await (
        await this.getVersionStruct(baseUrl, version)
      ).commander.getSystemInfo(system);
    }
    return diceSystem.systemInfo;
  }

  public async init(baseUrl: string) {
    await this.getServerStruct(baseUrl);
    this.__isReady = true;
    await TaskManager.instance.ignition<never, never>({
      type: "bcdice-ready",
      owner: "Quoridorn",
      value: null
    });
  }

  public async getVersionList(baseUrl: string): Promise<string[]> {
    const serverStruct = await this.getServerStruct(baseUrl);
    return Array.from(serverStruct.versionMap.keys());
  }

  public static isSupportVersion(version: string): boolean {
    return BcdiceApiCommander.SUPPORT_VERSION_MAP.has(version);
  }

  public isReady(): boolean {
    return this.__isReady;
  }

  public async getSystemName(
    baseUrl: string,
    version: string,
    system: string | null
  ): Promise<string | null> {
    if (!system) return null;
    if (system === "DiceBot")
      return LanguageManager.instance.getText(
        "bcdice-manager.label.default-dicebot"
      );
    const systemInfo = await this.getSystemInfo(baseUrl, version, system);
    return systemInfo.name;
  }

  /**
   * ダイスコマンドを送信して結果を取得する
   * @param baseUrl
   * @param version
   * @param system
   * @param command
   */
  public async sendCommand(
    baseUrl: string,
    version: string,
    system: string,
    command: string
  ): Promise<BcdiceDiceRollResult> {
    const commander = (await this.getVersionStruct(baseUrl, version)).commander;

    const systemInfo = await this.getSystemInfo(baseUrl, version, system);
    if (!systemInfo) throw `No such system '${system}'`;
    if (systemInfo.commandPattern) {
      let regExp: RegExp | null = null;
      try {
        regExp = new RegExp(systemInfo.commandPattern, "i");
      } catch (err) {
        // BCDice-APIが返却してくるcommandPatternにも間違いはある
        console.log(`ErrorPattern: '${systemInfo.commandPattern}'`);
      }
      if (regExp && !regExp.test(command.trim()))
        throw `Unsupport command '${command}'`;
    }
    const result = await commander.sendCommand(system, command);
    console.log(JSON.stringify(result, null, "  "));
    return result;
  }
}
