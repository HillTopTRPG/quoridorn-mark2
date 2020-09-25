import { getJsonForTrpgSystemData } from "@/app/core/utility/Utility";
import { MemoStore } from "@/@types/gameObject";
import { listToEmpty } from "@/app/core/utility/PrimaryDataUtility";

export async function isShinobigamiUrl(url: string) {
  return !!url.match(
    /https?:\/\/character-sheets\.appspot\.com\/shinobigami\/.+\?key=([^&]+)/
  );
}

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

type ShinobigamiLearnedTokugi = {
  name: string;
  row: number;
  column: number;
};

type ShinobigamiTokugi = {
  table: string[][];
  tokugiList: ShinobigamiLearnedTokugi[];
  spaceList: number[];
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
  tokugi: ShinobigamiTokugi;
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
    ninpouList: [],
    backgroundList: [],
    tokugi: {
      table: [
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
      ],
      tokugiList: [],
      spaceList: []
    }
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
  shinobigamiData.backgroundList = (json["background"] as any[]).map(b => ({
    name: b["name"] || "",
    type: b["type"] || "",
    point: b["point"] || "0",
    effect: b["effect"] ? b["effect"].replace(/\r?\n/g, "\\n") : ""
  }));
  shinobigamiData.ninpouList = (json["ninpou"] as any[]).map(n => ({
    secret: !!n["secret"],
    name: n["name"] || "",
    type: n["type"] || "",
    targetSkill: n["targetSkill"] || "",
    range: n["range"] || "",
    cost: n["cost"] || "",
    effect: n["effect"] ? n["effect"].replace(/\r?\n/g, "\\n") : "",
    page: n["page"] || ""
  }));
  (json["learned"] as any[]).forEach(learnedJson => {
    // const hiddenSkill = learnedJson["hiddenSkill"];
    const id = learnedJson["id"];
    // const judge = learnedJson["judge"];

    if (!id) return;

    const row = parseInt(id.match(/row([0-9]+)/)[1]);
    const column = parseInt(id.match(/name([0-9]+)/)[1]);
    const name = shinobigamiData.tokugi.table[row][column];

    shinobigamiData.tokugi.tokugiList.push({
      column,
      row,
      name
    });
  });

  for (let i = 0; i < 6; i++) {
    if (json["skills"][String.fromCharCode("a".charCodeAt(0) + i)]) {
      shinobigamiData.tokugi.spaceList.push(i);
    }
  }
  return shinobigamiData;
}

export async function createShinobigamiChatPalette(
  url: string
): Promise<MemoStore[] | null> {
  const json = await getJsonForTrpgSystemData<any>(
    url,
    /https?:\/\/character-sheets\.appspot\.com\/shinobigami\/.+\?key=([^&]+)/,
    "https://character-sheets.appspot.com/shinobigami/display?ajax=1&key={key}"
  );
  if (!json) return null;
  const shinobigamiData = createShinobigamiData(url, json);

  console.log(JSON.stringify(shinobigamiData, null, "  "));

  const resultList: MemoStore[] = [];
  const strList: string[] = [];

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

  resultList.push({ tab: "基本情報", text: strList.join("\r\n") });
  listToEmpty(strList);

  // 特技
  strList.push("## 特技");
  strList.push(
    `|[${
      shinobigamiData.tokugi.spaceList.indexOf(5) > -1 ? "x" : " "
    }]|器術　　　　|[${
      shinobigamiData.tokugi.spaceList.indexOf(0) > -1 ? "x" : " "
    }]|体術　　　　|[${
      shinobigamiData.tokugi.spaceList.indexOf(1) > -1 ? "x" : " "
    }]|忍術　　　　|[${
      shinobigamiData.tokugi.spaceList.indexOf(2) > -1 ? "x" : " "
    }]|謀術　　　　|[${
      shinobigamiData.tokugi.spaceList.indexOf(3) > -1 ? "x" : " "
    }]|戦術　　　　|[${
      shinobigamiData.tokugi.spaceList.indexOf(4) > -1 ? "x" : " "
    }]|妖術　　　　||`
  );
  strList.push("|:--|:--|:--|:--|:--|:--|:--|:--|:--|:--|:--|:--|:--:|");
  shinobigamiData.tokugi.table.forEach((tList: string[], rIndex: number) => {
    strList.push(
      tList
        .map(
          (t: string, cIndex: number) =>
            `||[${
              shinobigamiData.tokugi.tokugiList.some(
                lt => lt.row === rIndex && lt.column === cIndex
              )
                ? "x"
                : " "
            }]${t}`
        )
        .join("") + `|${rIndex + 2}|`
    );
  });

  resultList.push({ tab: "特技", text: strList.join("\r\n") });
  listToEmpty(strList);

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

  resultList.push({ tab: "忍法", text: strList.join("\r\n") });
  listToEmpty(strList);

  return resultList;
}
