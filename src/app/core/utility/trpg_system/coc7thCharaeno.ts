import { MemoStore } from "@/@types/store-data";
import {
  outputTableList,
  regStr,
  tabTextProcess
} from "@/app/core/utility/trpg_system/SaikoroFiction";
import { TrpgSystemHelper } from "@/app/core/utility/trpg_system/TrpgSystemHelper";
import moment from "moment";

export class Coc7thCharaeno extends TrpgSystemHelper<Investigator> {
  public readonly isSupportedOtherText = true;
  public readonly isSupportedChatPalette = true;

  public constructor(url: string) {
    super(
      url,
      /https?:\/\/charaeno\.sakasin\.net\/7th\/([^?]+)/,
      "https://charaeno.sakasin.net/api/v1/7th/{key}/summary"
    );
  }

  /**
   * このシステムに対応しているキャラシのURLかどうかを判定する
   * @return true: 対応したキャラシである, false: 対応したキャラシではない
   */
  public async isThis() {
    return this.urlRegExp.test(this.url);
  }

  /**
   * その他欄の情報を生成する
   */
  public async createOtherText(
    memoList: Partial<StoreData<MemoStore>>[]
  ): Promise<Partial<StoreData<MemoStore>>[] | null> {
    const { data, list } = await this.createResultList<MemoStore>({
      type: "get"
    });
    if (!data) return null;

    readData(data, memoList);

    // メモ
    this.addMemo(list);
    // 基本情報
    addBasic(data, list);
    // スキル
    addSkills(data, list);
    // 武器/持ち物
    addWeapon(data, list);
    // 財産/仲間
    addCredit(data, list);
    // バックストーリー
    addBackStory(data, list);

    return list;
  }

  /**
   * チャットパレットの情報を生成する
   */
  public async createChatPalette(): Promise<
    {
      name: string;
      paletteText: string;
    }[]
  > {
    const { data } = await this.createResultList<string>({ type: "get" });
    if (!data) return [];
    return [
      {
        name: `◆${(data.name || "").replaceAll(/[(（].+[)）]/g, "")}`,
        paletteText: data.chatpalette
      }
    ];
  }

  /**
   * JSONPから取得した生データから処理用のデータを生成する
   * @param json JSONPから取得した生データ
   * @param url 元となったキャラクターシートのURL
   * @protected
   */
  protected createData(json: any, url?: string): Investigator | null {
    if (!json) return null;
    return {
      url: url || this.url,
      ...json
    };
  }
}

// CharaenoのAPIで公開されているありがたい定義をそのまま流用
interface Investigator {
  name: string; // 名前
  occupation: string; // 職業
  age: string; // 年齢
  sex: string; // 性別
  residence: string; // 住所
  birthplace: string; // 出身

  // 各能力値の現在値
  characteristics: {
    str: number;
    con: number;
    pow: number;
    dex: number;
    app: number;
    siz: number;
    int: number;
    edu: number;
  };

  // 耐久力等の現在値および最大正気度
  attribute: {
    hp: number; // 耐久力
    mp: number; // マジック・ポイント
    mov: number; // 移動率
    build: number; // ビルド
    db: string; // ダメージ・ボーナス。0の場合には "+0" となる
    san: {
      value: number;
      max: number;
    };
    luck: number;
  };

  skills: Array<Skill>;
  weapons: Array<Weapon>;
  possessions: Array<Possession>; // 装備と所持品

  // 収入と財産
  credit: {
    spendingLevel: string;
    cash: string;
    assetsDetails: string;
  };
  backstory: Array<Backstory>;
  fellows: Array<Fellow>; // 仲間の探索者
  note: string;
  chatpalette: string; // チャットパレットに用いるための改行区切りのコマンド一覧
}

interface Skill {
  name: string;
  value: number; // 技能の合計値
  edited: boolean; // 技能値が編集されているかどうか。技能の合計値が初期値と異なる場合 true となる
}

interface Weapon {
  name: string; // 名前
  value: string; // 技能値。数値とは限らないことに注意
  damage: string; // ダメージ
  range: string; // 射程
  attacks: string; // 攻撃回数
  ammo: string; // 装弾数
  malfunction: string; // 故障ナンバー
}

interface Possession {
  name: string; // 名前
  count: string; // 所持数。数値とは限らないことに注意
  detail: string; // 物品の詳細説明
}

interface Backstory {
  name: string;
  entries: Array<BackstoryEntry>;
}

interface BackstoryEntry {
  text: string;
  keyConnection?: boolean; // エントリがキーコネクションに指定されていると true となる
}

interface Fellow {
  name: string;
  url: string; // 妥当なURLとは限らないことに注意
}

function addSkills(
  data: Investigator,
  resultList: Partial<StoreData<MemoStore>>[]
) {
  resultList.push({
    data: {
      tab: "技能",
      type: "url",
      text: [
        `@@@RELOAD-CHARACTER-SHEET-ALL@@@ ${moment().format(
          "YYYY/MM/DD HH:mm:ss"
        )}`,
        "## 技能",
        ...outputTableList<Skill>(
          data.skills,
          [
            { label: "技能（五十音順）", prop: "name", align: "left" },
            { label: "合計", prop: "value", align: "left" },
            { label: "補正", prop: "edited", align: "center" },
            { label: "", prop: "value", align: "left" }
          ],
          (prop, value, data) => {
            if (prop.prop === "edited") {
              return data.edited ? "●" : "";
            }
            if (prop.label === "") {
              return `@@@CHAT-CMD:[]CC<=${data.value!.toString()} ${
                data.name
              }@@@`;
            }
            return data[prop.prop!]!.toString();
          }
        )
      ].join("\r\n")
    }
  });
}

function readData(
  data: Investigator,
  memoList: Partial<StoreData<MemoStore>>[]
) {
  tabTextProcess("バックストーリー", memoList, text => {
    const bseList: BackstoryEntry[] = data.backstory.flatMap(b => b.entries);
    Array.from(
      text.matchAll(
        new RegExp(`^\\|${[regStr.check, regStr.text].join("\\|")}\\|$`, "gm")
      )
    )
      .map(r => {
        const check = r[1] === "x";
        const text = r[2];
        return { check, text };
      })
      .forEach((info, idx, self) => {
        const matchIdx =
          self.filter((s, fIdx) => s.text === info.text && fIdx <= idx).length -
          1;
        const bse = bseList.filter(bsr => bsr.text === info.text)[matchIdx];
        if (bse) bse.keyConnection = info.check;
      });
  });
}

function addBasic(
  data: Investigator,
  resultList: Partial<StoreData<MemoStore>>[]
) {
  const ci = data.characteristics;
  const createParamLine = (
    status: keyof Investigator["characteristics"],
    secondRoll: string = ""
  ) =>
    [
      "",
      `◇${status.toString().toUpperCase()}`,
      ci[status],
      `@@@CHAT-CMD:[]CC<=${ci[status]} ${status.toString().toUpperCase()}@@@` +
        (!secondRoll
          ? ""
          : `<br>@@@CHAT-CMD:[]CC<=${ci[status]} ${secondRoll}@@@`),
      ""
    ].join("|");
  resultList.push({
    data: {
      tab: "基本情報",
      type: "url",
      text: [
        `@@@RELOAD-CHARACTER-SHEET-ALL@@@ ${moment().format(
          "YYYY/MM/DD HH:mm:ss"
        )}`,
        "## 基本情報",
        `|||`,
        `|:--32px|:--|`,
        `|◇名前|${data.name}|`,
        `|◇職業|${data.occupation}|`,
        "",
        `|||||`,
        `|:--32px|:--|:--32px|:--|`,
        `|◇年齢|${data.age}|◇性別|${data.sex}|`,
        `|◇住所|${data.residence}|◇出身|${data.birthplace}|`,
        "",
        "### 能力値",
        "||||",
        "|:---|:---:|:---|",
        createParamLine("str"),
        createParamLine("con"),
        createParamLine("pow"),
        createParamLine("dex"),
        createParamLine("app"),
        createParamLine("siz"),
        createParamLine("int", "アイデア"),
        createParamLine("edu", "知識"),
        ["", "◇HP", data.attribute.hp, "", ""].join("|"),
        ["", "◇MP", data.attribute.mp, "", ""].join("|"),
        ["", "◇MOV", data.attribute.mov, "", ""].join("|"),
        ["", "◇ダメージ・ボーナス", data.attribute.db, "", ""].join("|"),
        ["", "◇ビルド", data.attribute.build, "", ""].join("|"),
        [
          "",
          "◇正気度",
          `${data.attribute.san.value}/${data.attribute.san.max}`,
          "@@@CHAT-CMD:[]CC<={SAN} 正気度ロール@@@",
          ""
        ].join("|"),
        [
          "",
          "◇幸運",
          data.attribute.luck,
          `@@@CHAT-CMD:[]CC<=${data.attribute.luck} 幸運@@@`,
          ""
        ].join("|")
      ].join("\r\n")
    }
  });
}

function addWeapon(
  data: Investigator,
  resultList: Partial<StoreData<MemoStore>>[]
) {
  resultList.push({
    data: {
      tab: "武器/持ち物",
      type: "url",
      text: [
        `@@@RELOAD-CHARACTER-SHEET-ALL@@@ ${moment().format(
          "YYYY/MM/DD HH:mm:ss"
        )}`,
        "## 武器",
        "|名前|技能値|ダメージ|射程|攻撃回数|装弾数|故障||",
        "|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---|",
        ...data.weapons.map(weapon =>
          [
            "",
            weapon.name,
            weapon.value,
            weapon.damage,
            weapon.range,
            weapon.attacks,
            weapon.ammo,
            weapon.malfunction,
            `@@@CHAT-CMD:[]CC<=${weapon.damage.replace("DB", "{DB}")} ${
              weapon.name
            }@@@`,
            ""
          ].join("|")
        ),
        "## 装備と所持品",
        data.possessions.length
          ? [
              "|アイテム|個数|詳細|",
              "|:---:|:---:|:---|",
              ...data.possessions.map(possession =>
                [
                  "",
                  possession.name,
                  possession.count,
                  possession.detail.replace(/\r?\n/g, "\\n"),
                  ""
                ].join("|")
              )
            ].join("\r\n")
          : "なし"
      ].join("\r\n")
    }
  });
}

function addCredit(
  data: Investigator,
  resultList: Partial<StoreData<MemoStore>>[]
) {
  resultList.push({
    data: {
      tab: "財産/仲間",
      type: "url",
      text: [
        `@@@RELOAD-CHARACTER-SHEET-ALL@@@ ${moment().format(
          "YYYY/MM/DD HH:mm:ss"
        )}`,
        "## 財産",
        "|||",
        "|:---:|:---|",
        `|◇支出レベル|${data.credit.spendingLevel}|`,
        `|◇現金|${data.credit.cash}|`,
        `|◇資産|${data.credit.assetsDetails.replace(/\\r?\\n/g, "\\\\n")}|`,
        "## 仲間の探索者",
        "|名前|URL|",
        "|:---:|:---|",
        ...data.fellows.map(fellow =>
          ["", fellow.name, fellow.url, ""].join("|")
        )
      ].join("\r\n")
    }
  });
}

function addBackStory(
  data: Investigator,
  resultList: Partial<StoreData<MemoStore>>[]
) {
  resultList.push({
    data: {
      tab: "バックストーリー",
      type: "url",
      text: [
        `@@@RELOAD-CHARACTER-SHEET-ALL@@@ ${moment().format(
          "YYYY/MM/DD HH:mm:ss"
        )}`,
        "## バックストーリー",
        ...data.backstory.flatMap(back => [
          `###### ${back.name}`,
          "|||",
          "|:---:16px|:---|",
          ...back.entries.map(e =>
            [
              "",
              `[${e.keyConnection ? "x" : " "}]`,
              e.text.replace(/\r?\n/g, "\\n"),
              ""
            ].join("|")
          )
        ])
      ].join("\r\n")
    }
  });
}
