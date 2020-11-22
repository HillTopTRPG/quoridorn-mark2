import { getJsonForTrpgSystemData } from "@/app/core/utility/Utility";
import { MemoStore } from "@/@types/store-data";
import { listToEmpty } from "@/app/core/utility/PrimaryDataUtility";

type NechronicaClass =
  | ""
  | "ステーシー"
  | "タナトス"
  | "ゴシック"
  | "レクイエム"
  | "バロック"
  | "ロマネスク"
  | "サイケデリック";

type NechronicaPowerType =
  | ""
  | "通常技"
  | "必殺技"
  | "行動値増加"
  | "補助"
  | "妨害"
  | "防御/生贄"
  | "移動";
const nechronicaPowerTypeList: NechronicaPowerType[] = [
  "",
  "通常技",
  "必殺技",
  "行動値増加",
  "補助",
  "妨害",
  "防御/生贄",
  "移動"
];

type NechronicaHanteiType =
  | ""
  | "ﾎﾟｼﾞｼｮﾝ"
  | "ﾒｲﾝｸﾗｽ"
  | "ｻﾌﾞｸﾗｽ"
  | "頭"
  | "腕"
  | "胴"
  | "足";
const nechronicaHanteiTypeList: NechronicaHanteiType[] = [
  "",
  "ﾎﾟｼﾞｼｮﾝ",
  "ﾒｲﾝｸﾗｽ",
  "ｻﾌﾞｸﾗｽ",
  "頭",
  "腕",
  "胴",
  "足"
];

type NechronicaTimingType =
  | "オート"
  | "アクション"
  | "ジャッジ"
  | "ダメージ"
  | "ラピッド";
const nechronicaTimingTypeList: NechronicaTimingType[] = [
  "オート",
  "アクション",
  "ジャッジ",
  "ダメージ",
  "ラピッド"
];

type NechronicaActionParts = {
  name: string;
  isAlive: boolean;
  value: string;
};

type NechronicaPower = {
  name: string;
  isLost: boolean;
  isUsed: boolean;
  type: NechronicaPowerType;
  hantei: NechronicaHanteiType;
  timing: NechronicaTimingType;
  cost: string;
  range: string;
  shozoku: string;
  memo: string;
};

type NechronicaCarma = {
  isCompleted: boolean;
  name: string;
  memo: string;
};

type NechronicaKakera = {
  name: string;
  memo: string;
};

type NechronicaRoiceDamage = "0" | "1" | "2" | "3" | "発狂";
const nechronicaRoiceDamageList: NechronicaRoiceDamage[] = [
  "0",
  "1",
  "2",
  "3",
  "発狂"
];

type NechronicaRoice = {
  name: string;
  pos: string;
  damage: NechronicaRoiceDamage;
  negative: string;
  break: string;
  memo: string;
};

type NechronicaSession = {
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
  mainClass: NechronicaClass;
  mainClassStatus: number[]; // arr[0]: 武装, arr[1]: 変異, arr[2]: 改造
  subClass: NechronicaClass;
  subClassStatus: number[]; // arr[0]: 武装, arr[1]: 変異, arr[2]: 改造
  statusBonus: "武装" | "変異" | "改造" | ""; // 1: 武装, 2: 変異, 3: 改造
  loveBonus: number[]; // arr[0]: 武装, arr[1]: 変異, arr[2]: 改造
  status: number[]; // arr[0]: 武装, arr[1]: 変異, arr[2]: 改造
  action: {
    total: number;
    partsList: NechronicaActionParts[];
    isAliveEyeball: boolean;
    isAliveBrain: boolean;
  };
  powerList: NechronicaPower[];
  carmaList: NechronicaCarma[];
  kakeraList: NechronicaKakera[];
  roiceList: NechronicaRoice[];
  exp: string;
  sessionList: NechronicaSession[];
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

export async function isNechronicaUrl(url: string): Promise<boolean> {
  if (!url.match(/https?:\/\/charasheet\.vampire-blood\.net\/(.+)/))
    return false;
  const json = await getJsonForTrpgSystemData<any>(
    url,
    /https?:\/\/charasheet\.vampire-blood\.net\/(.+)/,
    "https://charasheet.vampire-blood.net/{key}.js"
  );
  return json["game"] === "nechro";
}

function createNechronicaData(url: string, json: any): Nechornica {
  const nechronicaData: Nechornica = {
    url,
    characterName: json["pc_name"],
    tag: json["pc_tags"],
    positionName: json["Position_Name"],
    mainClass: json["MCLS_Name"],
    mainClassStatus: [
      parseInt(json["MC1"]),
      parseInt(json["MC2"]),
      parseInt(json["MC3"])
    ],
    subClass: json["SCLS_Name"],
    subClassStatus: [
      parseInt(json["SC1"]),
      parseInt(json["SC2"]),
      parseInt(json["SC3"])
    ],
    statusBonus: "",
    loveBonus: [
      parseInt(json["TM1"]) || 0,
      parseInt(json["TM2"]) || 0,
      parseInt(json["TM3"]) || 0
    ],
    status: [
      parseInt(json["NP1"]),
      parseInt(json["NP2"]),
      parseInt(json["NP3"])
    ],
    action: {
      total: json["Act_Total"],
      partsList: [],
      isAliveEyeball: json["medama_alive"] === "1",
      isAliveBrain: json["nou_alive"] === "1"
    },
    powerList: [],
    carmaList: [],
    kakeraList: [],
    roiceList: [],
    exp: json["exp_his_sum"],
    sessionList: [],
    shuzoku: json["shuzoku"],
    age: json["age"],
    initLocate: "煉獄",
    height: json["pc_height"],
    weight: json["pc_weight"],
    carma: json["pc_carma"],
    hairColor: json["color_hair"],
    eyeColor: json["color_eye"],
    skinColor: json["color_skin"],
    memo: json["pc_making_memo"],
    memoRows: json["pc_making_memo_rows"]
  };
  switch (json["ST_Bonus"]) {
    case "1":
      nechronicaData.statusBonus = "武装";
      break;
    case "2":
      nechronicaData.statusBonus = "変異";
      break;
    case "3":
      nechronicaData.statusBonus = "改造";
      break;
    default:
      nechronicaData.statusBonus = "";
  }
  const addActionParts = (
    nameProperty: string,
    aliveProperty: string,
    effectProperty: string
  ) => {
    const name = json[nameProperty];
    const isAlive = json[aliveProperty] === "1";
    const value = json[effectProperty];
    if (name || value) {
      nechronicaData.action.partsList.push({ name, isAlive, value });
    }
  };
  addActionParts("Act_parts_A", "Act_partsA_alive", "Act_PartsA_Ef");
  addActionParts("Act_parts_B", "Act_partsB_alive", "Act_PartsB_Ef");
  addActionParts("Act_parts_C", "Act_partsC_alive", "Act_PartsC_Ef");
  for (let i = 0; i < json["Power_Lost"].length; i++) {
    const isLost = json["Power_Lost"][i] === "1";
    const isUsed = json["Power_Used"][i] === "1";
    const type = nechronicaPowerTypeList[json["Power_Type"][i]];
    const cost = json["Power_cost"][i];
    const hantei = nechronicaHanteiTypeList[json["Power_hantei"][i]];
    const memo = json["Power_memo"][i];
    const name = json["Power_name"][i];
    const range = json["Power_range"][i];
    const shozoku = json["Power_shozoku"][i];
    const timing = nechronicaTimingTypeList[json["Power_timing"][i]];
    nechronicaData.powerList.push({
      name,
      isLost,
      isUsed,
      type,
      hantei,
      timing,
      cost,
      range,
      shozoku,
      memo
    });
  }
  for (let i = 0; i < json["carma_name"].length; i++) {
    const isCompleted = json["carma_completed"][i] === "1";
    const name = json["carma_name"][i];
    const memo = json["carma_memo"][i];
    if (name || memo) {
      nechronicaData.carmaList.push({ isCompleted, name, memo });
    }
  }
  for (let i = 0; i < json["kakera_name"].length; i++) {
    const name = json["kakera_name"][i];
    const memo = json["kakera_memo"][i];
    if (name || memo) {
      nechronicaData.kakeraList.push({ name, memo });
    }
  }
  for (let i = 0; i < json["roice_break"].length; i++) {
    const name = json["roice_name"][i];
    const pos = json["roice_pos"][i];
    const damage = nechronicaRoiceDamageList[json["roice_damage"][i]];
    const negative = json["roice_neg"][i];
    const breakValue = json["roice_break"][i];
    const memo = json["roice_memo"][i];
    if (name || pos || negative || breakValue || memo) {
      nechronicaData.roiceList.push({
        name,
        pos,
        damage,
        negative,
        break: breakValue,
        memo
      });
    }
  }
  for (let i = 0; i < json["adv_exp_his"].length; i++) {
    const advanceExp = json["adv_exp_his"][i];
    const bonusExp = json["bns_exp_his"][i];
    const sumExp = json["get_exp_his"][i];
    const memo = json["seicho_memo_his"][i];
    if (advanceExp || bonusExp || memo) {
      nechronicaData.sessionList.push({ advanceExp, bonusExp, sumExp, memo });
    }
  }
  return nechronicaData;
}

export async function createNechronicaChatPalette(
  url: string
): Promise<MemoStore[] | null> {
  const json = await getJsonForTrpgSystemData<any>(
    url,
    /https?:\/\/charasheet\.vampire-blood\.net\/(.+)/,
    "https://charasheet.vampire-blood.net/{key}.js"
  );
  if (!json) return null;
  console.log(json);

  const nechronicaData = createNechronicaData(url, json);

  console.log(JSON.stringify(nechronicaData, null, "  "));

  const resultList: MemoStore[] = [];
  const strList: string[] = [];

  // 基本情報
  strList.push("## 基本情報");
  strList.push(`PC: ${nechronicaData.characterName}`);
  strList.push(`タグ: ${nechronicaData.tag}`);

  strList.push("|||||||");
  strList.push("|--:|:--|--:|:--|--:|:--|");
  strList.push(
    `|◇種族|${nechronicaData.shuzoku}|◇享年|${nechronicaData.age}|◇初期配置|${nechronicaData.initLocate}|`
  );
  strList.push(
    `|◇身長|${nechronicaData.height}|◇体重|${nechronicaData.weight}|◇暗示|${nechronicaData.carma}|`
  );
  strList.push(
    `|◇髪の色|${nechronicaData.hairColor}|◇瞳の色|${nechronicaData.eyeColor}|◇肌の色|${nechronicaData.skinColor}|`
  );
  strList.push("");

  // 記憶のカケラ
  strList.push("## 記憶のカケラ");
  strList.push("|名前|詳細|");
  strList.push("|:--|:--|");
  nechronicaData.kakeraList.forEach(k => {
    strList.push(`|${k.name}|${k.memo}|`);
  });
  strList.push("");

  // 基本設計
  strList.push("## 基本設計");
  strList.push("||武装|変異|改造|");
  strList.push("|:--|:--:|:--:|:--:|");
  strList.push(`|ﾎﾟｼﾞｼｮﾝ：${nechronicaData.positionName}|-|-|-|`);
  strList.push(
    `|ﾒｲﾝｸﾗｽ：${nechronicaData.mainClass}|${nechronicaData.mainClassStatus.join(
      "|"
    )}|`
  );
  strList.push(
    `|ｻﾌﾞｸﾗｽ：${nechronicaData.subClass}|${nechronicaData.subClassStatus.join(
      "|"
    )}|`
  );
  strList.push(
    `|ﾎﾞｰﾅｽ|${nechronicaData.statusBonus === "武装" ? "●" : ""}|${
      nechronicaData.statusBonus === "変異" ? "●" : ""
    }|${nechronicaData.statusBonus === "改造" ? "●" : ""}|`
  );
  strList.push(`|寵愛による修正|${nechronicaData.loveBonus.join("|")}|`);
  strList.push(`|総計|${nechronicaData.status.join("|")}|`);

  resultList.push({ tab: "パーソナルデータ", text: strList.join("\r\n") });
  listToEmpty(strList);

  // 行動値
  strList.push("## 行動値");
  strList.push(
    `|パーツ名|合計|基本|のうみそ|めだま|${nechronicaData.action.partsList
      .map(p => p.name)
      .join("|")}||`
  );
  strList.push(
    `|:--:|:--:|:--:|:--:|:--:|${nechronicaData.action.partsList
      .map(() => ":--:")
      .join("|")}|:--:|`
  );
  const selectStr = `{合計}[${new Array(
    (nechronicaData.action.partsList.length + 3) * 2
  )
    .fill("")
    .map((_: string, index: number) => index + 6)
    .join("|")}](${nechronicaData.action.total})`;
  strList.push(
    `|行動値|${selectStr}|6|[${
      nechronicaData.action.isAliveBrain ? "x" : " "
    }]+2|[${
      nechronicaData.action.isAliveEyeball ? "x" : " "
    }]+1|${nechronicaData.action.partsList
      .map(p => `[${p.isAlive ? "x" : " "}]+${p.value}`)
      .join("|")}|[x]+{行動値}[0|1|2|3](0)|`
  );
  strList.push("");

  // カルマ
  strList.push("## カルマ");
  strList.push("|達成|条件|詳細|");
  strList.push("|:--:|:--|:--|");
  nechronicaData.carmaList.forEach(c => {
    strList.push(`|[${c.isCompleted ? "x" : " "}]|${c.name}|${c.memo}|`);
  });
  strList.push("");

  // 未練
  strList.push("## 未練");
  strList.push("|対象|種類|狂気度|発狂|発狂効果|備考など|");
  strList.push("|:--|:--|:--|:--|:--|:--|");
  nechronicaData.roiceList.forEach(r => {
    const selectStrList: string[] = [];
    selectStrList.push("");
    selectStrList.push("嫌悪");
    selectStrList.push("独占");
    selectStrList.push("依存");
    selectStrList.push("執着");
    selectStrList.push("恋心");
    selectStrList.push("対抗");
    selectStrList.push("友情");
    selectStrList.push("保護");
    selectStrList.push("憧憬");
    selectStrList.push("信頼");
    selectStrList.push("恐怖");
    selectStrList.push("隷属");
    selectStrList.push("不安");
    selectStrList.push("憐憫");
    selectStrList.push("愛憎");
    selectStrList.push("悔恨");
    selectStrList.push("軽蔑");
    selectStrList.push("憤怒");
    selectStrList.push("怨念");
    selectStrList.push("憎悪");
    selectStrList.push("忌避");
    selectStrList.push("嫉妬");
    selectStrList.push("感謝");
    selectStrList.push("期待");
    selectStrList.push("尊敬");
    strList.push(
      `|${r.name}|{種類}[${selectStrList.join("|")}](${
        r.pos
      })|{狂気度}[0|1|2|3|発狂](${r.damage})|${r.negative}|${r.break}|${
        r.memo
      }|`
    );
  });

  resultList.push({ tab: "管理", text: strList.join("\r\n") });
  listToEmpty(strList);

  // マニューバ
  strList.push("## マニューバ");
  strList.push(
    "|損傷|使用|カテゴリ|部位|マニューバ|タイミング|ｺｽﾄ|射程|効果|取得先|"
  );
  strList.push("|:--:|:--:|:--:|:--:|:--|:--:|--:|:--:|:--|:--|");
  nechronicaData.powerList.forEach(p => {
    const powerTextList: string[] = [];
    powerTextList.push(`|[${p.isLost ? "x" : " "}]`);
    powerTextList.push(`|[${p.isUsed ? "x" : " "}]`);
    powerTextList.push(`|${p.type}`);
    powerTextList.push(`|${p.hantei}`);
    powerTextList.push(`|${p.name}`);
    powerTextList.push(`|${p.timing}`);
    powerTextList.push(`|${p.cost}`);
    powerTextList.push(`|${p.range}`);
    powerTextList.push(`|${p.memo}`);
    powerTextList.push(`|${p.shozoku}|`);
    strList.push(powerTextList.join(""));
  });

  resultList.push({ tab: "マニューバ", text: strList.join("\r\n") });
  listToEmpty(strList);

  return resultList;
}
