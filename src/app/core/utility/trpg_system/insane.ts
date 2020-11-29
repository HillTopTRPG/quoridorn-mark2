import { getJsonForTrpgSystemData } from "@/app/core/utility/Utility";
import { MemoStore } from "@/@types/store-data";
import {
  convertNumberNull,
  convertNumberZero
} from "@/app/core/utility/PrimaryDataUtility";
import {
  createEmotion,
  createSelect,
  createTokugi,
  outputPersonalityList,
  outputTableList,
  outputTokugiTable,
  Personality,
  SaikoroFictionTokugi
} from "@/app/core/utility/trpg_system/SaikoroFiction";
import { TrpgSystemHelper } from "@/app/core/utility/trpg_system/TrpgSystemFasade";

// URL
const urlRegExp = /https?:\/\/character-sheets\.appspot\.com\/insane\/.+\?key=([^&]+)/;
const jsonpUrl =
  "https://character-sheets.appspot.com/insane/display?ajax=1&key={key}";

const gapColList: { spaceIndex: number; colText: string }[] = [
  { spaceIndex: 5, colText: "1/暴力" },
  { spaceIndex: 0, colText: "2/情動" },
  { spaceIndex: 1, colText: "3/知覚" },
  { spaceIndex: 2, colText: "4/技術" },
  { spaceIndex: 3, colText: "5/知識" },
  { spaceIndex: 4, colText: "6/怪異" }
];

const curiosityDict: { [key: string]: string } = {
  a: "暴力",
  ab: "情動",
  bc: "知覚",
  cd: "技術",
  de: "知識",
  e: "怪異"
};

const tokugiTable: string[][] = [
  ["焼却", "恋", "痛み", "分解", "物理学", "時間"],
  ["拷問", "悦び", "官能", "電子機器", "数学", "混沌"],
  ["緊縛", "憂い", "手触り", "整理", "化学", "深海"],
  ["脅す", "恥じらい", "におい", "薬品", "生物学", "死"],
  ["破壊", "笑い", "味", "効率", "医学", "霊魂"],
  ["殴打", "我慢", "物音", "メディア", "教養", "魔術"],
  ["切断", "驚き", "情景", "カメラ", "人類学", "暗黒"],
  ["刺す", "怒り", "追跡", "乗物", "歴史", "終末"],
  ["射撃", "恨み", "芸術", "機械", "民俗学", "夢"],
  ["戦争", "哀しみ", "第六感", "罠", "考古学", "地底"],
  ["埋葬", "愛", "物陰", "兵器", "天文学", "宇宙"]
];

const inSane: TrpgSystemHelper = {
  isThis: async (url: string) => !!url.match(urlRegExp),
  createOtherText: async (url: string): Promise<MemoStore[] | null> => {
    const json = await getJsonForTrpgSystemData<any>(url, urlRegExp, jsonpUrl);
    if (!json) return null;
    const data = createData(url, json);
    // console.log(JSON.stringify(json, null, "  "));
    // console.log(JSON.stringify(data, null, "  "));

    const resultList: MemoStore[] = [];

    // メモ
    addMemo(data, resultList);
    // アビリティ
    addAbility(data, resultList);
    // 基本情報
    addBasic(data, resultList);
    // 特技
    addTokugi(data, resultList);

    return resultList;
  }
};

export default inSane;

type Item = {
  count: string; // 個数
  effect: string; // 効果
  name: string; // 名前
};

type Ability = {
  effect: string; // エフェクト
  name: string; // アビリティ名
  page: string; // ページ
  targetSkill: string; // 指定特技
  type: string; // タイプ
};

type Insane = {
  url: string;
  age: string; // 年齢
  cover: string; // 職業
  curiosity: string; // 好奇心
  exp: string; // 功績点
  memo: string; // 設定
  name: string; // 名前
  nameKana: string; // カナ
  nightmare: string; // 恐怖心
  player: string; // プレイヤー
  sex: string; // 性別
  hitPoint: {
    // 生命力
    max: number | null; // 最大値
    value: number | null; // 現在値
  };
  sanePoint: {
    // 正気度
    max: number | null; // 最大値
    value: number | null; // 現在値
  };
  scenario: {
    handout: string;
    mission: string;
    name: string;
    pcno: string;
  };
  itemList: Item[]; // アイテム
  abilityList: Ability[]; // アビリティ
  tokugi: SaikoroFictionTokugi; // 特技
  personalityList: Personality[]; // 人物欄
};

function createData(url: string, json: any): Insane {
  const textFilter = (text: string | null) => {
    if (!text) return "";
    return text.trim();
  };
  const getNumber = (prop: string) => ({
    max: convertNumberZero(json[prop]["max"]),
    value: convertNumberZero(json[prop]["value"])
  });
  return {
    url,
    age: textFilter(json["base"]["age"]),
    cover: textFilter(json["base"]["cover"]),
    curiosity: curiosityDict[json["base"]["curiosity"]] || "",
    exp: textFilter(json["base"]["exp"]),
    memo: textFilter(json["base"]["memo"]),
    name: textFilter(json["base"]["name"]),
    nameKana: textFilter(json["base"]["nameKana"]),
    nightmare: textFilter(json["base"]["nightmare"]),
    player: textFilter(json["base"]["player"]),
    sex: textFilter(json["base"]["sex"]),
    hitPoint: getNumber("hitpoint"),
    sanePoint: getNumber("sanepoint"),
    scenario: {
      handout: textFilter(json["scenario"]["handout"]),
      mission: textFilter(json["scenario"]["mission"]),
      name: textFilter(json["scenario"]["name"]),
      pcno: textFilter(json["scenario"]["pcno"])
    },
    abilityList: (json["ability"] as any[]).map(a => ({
      effect: textFilter(a.effect),
      name: textFilter(a.name),
      page: textFilter(a.page),
      targetSkill: textFilter(a.targetSkill),
      type: textFilter(a.type)
    })),
    itemList: (json["item"] as any[]).map(i => ({
      count: textFilter(i.count),
      effect: textFilter(i.effect),
      name: textFilter(i.name)
    })),
    personalityList: createEmotion(json),
    tokugi: createTokugi(json, tokugiTable)
  };
}

function addMemo(data: Insane, resultList: MemoStore[]) {
  resultList.push({
    tab: "メモ",
    type: "normal",
    text: ["### メモ", ":::200px:100px", ":::END;;;"].join("\r\n")
  });
}

function addAbility(data: Insane, resultList: MemoStore[]) {
  resultList.push({
    tab: "アビリティ",
    type: "url",
    text: [
      "@@@RELOAD-CHARACTER-SHEET@@@",
      "@@@RELOAD-CHARACTER-SHEET-ALL@@@",
      "## アビリティ",
      ...outputTableList<Ability>(data.abilityList, [
        { label: "アビリティ名", prop: "name", align: "left" },
        { label: "タイプ", prop: "type", align: "left" },
        { label: "指定特技", prop: "targetSkill", align: "left" },
        { label: "エフェクト", prop: "effect", align: "left" },
        { label: "参照p", prop: "page", align: "left" }
      ])
    ].join("\r\n")
  });
}

function addBasic(data: Insane, resultList: MemoStore[]) {
  resultList.push({
    tab: "基本情報",
    type: "url",
    text: [
      "@@@RELOAD-CHARACTER-SHEET@@@",
      "@@@RELOAD-CHARACTER-SHEET-ALL@@@",
      "## 基本情報",
      `PL: ${data.player}`,
      `PC${data.scenario.pcno ? `(${data.scenario.pcno})` : ""}: ${data.name}${
        data.nameKana ? `（${data.nameKana}）` : ""
      }`,
      `${
        data.age
          ? convertNumberNull(data.age) !== null
            ? `${data.age}歳`
            : data.age
          : "年齢不詳"
      } ${data.sex || "性別なし"} ${data.cover || "職業なし"}`,
      `使命: ${data.scenario.mission}`,
      "|生命力|正気度|功績点|",
      "|:---|:---|:---:|",
      `|${createSelect(
        "生命力",
        data.hitPoint.max,
        data.hitPoint.value
      )}|${createSelect(
        "正気度",
        data.sanePoint.max,
        data.sanePoint.value
      )}|${data.exp || "なし"}|`,
      "## 人物欄",
      ...outputPersonalityList(data.personalityList, [
        { label: "キャラ", prop: "name", align: "left" },
        { label: "居", prop: "place", align: "left" },
        { label: "情", prop: "secret", align: "left" },
        { label: "感情", prop: "emotion", align: "left" }
      ]),
      "## アイテム",
      ...outputTableList<Item>(
        data.itemList,
        [
          { label: "名前", prop: "name", align: "left" },
          { label: "個数", prop: "count", align: "left" },
          { label: "効果", prop: "effect", align: "left" }
        ],
        (prop, value) => {
          if (prop.prop === "count") return createSelect("個数", 3, value);
          return null;
        }
      )
    ].join("\r\n")
  });
}

function addTokugi(data: Insane, resultList: MemoStore[]) {
  resultList.push({
    tab: "特技",
    type: "url",
    text: [
      "@@@RELOAD-CHARACTER-SHEET@@@",
      "@@@RELOAD-CHARACTER-SHEET-ALL@@@",
      "## 特技",
      ...outputTokugiTable(
        data.tokugi,
        gapColList,
        true,
        text => `${text}　　　`
      )
    ].join("\r\n")
  });
}
