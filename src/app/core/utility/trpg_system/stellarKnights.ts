import { getJsonForTrpgSystemData } from "@/app/core/utility/Utility";
import { MemoStore } from "@/@types/store-data";
import { convertNumberNull } from "@/app/core/utility/PrimaryDataUtility";
import {
  createSelect,
  outputTableList
} from "@/app/core/utility/trpg_system/SaikoroFiction";
import { TrpgSystemHelper } from "@/app/core/utility/trpg_system/TrpgSystemFasade";

// URL
const urlRegExp = /https?:\/\/character-sheets\.appspot\.com\/stellar\/.+\?key=([^&]+)/;
const jsonpUrl =
  "https://character-sheets.appspot.com/stellar/display?ajax=1&key={key}";

const stellarKnights: TrpgSystemHelper = {
  isThis: async (url: string) => urlRegExp.test(url),
  createOtherText: async (url: string): Promise<MemoStore[] | null> => {
    const json = await getJsonForTrpgSystemData<any>(url, urlRegExp, jsonpUrl);
    if (!json) return null;
    const data = createData(url, json);
    console.log(JSON.stringify(json, null, "  "));
    console.log(JSON.stringify(data, null, "  "));

    const resultList: MemoStore[] = [];

    // メモ
    addMemo(data, resultList);
    // スキル
    addSkills(data, resultList);
    // 基本情報
    addBasic(data, resultList);

    const sheathUrl = json["partner"]["sheath"]["url"];
    if (sheathUrl && urlRegExp.test(sheathUrl)) {
      const sheathJson = await getJsonForTrpgSystemData<any>(
        sheathUrl,
        urlRegExp,
        jsonpUrl
      );
      if (sheathJson) {
        const sheathData = createData(sheathUrl, sheathJson);
        // シース
        addSheath(sheathData, resultList, data);
      }
    }

    return resultList;
  }
};

export default stellarKnights;

type Skill = {
  effect: string; // エフェクト
  hidden: boolean;
  name: string; // アビリティ名
  timing: string;
  type: string; // タイプ
};

type BasicInfo = {
  age: string; // 年齢
  character: {
    // 性格
    "1st": string;
    "2nd": string;
  };
  hopeDespair: {
    // 希望／絶望
    choice: string;
    detail: string;
  };
  keyword: string; // 変身キーワード
  name: string; // 名前
  organization: string; // 所属組織
  personalFlower: {
    // 花章
    color: string; // 色
    essence: string; // 花
  };
  phrase: string; // 口グセ、セリフ 自己紹介
  player: string; // プレイヤー
  sex: string; // 性別
  wish: string; // 願い
  yourStory: string; // あなたの物語
};

type StellarKnights = BasicInfo & {
  url: string;
  knightType: string; // 種類
  sheath: BasicInfo; // シース
  skillList: Skill[]; // スキル
  status: {
    charge: string; // チャージダイス数
    defense: string; // 防御力
    hp: string; // 耐久力
    medal: string; // 勲章
    resonance: string; // 歪みの共鳴
  };
};

function createData(url: string, json: any): StellarKnights {
  const textFilter = (text: string | null) => {
    if (!text) return "";
    return text.trim();
  };
  const getBasicInfo = (prop: string): BasicInfo => {
    return {
      age: textFilter(json[prop]["age"]),
      character: {
        "1st": textFilter(json[prop]["character"]["1st"]),
        "2nd": textFilter(json[prop]["character"]["2nd"])
      },
      hopeDespair: {
        choice: textFilter(json[prop]["hopedespair"]["choice"]),
        detail: textFilter(json[prop]["hopedespair"]["detail"])
      },
      keyword: textFilter(json[prop]["keyword"]),
      name: textFilter(json[prop]["name"]),
      organization: textFilter(json[prop]["organization"]),
      personalFlower: {
        color: textFilter(json[prop]["personalflower"]["color"]),
        essence: textFilter(json[prop]["personalflower"]["essence"])
      },
      phrase: textFilter(json[prop]["phrase"]),
      player: textFilter(json[prop]["player"]),
      sex: textFilter(json[prop]["sex"]),
      wish: textFilter(json[prop]["wish"]),
      yourStory: textFilter(json[prop]["yourstory"])
    };
  };
  return {
    url,
    ...getBasicInfo("base"),
    knightType: textFilter(json["base"]["knight"]["type"]),
    sheath: getBasicInfo("sheath"),
    skillList: (json["skills"] as any[]).map(s => ({
      effect: textFilter(s.effect),
      hidden: s.hidden !== null,
      name: textFilter(s.name),
      timing: textFilter(s.timing),
      type: textFilter(s.type)
    })),
    status: {
      charge: textFilter(json["status"]["charge"]),
      defense: textFilter(json["status"]["defense"]),
      hp: textFilter(json["status"]["hp"]),
      medal: textFilter(json["status"]["medal"]),
      resonance: textFilter(json["status"]["resonance"])
    }
  };
}

function addMemo(data: StellarKnights, resultList: MemoStore[]) {
  resultList.push({
    tab: "メモ",
    type: "normal",
    text: ["### メモ", ":::200px:100px", ":::END;;;"].join("\r\n")
  });
}

function addSkills(data: StellarKnights, resultList: MemoStore[]) {
  resultList.push({
    tab: "スキル",
    type: "url",
    text: [
      "@@@RELOAD-CHARACTER-SHEET@@@",
      "@@@RELOAD-CHARACTER-SHEET-ALL@@@",
      "## スキル",
      ...outputTableList<Skill>(
        data.skillList,
        [
          { label: "No.", prop: null, align: "left" },
          { label: "名前", prop: "name", align: "left" },
          { label: "種別", prop: "type", align: "left" },
          { label: "タイミング", prop: "timing", align: "left" },
          { label: "チャージ", prop: null, align: "center" },
          { label: "効果", prop: "effect", align: "left" }
        ],
        (prop, value, data, ind) => {
          if (prop.label === "No.") return `No.${ind + 1}`;
          if (prop.prop === "name") {
            return value!
              .toString()
              .replaceAll(/(.+)([（(].+[）)])/g, (m, p1, p2) => `${p1}\n${p2}`);
          }
          if (prop.label === "チャージ") {
            return "{チャージ}[0|1|2|3|4|5|6|7|8|9](0)";
          }
          return null;
        }
      )
    ].join("\r\n")
  });
}

function addBasic(data: StellarKnights, resultList: MemoStore[]) {
  resultList.push({
    tab: "基本情報",
    type: "url",
    text: [
      "@@@RELOAD-CHARACTER-SHEET@@@",
      "@@@RELOAD-CHARACTER-SHEET-ALL@@@",
      "## 基本情報",
      "|耐久力|防御力|ﾁｬｰｼﾞﾀﾞｲｽ数|",
      "|:---:|:---:|:---:|",
      `|${createSelect(
        "耐久力",
        data.status.hp,
        data.status.hp
      )}|${createSelect("防御力", 6, data.status.defense)}|${createSelect(
        "ﾁｬｰｼﾞﾀﾞｲｽ数",
        6,
        data.status.charge
      )}|`,
      "",
      `|||`,
      `|:--|:--|`,
      `|◇プレイヤー名|${data.player}|`,
      `|◇ブリンガー|${data.name}　${data.sex || "性別なし"}　${
        data.age
          ? convertNumberNull(data.age) !== null
            ? `${data.age}歳`
            : data.age
          : "年齢不詳"
      }|`,
      `|◇所属組織|${data.organization}|`,
      `|◇あなたの物語|${data.yourStory}|`,
      `|◇希望／絶望|${data.hopeDespair.choice}「${data.hopeDespair.detail}」|`,
      `|◇願い|${data.wish}|`,
      `|◇性格|${data.character["1st"]}にして${data.character["2nd"]}|`,
      `|◇花章|${data.personalFlower.color}色の${data.personalFlower.essence}|`,
      `|◇変身キーワード|${data.keyword}|`,
      `|◇歪みの共鳴|${data.status.resonance}|`,
      `|◇勲章|${data.status.medal}|`
    ].join("\r\n")
  });
}

function addSheath(
  sheathData: StellarKnights,
  resultList: MemoStore[],
  data: StellarKnights
) {
  const choice = data.sheath.hopeDespair.choice === "希望" ? "絶望" : "希望";
  resultList.push({
    tab: "シース",
    type: "url",
    text: [
      "@@@RELOAD-CHARACTER-SHEET@@@",
      "@@@RELOAD-CHARACTER-SHEET-ALL@@@",
      "## シース",
      `|||`,
      `|:--|:--|`,
      `|◇ブリンガー|${sheathData.sheath.name}　${sheathData.sheath.sex ||
        "性別なし"}　${
        sheathData.sheath.age
          ? convertNumberNull(sheathData.sheath.age) !== null
            ? `${sheathData.sheath.age}歳`
            : sheathData.sheath.age
          : "年齢不詳"
      }|`,
      `|◇所属組織|${sheathData.sheath.organization}|`,
      `|◇あなたの物語|${sheathData.sheath.yourStory}|`,
      `|◇希望／絶望|${choice}「${sheathData.sheath.hopeDespair.detail}」|`,
      `|◇願い|${sheathData.sheath.wish}|`,
      `|◇性格|${sheathData.sheath.character["1st"]}にして${sheathData.sheath.character["2nd"]}|`,
      `|◇花章|${sheathData.sheath.personalFlower.color}色の${sheathData.sheath.personalFlower.essence}|`,
      `|◇変身キーワード|${sheathData.sheath.keyword}|`,
      ``,
      ":::350px:200px",
      sheathData.sheath.phrase,
      ":::END;;;"
    ].join("\r\n")
  });
}
