import { getJsonForTrpgSystemData } from "@/app/core/utility/Utility";
import { MemoStore } from "@/@types/store-data";
import { listToEmpty } from "@/app/core/utility/PrimaryDataUtility";
import {
  createTokugi,
  SaikoroFictionTokugi
} from "@/app/core/utility/trpg_system/SaikoroFiction";
import { TrpgSystemHelper } from "@/app/core/utility/trpg_system/TrpgSystemFasade";

// URL
const urlRegExp = /https?:\/\/character-sheets\.appspot\.com\/shinobigami\/.+\?key=([^&]+)/;
const jsonpUrl =
  "https://character-sheets.appspot.com/shinobigami/display?ajax=1&key={key}";

const shinobigami: TrpgSystemHelper = {
  isThis: async (url: string) => !!url.match(urlRegExp),
  createOtherText: async (url: string): Promise<MemoStore[] | null> => {
    const json = await getJsonForTrpgSystemData<any>(url, urlRegExp, jsonpUrl);
    if (!json) return null;
    const shinobigamiData = createShinobigamiData(url, json);
    // console.log(JSON.stringify(shinobigamiData, null, "  "));

    const resultList: MemoStore[] = [];

    // メモ
    addMemo(shinobigamiData, resultList);
    // 基本情報
    addBasic(shinobigamiData, resultList);
    // 特技
    addTokugi(shinobigamiData, resultList);
    // 忍法
    addNinpou(shinobigamiData, resultList);

    return resultList;
  }
};

export default shinobigami;

type ShinobigamiUpperStyle =
  | "斜歯忍軍"
  | "鞍馬神流"
  | "ハグレモノ"
  | "比良坂機関"
  | "私立御斎学園"
  | "隠忍の血統"
  | "";

type ShinobigamiHaikei = {
  name: string;
  type: string;
  point: string;
  effect: string;
};

type ShinobigamiNinpou = {
  secret: boolean;
  name: string;
  type: string;
  targetSkill: string;
  range: string;
  cost: string;
  effect: string;
  page: string;
};

type Shinobigami = {
  url: string;
  playerName: string;
  characterName: string;
  characterNameKana: string;
  foe: string;
  exp: string;
  memo: string;
  upperStyle: ShinobigamiUpperStyle;
  subStyle: string;
  level: string;
  age: string;
  sex: string;
  cover: string;
  belief: string;
  stylerule: string;
  ninpouList: ShinobigamiNinpou[];
  backgroundList: ShinobigamiHaikei[];
  tokugi: SaikoroFictionTokugi;
};

function createShinobigamiData(url: string, json: any): Shinobigami {
  const shinobigamiData: Shinobigami = {
    url,
    playerName: json["base"]["player"] || "",
    characterName: json["base"]["name"] || "",
    characterNameKana: json["base"]["nameKana"] || "",
    foe: json["base"]["foe"] || "",
    exp: json["base"]["exp"] || "",
    memo: json["base"]["memo"] || "",
    upperStyle: "ハグレモノ",
    subStyle: json["base"]["substyle"] || "",
    level: json["base"]["level"] || "",
    age: json["base"]["age"] || "",
    sex: json["base"]["sex"] || "",
    cover: json["base"]["cover"] || "",
    belief: json["base"]["belief"] || "",
    stylerule: json["base"]["stylerule"] || "",
    ninpouList: (json["ninpou"] as any[]).map(n => ({
      secret: !!n["secret"],
      name: n["name"] || "",
      type: n["type"] || "",
      targetSkill: n["targetSkill"] || "",
      range: n["range"] || "",
      cost: n["cost"] || "",
      effect: n["effect"] ? n["effect"].replace(/\r?\n/g, "\\n") : "",
      page: n["page"] || ""
    })),
    backgroundList: (json["background"] as any[]).map(b => ({
      name: b["name"] || "",
      type: b["type"] || "",
      point: b["point"] || "0",
      effect: b["effect"] ? b["effect"].replace(/\r?\n/g, "\\n") : ""
    })),
    tokugi: createTokugi(json, [
      ["絡繰術", "騎乗術", "生存術", "医術", "兵糧術", "異形化"],
      ["火術", "砲術", "潜伏術", "毒術", "鳥獣術", "召喚術"],
      ["水術", "手裏剣術", "遁走術", "罠術", "野戦術", "死霊術"],
      ["針術", "手練", "盗聴術", "調査術", "地の利", "結界術"],
      ["仕込み", "身体操術", "腹話術", "詐術", "意気", "封術"],
      ["衣装術", "歩法", "隠形術", "対人術", "用兵術", "言霊術"],
      ["縄術", "走法", "変装術", "遊芸", "記憶術", "幻術"],
      ["登術", "飛術", "香術", "九ノ一の術", "見敵術", "瞳術"],
      ["拷問術", "骨法術", "分身の術", "傀儡の術", "暗号術", "千里眼の術"],
      ["壊器術", "刀術", "隠蔽術", "流言の術", "伝達術", "憑依術"],
      ["掘削術", "怪力", "第六感", "経済力", "人脈", "呪術"]
    ])
  };
  switch (json["base"]["upperstyle"]) {
    case "a":
      shinobigamiData.upperStyle = "斜歯忍軍";
      break;
    case "ab":
      shinobigamiData.upperStyle = "鞍馬神流";
      break;
    case "bc":
      shinobigamiData.upperStyle = "ハグレモノ";
      break;
    case "cd":
      shinobigamiData.upperStyle = "比良坂機関";
      break;
    case "de":
      shinobigamiData.upperStyle = "私立御斎学園";
      break;
    case "e":
      shinobigamiData.upperStyle = "隠忍の血統";
      break;
    default:
      shinobigamiData.upperStyle = "";
  }
  return shinobigamiData;
}

function addMemo(shinobigamiData: Shinobigami, resultList: MemoStore[]) {
  const strList: string[] = [];

  // メモ
  strList.push("### メモ");
  strList.push(":::200px:100px");
  strList.push(":::END;;;");

  resultList.push({ tab: "メモ", type: "normal", text: strList.join("\r\n") });
}

function addBasic(shinobigamiData: Shinobigami, resultList: MemoStore[]) {
  const strList: string[] = [];

  strList.push("@@@RELOAD-CHARACTER-SHEET@@@");
  strList.push("@@@RELOAD-CHARACTER-SHEET-ALL@@@");

  // 基本情報
  strList.push("## 基本情報");
  strList.push(`PL: ${shinobigamiData.playerName}`);
  strList.push(
    `PC: ${shinobigamiData.characterName}${
      shinobigamiData.characterNameKana
        ? `（${shinobigamiData.characterNameKana}）`
        : ""
    }`
  );
  strList.push(
    `${shinobigamiData.level} ${shinobigamiData.belief} ${shinobigamiData.age} ${shinobigamiData.sex} ${shinobigamiData.cover}`
  );
  strList.push(
    `流派：${shinobigamiData.upperStyle}${
      shinobigamiData.subStyle ? `（${shinobigamiData.subStyle}）` : ""
    }`
  );
  strList.push(`流儀: ${shinobigamiData.stylerule}`);
  strList.push("");

  // 人物欄
  strList.push("## 人物欄");
  strList.push("|キャラ|居|情|奥|感情|");
  strList.push("|:---|:---|:---|:---|:---|");
  strList.push(
    "|PC1|[ ]|[ ]|[ ]|{感情}[なし|1:共感(+)|1:不信(-)|2:友情(+)|2:怒り(-)|3:愛情(+)|3:妬み(-)|4:忠誠(+)|4:侮蔑(-)|5:憧憬(+)|5:劣等感(-)|6:狂信(+)|6:殺意(-)](なし)|"
  );
  strList.push(
    "|PC2|[ ]|[ ]|[ ]|{感情}[なし|1:共感(+)|1:不信(-)|2:友情(+)|2:怒り(-)|3:愛情(+)|3:妬み(-)|4:忠誠(+)|4:侮蔑(-)|5:憧憬(+)|5:劣等感(-)|6:狂信(+)|6:殺意(-)](なし)|"
  );
  strList.push("");

  // 背景
  strList.push("## 背景");
  strList.push("|名称|種別|功績点|効果|");
  strList.push("|:---|:---|:---|:---|");
  strList.push(
    ...shinobigamiData.backgroundList.map(
      n => `|${n.name}|${n.type}|${n.point}|${n.effect}|`
    )
  );

  resultList.push({
    tab: "基本情報",
    type: "url",
    text: strList.join("\r\n")
  });
}

function addTokugi(shinobigamiData: Shinobigami, resultList: MemoStore[]) {
  const strList: string[] = [];

  strList.push("@@@RELOAD-CHARACTER-SHEET@@@");
  strList.push("@@@RELOAD-CHARACTER-SHEET-ALL@@@");

  // 特技
  strList.push("## 特技");
  const damagedColList = shinobigamiData.tokugi.damagedColList;
  const gapText = (ind: number) =>
    shinobigamiData.tokugi.spaceList.indexOf(ind) > -1 ? "¦　" : "　";
  const gapColList = [
    { spaceIndex: 5, colText: "器術" },
    { spaceIndex: 0, colText: "体術" },
    { spaceIndex: 1, colText: "忍術" },
    { spaceIndex: 2, colText: "謀術" },
    { spaceIndex: 3, colText: "戦術" },
    { spaceIndex: 4, colText: "妖術" }
  ];
  strList.push(
    `|${gapColList
      .map(
        (gc, ind) =>
          `${gapText(gc.spaceIndex)}|${gc.colText}[${
            damagedColList.some(d => d === ind) ? "x" : " "
          }]　　　`
      )
      .join("|")}||`
  );
  strList.push("|:--|:--|:--|:--|:--|:--|:--|:--|:--|:--|:--|:--|:--:|");
  const learnedList = shinobigamiData.tokugi.learnedList;
  shinobigamiData.tokugi.table.forEach((tList: string[], r: number) => {
    strList.push(
      tList
        .map(
          (t: string, c: number) =>
            `|${gapText(gapColList[c].spaceIndex)}|${
              learnedList.some(t => t.row === r && t.column === c) ? "¦" : ""
            }${t}`
        )
        .join("") + `|${r + 2}|`
    );
  });

  resultList.push({ tab: "特技", type: "url", text: strList.join("\r\n") });
}

function addNinpou(shinobigamiData: Shinobigami, resultList: MemoStore[]) {
  const strList: string[] = [];

  strList.push("@@@RELOAD-CHARACTER-SHEET@@@");
  strList.push("@@@RELOAD-CHARACTER-SHEET-ALL@@@");

  // 忍法
  strList.push("## 忍法");
  strList.push("|忍法|タイプ|指定特技|間合|コスト|効果|");
  strList.push("|:---|:---|:---|---:|---:|:---|");
  strList.push(
    ...shinobigamiData.ninpouList.map(
      n =>
        `|${n.name}|${n.type}|${n.targetSkill}|${n.range}|${n.cost}|${n.effect}|`
    )
  );

  resultList.push({ tab: "忍法", type: "url", text: strList.join("\r\n") });
}
