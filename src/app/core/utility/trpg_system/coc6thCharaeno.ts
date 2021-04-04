import { MemoStore } from "@/@types/store-data";
import { outputTableList } from "@/app/core/utility/trpg_system/SaikoroFiction";
import { TrpgSystemHelper } from "@/app/core/utility/trpg_system/TrpgSystemHelper";

export class Coc6thCharaeno extends TrpgSystemHelper<Investigator> {
  public readonly isSupportedOtherText = true;
  public readonly isSupportedChatPalette = true;

  public constructor(url: string) {
    super(
      url,
      /https?:\/\/charaeno\.sakasin\.net\/6th\/([^?]+)/,
      "https://charaeno.sakasin.net/api/v1/6th/{key}/summary"
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
  public async createOtherText(): Promise<MemoStore[] | null> {
    const { data, list } = await this.createResultList<MemoStore>("get");
    if (!data) return null;

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
    const { data } = await this.createResultList<string>("get");
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
export interface Investigator {
  // 名前
  name: string;
  // 職業
  occupation: string;
  // 出身
  birthplace: string;
  // 学校・学位
  degree: string;
  // 精神的な障害
  mentalDisorder: string;
  // 年齢
  age: string;
  // 性別
  sex: string;

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
    // 耐久力
    hp: number;
    // マジック・ポイント
    mp: number;
    // ダメージ・ボーナス。0の場合には "+0" となる
    db: string;
    san: {
      // 正気度
      value: number;
      // 最大正気度
      max: number;
    };
  };

  skills: Array<Skill>;
  weapons: Array<Weapon>;
  // 装備と所持品
  possessions: Array<Possession>;

  personalData: {
    // 住所
    address: string;
    // 描写
    description: string;
    // 家族＆友人
    family: string;
    // 狂気の症状
    insanity: string;
    // 負傷
    injuries: string;
    // 傷跡など
    scar: string;
  };

  credit: {
    // 収入
    income: string;
    // 手持ち現金
    cash: string;
    // 預金
    deposit: string;
    // 個人資産
    personalProperty: string;
    // 不動産
    realEstate: string;
  };

  // 読んだクトゥルフ神話の魔導書
  mythosTomes: string;
  // アーティファクト／学んだ呪文
  artifactsAndSpells: string;
  // 遭遇した超自然の存在
  encounters: string;
  note: string;
  // チャットパレットに用いるための改行区切りのコマンド一覧
  chatpalette: string;
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
  hp: string; // 耐久力
}

interface Possession {
  name: string; // 名前
  count: string; // 所持数。数値とは限らないことに注意
  detail: string; // 物品の詳細説明
}

function addBasic(data: Investigator, resultList: MemoStore[]) {
  const ci = data.characteristics;
  resultList.push({
    tab: "基本情報",
    type: "url",
    text: [
      "@@@RELOAD-CHARACTER-SHEET@@@",
      "@@@RELOAD-CHARACTER-SHEET-ALL@@@",
      "## 基本情報",
      `|||`,
      `|:---:|:---:|`,
      `|◇名前|${data.name}|`,
      `|◇職業|${data.occupation}|`,
      `|◇出身|${data.birthplace}|`,
      `|◇学校・学位|${data.degree}|`,
      `|◇精神的な障害|${data.mentalDisorder}|`,
      "",
      `|||||`,
      `|:---:32px|:---:|:---:32px|:---:|`,
      `|◇年齢|${data.age}|◇性別|${data.sex}|`,
      "",
      "### 能力値",
      "|STR|CON|POW|DEX|APP|SIZ|INT|EDU|HP|MP|",
      "|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|",
      [
        "",
        ci.str,
        ci.con,
        ci.pow,
        ci.dex,
        ci.app,
        ci.siz,
        ci.int,
        ci.edu,
        data.attribute.hp,
        data.attribute.mp,
        ""
      ].join("|"),
      "",
      "|||||||",
      "|:---:|:---|:---:|:---|:---:|:---|",
      [
        `|◇アイディア|${data.characteristics.int * 5}`,
        `|◇知識|${data.characteristics.edu * 5}`,
        `|◇ダメージ・ボーナス|${data.attribute.db}|`
      ].join(""),
      [
        `|◇初期正気度|${data.characteristics.pow * 5}`,
        `|◇正気度|${data.attribute.san.value}/${data.attribute.san.max}`,
        `|◇幸運|${data.characteristics.pow * 5}|`
      ].join("")
    ].join("\r\n")
  });
}

function addSkills(data: Investigator, resultList: MemoStore[]) {
  resultList.push({
    tab: "技能",
    type: "url",
    text: [
      "@@@RELOAD-CHARACTER-SHEET@@@",
      "@@@RELOAD-CHARACTER-SHEET-ALL@@@",
      "## 技能",
      ...outputTableList<Skill>(
        data.skills,
        [
          { label: "技能（五十音順）", prop: "name", align: "left" },
          { label: "合計", prop: "value", align: "left" },
          { label: "補正", prop: "edited", align: "left" }
        ],
        (prop, value, data) => {
          if (prop.prop === "edited") {
            return data.edited ? "●" : "";
          }
          return data[prop.prop!]!.toString();
        }
      )
    ].join("\r\n")
  });
}

function addWeapon(data: Investigator, resultList: MemoStore[]) {
  console.log(JSON.stringify(data, null, "  "));
  resultList.push({
    tab: "武器/持ち物",
    type: "url",
    text: [
      "@@@RELOAD-CHARACTER-SHEET@@@",
      "@@@RELOAD-CHARACTER-SHEET-ALL@@@",
      "## 武器",
      "|名前|技能値|ダメージ|射程|攻撃回数|装弾数|故障|耐久力|",
      "|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|",
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
          weapon.hp,
          ""
        ].join("|")
      ),
      "## 冒険の装備とその他の所持品",
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
  });
}

function addCredit(data: Investigator, resultList: MemoStore[]) {
  resultList.push({
    tab: "財産/仲間",
    type: "url",
    text: [
      "@@@RELOAD-CHARACTER-SHEET@@@",
      "@@@RELOAD-CHARACTER-SHEET-ALL@@@",
      "## 収入と財産",
      "|||",
      "|:---:|:---|",
      `|◇収入|${data.credit.income}|`,
      `|◇手持ち現金|${data.credit.cash}|`,
      `|◇預金|${data.credit.deposit}|`,
      `|◇個人資産|${data.credit.personalProperty.replace(
        /\\r?\\n/g,
        "\\\\n"
      )}|`,
      `|◇不動産|${data.credit.realEstate.replace(/\\r?\\n/g, "\\\\n")}|`
    ].join("\r\n")
  });
}

function addBackStory(data: Investigator, resultList: MemoStore[]) {
  resultList.push({
    tab: "探索者のデータ",
    type: "url",
    text: [
      "@@@RELOAD-CHARACTER-SHEET@@@",
      "@@@RELOAD-CHARACTER-SHEET-ALL@@@",
      "## 探索者のデータ",
      "|||",
      "|:---:|:---|",
      `|◇住所|${data.personalData.address}|`,
      `|◇描写|${data.personalData.description.replace(/\\r?\\n/g, "\\\\n")}|`,
      `|◇家族＆友人|${data.personalData.family.replace(/\\r?\\n/g, "\\\\n")}|`,
      `|◇狂気の症状|${data.personalData.insanity.replace(
        /\\r?\\n/g,
        "\\\\n"
      )}|`,
      `|◇負傷|${data.personalData.injuries.replace(/\\r?\\n/g, "\\\\n")}|`,
      `|◇傷跡など|${data.personalData.scar.replace(/\\r?\\n/g, "\\\\n")}|`,
      "## 読んだクトゥルフ神話の魔導書",
      data.mythosTomes || "なし",
      "## アーティファクト／学んだ呪文",
      data.artifactsAndSpells || "なし",
      "## 遭遇した超自然の存在",
      data.encounters || "なし",
      "## メモ",
      data.note || "なし"
    ].join("\r\n")
  });
}
