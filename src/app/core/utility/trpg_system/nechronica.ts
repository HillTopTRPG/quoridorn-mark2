import { MemoStore } from "@/@types/store-data";
import { convertNumberZero, sum } from "@/app/core/utility/PrimaryDataUtility";
import {
  makeSelectStr,
  duplicateNameRename,
  outputTableList,
  updateData,
  regStr,
  tabTextProcess,
  readMultiLine
} from "@/app/core/utility/trpg_system/SaikoroFiction";
import { TrpgSystemHelper } from "@/app/core/utility/trpg_system/TrpgSystemHelper";
import moment from "moment";
import GameObjectManager from "@/app/basic/GameObjectManager";

export class NechronicaHelper extends TrpgSystemHelper<Nechronica> {
  public readonly isSupportedOtherText = true;
  public readonly isSupportedChatPalette = true;

  public constructor(url: string) {
    super(
      url,
      /https?:\/\/charasheet\.vampire-blood\.net\/(.+)/,
      "https://charasheet.vampire-blood.net/{key}.js"
    );
  }

  /**
   * このシステムに対応しているキャラシのURLかどうかを判定する
   * @return true: 対応したキャラシである, false: 対応したキャラシではない
   */
  public async isThis(): Promise<boolean> {
    if (!this.urlRegExp.test(this.url)) return false;
    const json = await this.getJsonData();
    return json["game"] === "nechro";
  }

  /**
   * その他欄の情報を生成する
   */
  public async createOtherText(
    memoList: Partial<StoreData<MemoStore>>[],
    updateInfo: string | undefined
  ): Promise<Partial<StoreData<MemoStore>>[] | null> {
    const { data, list } = await this.createResultList<MemoStore>();
    if (!data) return null;

    data.powerList.forEach(p => {
      const pName = p.name;
      if (/のうみそ[0-9]*/.test(pName)) p.actionNum = 2;
      if (/めだま[0-9]*/.test(pName)) p.actionNum = 1;
      const actionParts = data.action.partsList.find(ap => ap.name === pName);
      if (actionParts) {
        p.actionNum = convertNumberZero(actionParts.value);
      }
    });

    const existsMemoList = memoList.filter(m => m.collection !== "volatile");
    readData(data, existsMemoList);
    updateData(data, updateInfo);

    // 独自フラグによるデータ更新
    if (data.allPowerOpen) data.powerList.forEach(p => (p.isSecret = false));
    if (data.allPowerHide) data.powerList.forEach(p => (p.isSecret = true));

    data.loisList.forEach(l => {
      let res = loisTypeList.find(lt => lt.name === l.pos);
      if (!res) res = loisTypeList.find(lt => lt.name.startsWith(l.pos));
      l.pos = res?.name || l.pos;
      l.negative = res?.negative || l.negative;
      l.break = res?.break || l.break;
    });

    const isOwnerGm = existsMemoList.length
      ? GameObjectManager.getRootOwnerType(existsMemoList[0]) === "GM"
      : GameObjectManager.instance.isGm;

    // メモ
    this.addMemo(list);
    // パーソナルデータ
    addPersonal(data, list);
    // 管理
    addManagement(data, list);
    // マニューバ
    addManeuver(data, list, isOwnerGm);

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
    const { data } = await this.createResultList<string>();
    if (!data) return [];

    const characterName = data.characterName.substr(0, 4);

    const outputCommand = (afterText: string): string[] => {
      const suffix = afterText ? " " + afterText : "";
      return [
        "",
        `1nc+2${suffix}`,
        `1nc+1${suffix}`,
        `1nc${suffix}`,
        `1nc-1${suffix}`,
        `1nc-2${suffix}`
      ];
    };

    return [
      {
        name: `◆${characterName}１`,
        paletteText: [
          "nm 未練決定",
          ...outputCommand(""),
          ...outputCommand("対話判定："),
          ...outputCommand("行動判定"),
          ...outputCommand("狂気判定"),
          "",
          "たからものへの未練【依存】に狂気点＋１",
          "たからものへの未練【依存】から狂気点－１",
          "たからものへの未練【依存】が発狂（[幼児退行]最大行動値減少(-2)）",
          "",
          ...loisTypeList
            .filter(l => l)
            .flatMap(l => [
              `への未練【${l.name}】に狂気点＋１`,
              `への未練【${l.name}】から狂気点－１`,
              `への未練【${l.name}】が発狂`
            ]),
          "",
          "精神崩壊(未練が全て発狂状態)"
        ]
          .map(text => text.replaceAll(/\r?\n/g, ""))
          .join("\n")
      },
      {
        name: `◆${characterName}２`,
        paletteText: [
          "対象：",
          "対象：",
          "を攻撃",
          "を攻撃",
          "",
          ...hanteiTypeList
            .filter((_, ind) => ind >= 4)
            .map(h => `損傷：${h} 全損`),
          "損傷：完全解体",
          ...data.powerList.flatMap(p => {
            const resultList = [
              "",
              `【${p.name}】${p.hantei || "なし"}／${p.timing ||
                "なし"}／${p.cost || "なし"}／${p.range || "なし"}`
            ];
            if (hanteiTypeList.findIndex(h => h === p.hantei) >= 4) {
              resultList.push(`損傷：${p.hantei}【${p.name}】`);
              resultList.push(`修復：${p.hantei}【${p.name}】`);
            }
            resultList.push(`${p.memo}`);
            return resultList;
          })
        ]
          .map(text => text.replaceAll(/\r?\n/g, ""))
          .join("\n")
      }
    ];
  }

  /**
   * JSONPから取得した生データから処理用のデータを生成する
   * @param json JSONPから取得した生データ
   * @protected
   */
  protected createData(json: any): Nechronica | null {
    if (!json) return null;
    const textFilter = (text: string | null) => {
      if (!text) return "";
      return text.trim().replace(/\r?\n/g, "\n");
    };
    const getFlatNumberValue = (type: string) => [
      convertNumberZero(json[`${type}1`]),
      convertNumberZero(json[`${type}2`]),
      convertNumberZero(json[`${type}3`])
    ];
    const data: Nechronica = {
      url: this.url,
      characterName: textFilter(json["pc_name"]),
      tag: textFilter(json["pc_tags"]),
      positionName: textFilter(json["Position_Name"]),
      mainClass: textFilter(json["MCLS_Name"]),
      mainClassStatus: getFlatNumberValue("MC"),
      subClass: textFilter(json["SCLS_Name"]),
      subClassStatus: getFlatNumberValue("SC"),
      statusBonus:
        statusBonusList[convertNumberZero(json["ST_Bonus"]) - 1] || "",
      loveBonus: getFlatNumberValue("TM"),
      status: getFlatNumberValue("NP"),
      action: {
        total: convertNumberZero(json["Act_Total"]),
        partsList: ["A", "B", "C"]
          .map(type => ({
            name: json[`Act_parts_${type}`],
            isAlive: json[`Act_parts${type}_alive`] === "1",
            value: json[`Act_Parts${type}_Ef`]
          }))
          .filter(o => o.name || o.value),
        isAliveEyeball: json["medama_alive"] === "1",
        isAliveBrain: json["nou_alive"] === "1",
        other: 0
      },
      powerList: (json["Power_Lost"] as any[]).map((p, i) => ({
        name: textFilter(json["Power_name"][i]),
        isLost: textFilter(json["Power_Lost"][i]) === "1",
        isUsed: textFilter(json["Power_Used"][i]) === "1",
        type: powerTypeList[convertNumberZero(json["Power_Type"][i])] || "",
        hantei:
          hanteiTypeList[convertNumberZero(json["Power_hantei"][i])] || "",
        timing:
          timingTypeList[convertNumberZero(json["Power_timing"][i])] || "",
        cost: textFilter(json["Power_cost"][i]),
        range: textFilter(json["Power_range"][i]),
        shozoku: textFilter(json["Power_shozoku"][i]),
        memo: textFilter(json["Power_memo"][i]),
        isCut: false,
        rengeki: 0,
        hosei: 0,
        isSecret: false,
        actionNum: 0
      })),
      carmaList: (json["carma_name"] as any[])
        .map((_, i) => ({
          isCompleted: textFilter(json["carma_completed"][i]) === "1",
          memo: textFilter(json["carma_memo"][i]),
          name: textFilter(json["carma_name"][i])
        }))
        .filter(o => o.name || o.memo),
      kakeraList: (json["kakera_name"] as any[])
        .map((_, i) => ({
          name: textFilter(json["kakera_name"][i]),
          memo: textFilter(json["kakera_memo"][i])
        }))
        .filter(o => o.memo || o.name),
      loisList: (json["roice_break"] as any[])
        .map((_, i) => ({
          name: textFilter(json["roice_name"][i]),
          pos: textFilter(json["roice_pos"][i]),
          damage: loisDamageList[convertNumberZero(json["roice_damage"][i])],
          negative: textFilter(json["roice_neg"][i]),
          break: textFilter(json["roice_break"][i]),
          memo: textFilter(json["roice_memo"][i])
        }))
        .filter(o => o.name || o.pos || o.negative || o.break || o.memo),
      exp: textFilter(json["exp_his_sum"]),
      sessionList: (json["adv_exp_his"] as any[])
        .map((_, i) => ({
          advanceExp: textFilter(json["adv_exp_his"][i]),
          bonusExp: textFilter(json["bns_exp_his"][i]),
          sumExp: textFilter(json["get_exp_his"][i]),
          memo: textFilter(json["seicho_memo_his"][i])
        }))
        .filter(o => o.advanceExp || o.bonusExp || o.memo),
      shuzoku: textFilter(json["shuzoku"]),
      age: textFilter(json["age"]),
      initLocate: "煉獄",
      height: textFilter(json["pc_height"]),
      weight: textFilter(json["pc_weight"]),
      carma: textFilter(json["pc_carma"]),
      hairColor: textFilter(json["color_hair"]),
      eyeColor: textFilter(json["color_eye"]),
      skinColor: textFilter(json["color_skin"]),
      memo: textFilter(json["pc_making_memo"]),
      memoRows: convertNumberZero(json["pc_making_memo_rows"]),
      allPowerOpen: false,
      allPowerHide: false,
      taiwaHosei: 0,
      kyoukiHosei: 0,
      actionHosei: 0
    };
    duplicateNameRename(data.powerList, "name");
    return data;
  }
}

const powerTypeList: string[] = [
  "",
  "通常技",
  "必殺技",
  "行動値増加",
  "補助",
  "妨害",
  "防御/生贄",
  "移動"
];

const loisTypeList: { name: string; negative: string; break: string }[] = [
  { name: "", negative: "", break: "" },
  {
    name: "嫌悪",
    negative: "敵対認識",
    break:
      "敵に命中しなかった攻撃は全て、射程内にいるなら嫌悪の対象に命中する。(防御側任意)"
  },
  {
    name: "独占",
    negative: "独占衝動",
    break: "戦闘開始時と終了時に１つずつ、対象はパーツを選んで損傷する。"
  },
  {
    name: "依存",
    negative: "幼児退行",
    break: "最大行動値が減少する(-2)"
  },
  {
    name: "執着",
    negative: "追尾監視",
    break: "戦闘開始時と終了時に1つずつ、対象はあなたへの未練に狂気点を得る。"
  },
  {
    name: "恋心",
    negative: "自傷行動",
    break: "戦闘開始時と終了時に1つずつ、あなたはパーツを選んで損傷する。"
  },
  {
    name: "対抗",
    negative: "過剰競争",
    break:
      "戦闘開始時と終了時に1つずつ、あなたは任意の未練に狂気点を追加で得る。"
  },
  {
    name: "友情",
    negative: "共鳴依存",
    break:
      "セッション終了時、対象にあなたよりも多く損傷したパーツがある際、あなたは損傷パーツ数が対象と同じになるまで、パーツを損傷させる。"
  },
  {
    name: "保護_姉妹",
    negative: "常時密着",
    break:
      "あなたが対象と別エリアにいるなら「移動以外の効果を持つマニューバ」を宣言できない。「自身と対象」以外を移動マニューバの対象にできない。"
  },
  {
    name: "憧憬",
    negative: "贋作妄想",
    break:
      "あなたが対象と同エリアにいるなら「移動以外の効果を持つマニューバ」を宣言できない。「自身と対象」以外を移動マニューバの対象にできない。"
  },
  {
    name: "信頼",
    negative: "疑心暗鬼",
    break: "あなた以外の全ての姉妹の最大行動値が減少する(-1)"
  },
  {
    name: "恐怖",
    negative: "認識拒否",
    break: "あなたは、行動判定・狂気判定の出目に修正-1を受ける。"
  },
  {
    name: "隷属",
    negative: "造反有理",
    break: "あなたが失敗した攻撃判定は全て、大失敗として扱う。"
  },
  {
    name: "不安",
    negative: "挙動不審",
    break: "最大行動値が減少する(-2)"
  },
  {
    name: "憐憫",
    negative: "過情移入",
    break: "あなたは「サヴァント」に対する攻撃判定の出目に修正-1を受ける。"
  },
  {
    name: "愛憎",
    negative: "凶愛心中",
    break:
      "あなたは狂気判定・攻撃判定で大成功するごとに[判定値-10]個の自身のパーツを選び、損傷させる。"
  },
  {
    name: "懺悔",
    negative: "自業自棄",
    break:
      "あなたが失敗した攻撃判定は全て、あなた自身の任意の箇所にダメージを与える。"
  },
  {
    name: "軽蔑",
    negative: "眼中不在",
    break: "同エリアの手駒があなたに対して行う攻撃判定の出目は修正+1を受ける。"
  },
  {
    name: "憤怒",
    negative: "激情暴走",
    break: "あなたは、攻撃判定・狂気判定の出目に修正-1を受ける。"
  },
  {
    name: "怨念",
    negative: "不倶戴天",
    break:
      "あなたは逃走判定ができない。あなたが「自身と未練の対象」以外を対象にしたマニューバを使用する際、行動値1点を追加で減らさなくてはいけない。"
  },
  {
    name: "憎悪",
    negative: "痕跡破壊",
    break:
      "この未練を発狂した際、あなた以外の姉妹から1人選ぶ。その姉妹は任意のパーツを2つ損傷する。"
  },
  {
    name: "忌避",
    negative: "隔絶意識",
    break:
      "あなたは未練の対象ないしサヴァントと同じエリアにいる間、「移動以外の効果を持つマニューバ」を宣言できない。また、「自身と未練の対象ないしサヴァント」以外を移動マニューバの対象にできない。"
  },
  {
    name: "嫉妬",
    negative: "不協和音",
    break: "全ての姉妹は行動判定に修正-1を受ける。"
  },
  {
    name: "感謝",
    negative: "病的返礼",
    break:
      "発狂した際、あなたは任意の基本パーツ2つ（なければ最もレベルの低い強化パーツ1つ）を損傷する。"
  },
  {
    name: "悔恨",
    negative: "自業自棄",
    break:
      "あなたが失敗した攻撃判定は全て、あなた自身の任意の箇所にダメージを与える。"
  },
  {
    name: "期待",
    negative: "希望転結",
    break:
      "あなたは狂気点を追加して振り直しを行う際、出目に修正-1を受ける。（この効果は累積する）"
  },
  {
    name: "保護_中立",
    negative: "生前回帰",
    break: "あなたは「レギオン」をマニューバの対象に選べない。"
  },
  {
    name: "尊敬",
    negative: "神化崇拝",
    break: "あなたは「他の姉妹」をマニューバの対象に選べない。"
  }
];

const statusBonusList: string[] = ["武装", "変異", "改造", ""];

const hanteiTypeList: string[] = [
  "",
  "ﾎﾟｼﾞｼｮﾝ",
  "ﾒｲﾝｸﾗｽ",
  "ｻﾌﾞｸﾗｽ",
  "頭",
  "腕",
  "胴",
  "足"
];

const timingTypeList: string[] = [
  "オート",
  "アクション",
  "ジャッジ",
  "ダメージ",
  "ラピッド"
];

type ActionParts = {
  name: string;
  isAlive: boolean;
  value: string;
};

type Power = {
  name: string;
  isLost: boolean;
  isUsed: boolean;
  type: string;
  hantei: string;
  timing: string;
  cost: string;
  range: string;
  shozoku: string;
  memo: string;
  isCut: boolean;
  rengeki: number;
  hosei: number;
  isSecret: boolean;
  actionNum: number;
};

type Carma = {
  isCompleted: boolean;
  name: string;
  memo: string;
};

type Kakera = {
  name: string;
  memo: string;
};

const loisDamageList: string[] = ["0", "1", "2", "3", "発狂"];

type Lois = {
  name: string;
  // 種類
  pos: string;
  // 狂気値
  damage: string;
  // あれ
  negative: string;
  // 発狂効果
  break: string;
  memo: string;
};

type Session = {
  advanceExp: string;
  bonusExp: string;
  sumExp: string;
  memo: string;
};

type Nechronica = {
  url: string;
  characterName: string;
  tag: string;
  positionName: string;
  mainClass: string;
  mainClassStatus: number[]; // arr[0]: 武装, arr[1]: 変異, arr[2]: 改造
  subClass: string;
  subClassStatus: number[]; // arr[0]: 武装, arr[1]: 変異, arr[2]: 改造
  statusBonus: string; // 1: 武装, 2: 変異, 3: 改造
  loveBonus: number[]; // arr[0]: 武装, arr[1]: 変異, arr[2]: 改造
  status: number[]; // arr[0]: 武装, arr[1]: 変異, arr[2]: 改造
  action: {
    total: number;
    partsList: ActionParts[];
    isAliveEyeball: boolean;
    isAliveBrain: boolean;
    other: number;
  };
  powerList: Power[];
  carmaList: Carma[];
  kakeraList: Kakera[];
  loisList: Lois[];
  exp: string;
  sessionList: Session[];
  shuzoku: string;
  age: string;
  initLocate: "煉獄" | "花園" | "楽園";
  height: string;
  weight: string;
  carma: string;
  hairColor: string;
  eyeColor: string;
  skinColor: string;
  memo: string;
  memoRows: number;
  allPowerOpen: boolean;
  allPowerHide: boolean;
  taiwaHosei: number;
  kyoukiHosei: number;
  actionHosei: number;
};

function readData(data: Nechronica, memoList: Partial<StoreData<MemoStore>>[]) {
  tabTextProcess("管理", memoList, text => {
    // カルマの読み込み
    readMultiLine(
      data.carmaList,
      text,
      [regStr.check, regStr.text, regStr.text].join("\\|"),
      "name",
      2,
      { 1: ["isCompleted", "b"] }
    );

    Array.from(
      text.matchAll(
        new RegExp(
          `^\\|${[regStr.text, regStr.select, regStr.button].join("\\|")}\\|$`,
          "gm"
        )
      )
    ).forEach(r => {
      const name = r[1];
      const hosei = convertNumberZero(r[3]);
      if (name === "対話判定") data.taiwaHosei = hosei;
      if (name === "狂気判定") data.kyoukiHosei = hosei;
      if (name === "行動判定") data.actionHosei = hosei;
    });

    // 未練の読み込み
    readMultiLine(
      data.loisList,
      text,
      [
        regStr.text,
        regStr.select,
        regStr.select + regStr.button,
        regStr.text
      ].join("\\|"),
      "name",
      1,
      { 3: ["pos", "s"], 5: ["damage", "s"] }
    );
  });

  tabTextProcess("◇M_INPUT", memoList, text => {
    // 行動値の読み込み
    const matchResult = text.match(
      new RegExp(
        `\\|${[
          "\\*{2}[0-9]+\\*{2}",
          "(?:\\|(?:[+-]?[0-9]+?|損傷中))+\\|",
          regStr.select
        ].join("")}\\|`
      )
    );
    if (matchResult) {
      data.action.other = convertNumberZero(matchResult[2]);
    }

    // マニューバの読み込み
    readMultiLine(
      data.powerList,
      text,
      [
        `¦?${regStr.check}${regStr.button}`, // 損傷 isLost
        `\\|¦?${regStr.check}`, // 使用 isUsed
        `\\|${regStr.text}`, // マニューバ name
        `\\|${regStr.button}`, // 宣言
        `\\|¦?${regStr.select}`, // 補正 hosei
        `\\|${regStr.button}`, // 判定
        `\\|¦?${regStr.check}`, // 切断 isCut
        `\\|¦?${regStr.select}`, // 連撃 rengeki
        `\\|¦?${regStr.select}`, // 行動値 actionNum
        `(?:\\|¦?${regStr.check})?` // 隠す
      ].join(""),
      "name",
      3,
      {
        1: ["isLost", "b"],
        2: ["isUsed", "b"],
        5: ["hosei", "n"],
        6: ["isCut", "b"],
        8: ["rengeki", "n"],
        10: ["actionNum", "n"],
        11: ["isSecret", "b"]
      },
      false
    );
  });
}

function addPersonal(
  data: Nechronica,
  resultList: Partial<StoreData<MemoStore>>[]
) {
  resultList.push({
    data: {
      tab: "パーソナルデータ",
      type: "url",
      text: [
        `@@@RELOAD-CHARACTER-SHEET-ALL@@@ ${moment().format(
          "YYYY/MM/DD HH:mm:ss"
        )}`,
        "## 基本情報",
        `PC: ${data.characterName}`,
        `タグ: ${data.tag}`,
        "|||||||",
        "|--:|:--|--:|:--|--:|:--|",
        `|◇種族|${data.shuzoku}|◇享年|${data.age}|◇初期配置|${data.initLocate}|`,
        `|◇身長|${data.height}|◇体重|${data.weight}|◇暗示|${data.carma}|`,
        `|◇髪の色|${data.hairColor}|◇瞳の色|${data.eyeColor}|◇肌の色|${data.skinColor}|`,
        "",
        "## 記憶のカケラ",
        ...outputTableList<Kakera>(data.kakeraList, [
          { label: "名前", prop: "name", align: "left" },
          { label: "詳細", prop: "memo", align: "left" }
        ]),
        "",
        "## 基本設計",
        "||武装|変異|改造|",
        "|:--|:--:|:--:|:--:|",
        `|ﾎﾟｼﾞｼｮﾝ：${data.positionName}|-|-|-|`,
        `|ﾒｲﾝｸﾗｽ：${data.mainClass}|${data.mainClassStatus.join("|")}|`,
        `|ｻﾌﾞｸﾗｽ：${data.subClass}|${data.subClassStatus.join("|")}|`,
        `|ﾎﾞｰﾅｽ|${data.statusBonus === "武装" ? "●" : ""}|${
          data.statusBonus === "変異" ? "●" : ""
        }|${data.statusBonus === "改造" ? "●" : ""}|`,
        `|寵愛による修正|${data.loveBonus.join("|")}|`,
        `|総計|${data.status.join("|")}|`,
        "",
        ""
      ].join("\r\n")
    }
  });
}

function addManagement(
  data: Nechronica,
  resultList: Partial<StoreData<MemoStore>>[]
) {
  const createDamageButton = (l: Lois, add: number): string => {
    const idx = loisDamageList.findIndex(s => s === l.damage);
    if (idx === 0 && add < 0) return "";
    if (idx === loisDamageList.length - 1 && add > 0) return "";
    if (add > 0) {
      const after = loisDamageList[idx + 1];
      const effect =
        idx < loisDamageList.length - 2
          ? `に狂気点+1(${l.damage}→${after})`
          : `が発狂（${l.break}）`;
      return `@@@CHAT-CMD:[+1¦loisList{name:${l.name}}.damage=${after}]【${l.name}】への未練【${l.pos}】${effect}@@@`;
    } else {
      const after = loisDamageList[idx - 1];
      const effect =
        idx < loisDamageList.length - 1
          ? `に狂気点-1(${l.damage}→${after})`
          : "の発狂が回復(=3)";
      return `@@@CHAT-CMD:[-1¦loisList{name:${l.name}}.damage=${
        loisDamageList[idx - 1]
      }]【${l.name}】への未練【${l.pos}】${effect}@@@`;
    }
  };
  const createHantei = (
    name: string,
    command: string,
    prop?: keyof Nechronica
  ) => {
    const addStr = prop ? `${data[prop] > 0 ? "+" : ""}${data[prop]}` : "";
    const selectStr = prop
      ? `|${makeSelectStr("補正", data[prop], { s: -5, e: 5, h: true })}`
      : "";
    const fullCommand = `${command}${prop && data[prop] ? addStr : ""}`;
    return `|${name}${selectStr}|@@@CHAT-CMD:[${fullCommand}]${fullCommand} ${name}@@@|`;
  };
  resultList.push({
    data: {
      tab: "管理",
      type: "url",
      text: [
        `@@@RELOAD-CHARACTER-SHEET-ALL@@@ ${moment().format(
          "YYYY/MM/DD HH:mm:ss"
        )}`,
        "## カルマ",
        ...outputTableList<Carma>(data.carmaList, [
          { label: "達成", prop: "isCompleted", align: "center" },
          { label: "条件", prop: "name", align: "left" },
          { label: "詳細", prop: "memo", align: "left" }
        ]),
        "",
        "## 判定",
        "|判定|補正||",
        "|:--|:--|:--|",
        createHantei("対話判定", "1nc", "taiwaHosei"),
        createHantei("狂気判定", "1nc", "kyoukiHosei"),
        createHantei("行動判定", "1nc", "actionHosei"),
        "",
        "## 未練",
        [
          "@@@CHAT-CMD:[未練表(姉妹)]nm 未練表(姉妹)@@@",
          "@@@CHAT-CMD:[未練表(中立者)]nmn 未練表(中立者)@@@",
          "@@@CHAT-CMD:[未練表(敵)]nme 未練表(敵)@@@",
          " @@@CHAT-CMD:[]精神崩壊(未練が全て発狂状態)@@@"
        ].join(""),
        "|対象|種類|狂気度|備考など|",
        "|:--|:--|:--|:--|",
        ...data.loisList.map(
          r =>
            `|${r.name}|${makeSelectStr("種類", r.pos, {
              b: loisTypeList.map(lt => lt.name)
            })}|${makeSelectStr("狂気度", r.damage, {
              s: 0,
              e: 3,
              a: ["発狂"]
            })}${createDamageButton(r, -1)}${createDamageButton(r, 1)}|${
              r.memo
            }|`
        ),
        "",
        "|種類|発狂|発狂効果|",
        "|:--|:--|:--|",
        ...data.loisList
          .map(l => loisTypeList.find(lt => lt.name === l.pos))
          .filter(
            (lt, idx, self) =>
              self.findIndex(s => s && s.name === lt?.name) === idx
          )
          .map(lt =>
            [
              "",
              lt!.name,
              lt!.negative,
              Array.from(lt!.break.matchAll(/.{1,28}/g)).join("<br>"),
              ""
            ].join("|")
          )
      ].join("\r\n")
    }
  });
}

function addManeuver(
  data: Nechronica,
  resultList: Partial<StoreData<MemoStore>>[],
  isOwnerGm: boolean
) {
  const gmGroupKey = GameObjectManager.instance.authorityGroupList.find(
    ag => ag.data!.isSystem && ag.data!.name === "GameMasters"
  )!.key;
  const gmAllowChmodGroup: PermissionRule = {
    type: "allow",
    list: [{ type: "group", key: gmGroupKey }]
  };

  const inputTableColumns: {
    label: string;
    prop: keyof Power | null;
    align: "left" | "center" | "right";
  }[] = [
    { label: "損傷", prop: "isLost", align: "left" },
    { label: "使用", prop: "isUsed", align: "center" },
    { label: "マニューバ", prop: "name", align: "left" },
    { label: "", prop: "name", align: "center" },
    { label: "補正", prop: "hosei", align: "left" },
    { label: "判定", prop: "name", align: "left" },
    { label: "切断", prop: "isCut", align: "center" },
    { label: "連撃", prop: "rengeki", align: "left" },
    { label: "行動値", prop: "actionNum", align: "left" }
  ];
  const textList: string[] = [
    `@@@RELOAD-CHARACTER-SHEET-ALL@@@ ${moment().format("YYYY/MM/DD HH:mm:ss")}`
  ];
  if (isOwnerGm) {
    inputTableColumns.push({
      label: "隠す",
      prop: "isSecret",
      align: "center"
    });
    textList.push("このタブはGMにしか見えません。");
  }
  const actionPowerList = data.powerList.filter(p => p.actionNum);
  const numF = (n: number) => `${n > 0 ? "+" : ""}${n}`;
  // 依存, 不安
  const actionLoisList = ["依存", "不安"];
  const loisList = data.loisList.filter(
    l => actionLoisList.some(al => al === l.pos) && l.damage === "発狂"
  );
  const nameList = actionPowerList
    .map(p => p.name)
    .concat(loisList.map(l => l.pos));
  textList.push(
    "## 行動値",
    `|合計|基本${nameList.map(n => `|${n}`).join("")}||`,
    `|:--:|:--:${nameList.map(() => "|:--:").join("")}|:--:|`,
    `|**${sum(data.powerList.filter(p => !p.isLost).map(p => p.actionNum)) +
      6 +
      data.action.other -
      loisList.length * 2}**|6${actionPowerList
      .map(p => `${p.isLost ? "|損傷中" : `|${numF(p.actionNum)}`}`)
      .join("")}${loisList.map(_ => `|-2`).join("")}|${makeSelectStr(
      "行動値",
      data.action.other,
      { s: -5, e: 5, h: true }
    )}|`,
    "",
    "## マニューバ（入力）"
  );
  if (isOwnerGm) {
    textList.push(
      `「隠す」にチェックを入れると「マニューバ」タブに表示されません。`
    );
    textList.push(
      [
        "@@@CHAT-CMD:[全て隠す¦allPowerHide=true]@@@",
        "@@@CHAT-CMD:[全て公開¦allPowerOpen=true]@@@",
        " @@@CHAT-CMD:[]損傷：完全解体@@@"
      ].join("")
    );
  }
  textList.push(
    ...outputTableList<Power>(
      data.powerList,
      inputTableColumns,
      (prop, value, data) => {
        const propStr = `powerList{name:${data.name}}`;
        const fullStr = `【${data.name}】${data.hantei}/${data.timing}/${data.cost}/${data.range}`;
        const checkStr = value ? "[x]" : "[ ]";
        const mark = value ? "¦" : "";
        const makeSelectStrWrap = makeSelectStr.bind(null, prop.label, value);

        switch (prop.label) {
          case "損傷":
            const lostStr = data.isLost ? "修復" : "損傷";
            const buttonStr = `@@@CHAT-CMD:[${lostStr}¦${propStr}.isLost=${!data.isLost}]${lostStr}：${
              data.hantei
            }【${data.name}】@@@`;
            return `${mark}${checkStr}${buttonStr}`;

          case "使用": // non-break
          case "切断": // non-break
          case "隠す":
            return `${mark}${checkStr}`;

          case "連撃": // non-break
          case "行動値":
            return `${mark}${makeSelectStrWrap({ s: 0, e: 3 })}`;

          case "補正":
            return `${mark}${makeSelectStrWrap({ s: -5, e: 5, h: true })}`;

          case "":
            return `@@@CHAT-CMD:[宣言]${fullStr} ${data.memo}@@@`;

          case "判定":
            let command = "1na";
            if (data.hosei > 0) command += `+${data.hosei}`;
            if (data.hosei < 0) command += `${data.hosei}`;
            const normal = `@@@CHAT-CMD:[${command} 使用判定]${command} ${fullStr} ${data.memo}@@@`;
            const cut = `@@@CHAT-CMD:[${command} 切断判定]${command} 【${data.name}】切断判定@@@`;
            const rengeki: string[] = [...Array(Math.max(data.rengeki, 0))].map(
              (_, idx) =>
                `@@@CHAT-CMD:[${command} ${idx + 2}回目]${command} 【${
                  data.name
                }】${idx + 2}回目（連撃）@@@`
            );

            const textList: string[] = [normal, ...rengeki];
            if (data.isCut) textList.push(cut);
            return textList.join("<br>");

          default:
            return null;
        }
      }
    )
  );
  resultList.push({
    permission: isOwnerGm
      ? {
          view: gmAllowChmodGroup,
          edit: gmAllowChmodGroup,
          chmod: gmAllowChmodGroup
        }
      : undefined,
    data: {
      tab: "◇M_INPUT",
      type: "url",
      text: textList.join("\r\n")
    }
  });
  if (isOwnerGm) {
    resultList.push({
      permission: {
        view: gmAllowChmodGroup,
        edit: gmAllowChmodGroup,
        chmod: gmAllowChmodGroup
      },
      data: {
        tab: "◇GM",
        type: "url",
        text: [
          `@@@RELOAD-CHARACTER-SHEET-ALL@@@ ${moment().format(
            "YYYY/MM/DD HH:mm:ss"
          )}`,
          "このタブはGMにしか見えず、全てのマニューバを閲覧できます。",
          "## マニューバ（GM閲覧）",
          ...outputTableList<Power>(
            data.powerList,
            [
              { label: "損傷", prop: "isLost", align: "left" },
              { label: "使用", prop: "isUsed", align: "center" },
              { label: "カテゴリ", prop: "type", align: "center" },
              { label: "部位", prop: "hantei", align: "center" },
              { label: "マニューバ", prop: "name", align: "left" },
              { label: "タイミング", prop: "timing", align: "center" },
              { label: "ｺｽﾄ", prop: "cost", align: "right" },
              { label: "射程", prop: "range", align: "center" },
              { label: "効果", prop: "memo", align: "left" },
              { label: "取得先", prop: "shozoku", align: "left" }
            ],
            (prop, value, data) => {
              if (prop.label === "損傷") return data.isLost ? "損傷" : "";
              if (prop.label === "使用") return data.isUsed ? "済" : "";
              if (prop.label === "マニューバ") return `**${value}**`;
              return null;
            }
          )
        ].join("\r\n")
      }
    });
  }
  resultList.push({
    data: {
      tab: "マニューバ",
      type: "url",
      text: [
        `@@@RELOAD-CHARACTER-SHEET-ALL@@@ ${moment().format(
          "YYYY/MM/DD HH:mm:ss"
        )}`,
        "## マニューバ",
        ...outputTableList<Power>(
          data.powerList.filter(p => !p.isSecret),
          [
            { label: "損傷", prop: "isLost", align: "center" },
            { label: "使用", prop: "isUsed", align: "center" },
            { label: "カテゴリ", prop: "type", align: "center" },
            { label: "部位", prop: "hantei", align: "center" },
            { label: "マニューバ", prop: "name", align: "left" },
            { label: "タイミング", prop: "timing", align: "center" },
            { label: "ｺｽﾄ", prop: "cost", align: "right" },
            { label: "射程", prop: "range", align: "center" },
            { label: "効果", prop: "memo", align: "left" },
            { label: "取得先", prop: "shozoku", align: "left" }
          ],
          (prop, value, data) => {
            if (prop.label === "損傷") return data.isLost ? "損傷" : "";
            if (prop.label === "使用") return data.isUsed ? "済" : "";
            if (prop.label === "マニューバ") return `**${value}**`;
            return null;
          }
        )
      ].join("\r\n")
    }
  });
}
