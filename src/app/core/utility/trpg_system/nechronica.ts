import { getJsonForTrpgSystemData } from "@/app/core/utility/Utility";
import { MemoStore } from "@/@types/store-data";
import { TrpgSystemHelper } from "@/app/core/utility/trpg_system/TrpgSystemFasade";
import { convertNumberZero } from "@/app/core/utility/PrimaryDataUtility";
import { outputTableList } from "@/app/core/utility/trpg_system/SaikoroFiction";

// URL
const urlRegExp = /https?:\/\/charasheet\.vampire-blood\.net\/(.+)/;
const jsonpUrl = "https://charasheet.vampire-blood.net/{key}.js";

const nechronica: TrpgSystemHelper = {
  isThis: async (url: string) => {
    if (!url.match(urlRegExp)) return false;
    const json = await getJsonForTrpgSystemData<any>(url, urlRegExp, jsonpUrl);
    return json["game"] === "nechro";
  },
  createOtherText: async (url: string): Promise<MemoStore[] | null> => {
    const json = await getJsonForTrpgSystemData<any>(url, urlRegExp, jsonpUrl);
    if (!json) return null;
    const data = createData(url, json);
    // console.log(JSON.stringify(json, null, "  "));
    // console.log(JSON.stringify(data, null, "  "));

    const resultList: MemoStore[] = [];

    // メモ
    addMemo(data, resultList);
    // パーソナルデータ
    addPersonal(data, resultList);
    // 管理
    addManagement(data, resultList);
    // マニューバ
    addManeuver(data, resultList);

    return resultList;
  }
};

export default nechronica;

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

const loisTypeList: string[] = [
  "",
  "嫌悪",
  "独占",
  "依存",
  "執着",
  "恋心",
  "対抗",
  "友情",
  "保護",
  "憧憬",
  "信頼",
  "恐怖",
  "隷属",
  "不安",
  "憐憫",
  "愛憎",
  "悔恨",
  "軽蔑",
  "憤怒",
  "怨念",
  "憎悪",
  "忌避",
  "嫉妬",
  "感謝",
  "期待",
  "尊敬"
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
  pos: string;
  damage: string;
  negative: string;
  break: string;
  memo: string;
};

type Session = {
  advanceExp: string;
  bonusExp: string;
  sumExp: string;
  memo: string;
};

type Nechornica = {
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
};

function createData(url: string, json: any): Nechornica {
  const textFilter = (text: string | null) => {
    if (!text) return "";
    return text.trim();
  };
  const getFlatNumberValue = (type: string) => [
    convertNumberZero(json[`${type}1`]),
    convertNumberZero(json[`${type}2`]),
    convertNumberZero(json[`${type}3`])
  ];
  return {
    url,
    characterName: textFilter(json["pc_name"]),
    tag: textFilter(json["pc_tags"]),
    positionName: textFilter(json["Position_Name"]),
    mainClass: textFilter(json["MCLS_Name"]),
    mainClassStatus: getFlatNumberValue("MC"),
    subClass: textFilter(json["SCLS_Name"]),
    subClassStatus: getFlatNumberValue("SC"),
    statusBonus: statusBonusList[convertNumberZero(json["ST_Bonus"]) - 1] || "",
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
      isAliveBrain: json["nou_alive"] === "1"
    },
    powerList: (json["Power_Lost"] as any[]).map((p, i) => ({
      name: textFilter(json["Power_name"][i]),
      isLost: textFilter(json["Power_Lost"][i]) === "1",
      isUsed: textFilter(json["Power_Used"][i]) === "1",
      type: powerTypeList[convertNumberZero(json["Power_Type"][i])] || "",
      hantei: hanteiTypeList[convertNumberZero(json["Power_hantei"][i])] || "",
      timing: timingTypeList[convertNumberZero(json["Power_timing"][i])] || "",
      cost: textFilter(json["Power_cost"][i]),
      range: textFilter(json["Power_range"][i]),
      shozoku: textFilter(json["Power_shozoku"][i]),
      memo: textFilter(json["Power_memo"][i])
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
    memoRows: convertNumberZero(json["pc_making_memo_rows"])
  };
}

function addMemo(data: Nechornica, resultList: MemoStore[]) {
  resultList.push({
    tab: "メモ",
    type: "normal",
    text: ["### メモ", ":::200px:100px", ":::END;;;"].join("\r\n")
  });
}

function addPersonal(data: Nechornica, resultList: MemoStore[]) {
  const strList: string[] = [];

  strList.push("@@@RELOAD-CHARACTER-SHEET@@@");
  strList.push("@@@RELOAD-CHARACTER-SHEET-ALL@@@");

  // 基本情報
  strList.push("## 基本情報");
  strList.push(`PC: ${data.characterName}`);
  strList.push(`タグ: ${data.tag}`);

  strList.push("|||||||");
  strList.push("|--:|:--|--:|:--|--:|:--|");
  strList.push(
    `|◇種族|${data.shuzoku}|◇享年|${data.age}|◇初期配置|${data.initLocate}|`
  );
  strList.push(
    `|◇身長|${data.height}|◇体重|${data.weight}|◇暗示|${data.carma}|`
  );
  strList.push(
    `|◇髪の色|${data.hairColor}|◇瞳の色|${data.eyeColor}|◇肌の色|${data.skinColor}|`
  );
  strList.push("");

  // 記憶のカケラ
  strList.push("## 記憶のカケラ");
  strList.push(
    ...outputTableList<Kakera>(data.kakeraList, [
      { label: "名前", prop: "name", align: "left" },
      { label: "詳細", prop: "memo", align: "left" }
    ])
  );
  strList.push("");

  // 基本設計
  strList.push("## 基本設計");
  strList.push("||武装|変異|改造|");
  strList.push("|:--|:--:|:--:|:--:|");
  strList.push(`|ﾎﾟｼﾞｼｮﾝ：${data.positionName}|-|-|-|`);
  strList.push(`|ﾒｲﾝｸﾗｽ：${data.mainClass}|${data.mainClassStatus.join("|")}|`);
  strList.push(`|ｻﾌﾞｸﾗｽ：${data.subClass}|${data.subClassStatus.join("|")}|`);
  strList.push(
    `|ﾎﾞｰﾅｽ|${data.statusBonus === "武装" ? "●" : ""}|${
      data.statusBonus === "変異" ? "●" : ""
    }|${data.statusBonus === "改造" ? "●" : ""}|`
  );
  strList.push(`|寵愛による修正|${data.loveBonus.join("|")}|`);
  strList.push(`|総計|${data.status.join("|")}|`);

  resultList.push({
    tab: "パーソナルデータ",
    type: "url",
    text: strList.join("\r\n")
  });
}

function addManagement(data: Nechornica, resultList: MemoStore[]) {
  const strList: string[] = [];

  strList.push("@@@RELOAD-CHARACTER-SHEET@@@");
  strList.push("@@@RELOAD-CHARACTER-SHEET-ALL@@@");

  // 行動値
  strList.push("## 行動値");
  strList.push(
    `|パーツ名|合計|基本|のうみそ|めだま|${data.action.partsList
      .map(p => p.name)
      .join("|")}||`
  );
  strList.push(
    `|:--:|:--:|:--:|:--:|:--:|${data.action.partsList
      .map(() => ":--:")
      .join("|")}|:--:|`
  );
  const selectStr = `{合計}[${new Array((data.action.partsList.length + 3) * 2)
    .fill("")
    .map((_: string, index: number) => index + 6)
    .join("|")}](${data.action.total})`;
  strList.push(
    `|行動値|${selectStr}|6|[${data.action.isAliveBrain ? "x" : " "}]+2|[${
      data.action.isAliveEyeball ? "x" : " "
    }]+1|${data.action.partsList
      .map(p => `[${p.isAlive ? "x" : " "}]+${p.value}`)
      .join("|")}|[x]+{行動値}[0|1|2|3](0)|`
  );
  strList.push("");

  // カルマ
  strList.push("## カルマ");
  strList.push(
    ...outputTableList<Carma>(data.carmaList, [
      { label: "達成", prop: "isCompleted", align: "center" },
      { label: "条件", prop: "name", align: "left" },
      { label: "詳細", prop: "memo", align: "left" }
    ])
  );
  strList.push("");

  // 未練
  strList.push("## 未練");
  strList.push("|対象|種類|狂気度|発狂|発狂効果|備考など|");
  strList.push("|:--|:--|:--|:--|:--|:--|");
  data.loisList.forEach(r => {
    strList.push(
      `|${r.name}|{種類}[${loisTypeList.join("|")}](${
        r.pos
      })|{狂気度}[0|1|2|3|発狂](${r.damage})|${r.negative}|${r.break}|${
        r.memo
      }|`
    );
  });

  resultList.push({ tab: "管理", type: "url", text: strList.join("\r\n") });
}

function addManeuver(data: Nechornica, resultList: MemoStore[]) {
  const strList: string[] = [];

  strList.push("@@@RELOAD-CHARACTER-SHEET@@@");
  strList.push("@@@RELOAD-CHARACTER-SHEET-ALL@@@");

  // マニューバ
  strList.push("## マニューバ");
  strList.push(
    ...outputTableList<Power>(data.powerList, [
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
    ])
  );

  resultList.push({
    tab: "マニューバ",
    type: "url",
    text: strList.join("\r\n")
  });
}
