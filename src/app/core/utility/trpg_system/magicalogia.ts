import { getJsonForTrpgSystemData } from "@/app/core/utility/Utility";
import { MemoStore } from "@/@types/store-data";
import {
  convertNumberNull,
  convertNumberZero,
  listToEmpty
} from "@/app/core/utility/PrimaryDataUtility";
import {
  createTokugi,
  SaikoroFictionTokugi,
  TokugiInfo
} from "@/app/core/utility/trpg_system/SaikoroFiction";

export async function isMagicaLogia(url: string) {
  return !!url.match(
    /https?:\/\/character-sheets\.appspot\.com\/mglg\/.+\?key=([^&]+)/
  );
}

type MagicaLogiaDomain = "星" | "獣" | "力" | "歌" | "夢" | "闇";
const magicaLogiaDomainDict: { [key: string]: MagicaLogiaDomain } = {
  a: "星",
  ab: "獣",
  bc: "力",
  cd: "歌",
  de: "夢",
  e: "闇"
};

type MagicaLogiaLibrary = {
  charge: number; // チャージ
  check: boolean; // チェック
  cost: string; // コスト
  effect: string; // 効果
  ivCheck: boolean; // 呪句
  name: string; // 魔法名
  skill: string; // 指定特技
  target: string; // 目標
  type: string; // タイプ
};

type MagicaLogiaAnchor = {
  attribute: string; // 属性
  check: boolean; // チェック
  destiny: string; // 運命
  memo: string; // 設定
  name: string; // アンカー名
};

type MagicaLogiaDuty = {
  anchor: string; // アンカー名
  notes: string; // 内容
};

type MagicaLogia = {
  url: string;
  age: string; // 年齢
  attack: string; // 攻撃力
  belief: string; // 信条
  career: string; // 経歴／機関
  cover: string; // 表の顔
  coverName: string; // かりそめの名前
  defense: string; // 防御力
  domain: string; // 領域
  exp: string; // 功績点
  level: string; // 階梯
  levelName: string; // 階梯名
  magicName: string; // 魔法名
  memo: string; // 設定
  player: string; // プレイヤー
  sex: string; // 性別
  source: string; // 根源力
  anchorList: MagicaLogiaAnchor[]; // 関係
  dutyList: MagicaLogiaDuty[]; // 義務
  libraryList: MagicaLogiaLibrary[]; // 蔵書
  tokugi: SaikoroFictionTokugi; // 特技
  soul: {
    skill: string; // 魂の特技
    judge: string; // 魂の特技の判定
  };
  magic: {
    // 魔力
    max: number | null; // 最大値
    value: number | null; // 現在値
  };
  trueForm: {
    // 真の姿
    effect: string; // 効果
    name: string; // 名称
    notes: string; // 説明
  };
};

function createMagicaLogiaData(url: string, json: any): MagicaLogia {
  return {
    url,
    age: json["base"]["age"] || "",
    attack: json["base"]["attack"] || "",
    belief: json["base"]["belief"] || "",
    career: json["base"]["career"] || "",
    cover: json["base"]["cover"] || "",
    coverName: json["base"]["covername"] || "",
    defense: json["base"]["defense"] || "",
    domain: magicaLogiaDomainDict[json["base"]["domain"]] || "",
    exp: json["base"]["exp"] || "",
    level: json["base"]["level"] || "",
    levelName: json["base"]["levelname"] || "",
    magicName: json["base"]["magicname"] || "",
    memo: json["base"]["memo"] || "",
    player: json["base"]["player"] || "",
    sex: json["base"]["sex"] || "",
    source: json["base"]["source"] || "",
    anchorList: (json["anchor"] as any[]).map(a => ({
      attribute: a["attribute"] || "",
      check: !!a["check"],
      destiny: a["destiny"] || "",
      memo: a["memo"] || "",
      name: a["name"] || ""
    })),
    dutyList: (json["duty"] as any[]).map(d => ({
      anchor: d["anchor"] || "",
      notes: d["notes"] || ""
    })),
    libraryList: (json["library"] as any[]).map(l => ({
      charge: convertNumberZero(l["charge"]["value"]),
      check: !!l["check"],
      cost: l["cost"] || "",
      effect: l["effect"] || "",
      ivCheck: !!l["ivcheck"],
      name: l["name"] || "",
      skill: l["skill"] || "",
      target: l["target"] || "",
      type: l["type"] || ""
    })),
    tokugi: createTokugi(json, [
      ["黄金", "肉", "重力", "物語", "追憶", "深淵"],
      ["大地", "蟲", "風", "旋律", "謎", "腐敗"],
      ["森", "花", "流れ", "涙", "嘘", "裏切り"],
      ["道", "血", "水", "別れ", "不安", "迷い"],
      ["海", "鱗", "波", "微笑み", "眠り", "怠惰"],
      ["静寂", "混沌", "自由", "想い", "偶然", "歪み"],
      ["雨", "牙", "衝撃", "勝利", "幻", "不幸"],
      ["嵐", "叫び", "雷", "恋", "狂気", "バカ"],
      ["太陽", "怒り", "炎", "情熱", "祈り", "悪意"],
      ["天空", "翼", "光", "癒し", "希望", "絶望"],
      ["異界", "エロス", "円環", "時", "未来", "死"]
    ]),
    soul: {
      skill: json["soul"]["skill"],
      judge: json["soul"]["learned"]["judge"]
    },
    magic: {
      max: convertNumberZero(json["magic"]["max"]),
      value: convertNumberZero(json["magic"]["value"])
    },
    trueForm: {
      effect: json["trueform"]["effect"] || "",
      name: json["trueform"]["name"] || "",
      notes: json["trueform"]["notes"] || ""
    }
  };
}

export async function createMagicaLogiaChatPalette(
  url: string
): Promise<MemoStore[] | null> {
  const json = await getJsonForTrpgSystemData<any>(
    url,
    /https?:\/\/character-sheets\.appspot\.com\/mglg\/.+\?key=([^&]+)/,
    "https://character-sheets.appspot.com/mglg/display?ajax=1&key={key}"
  );
  if (!json) return null;
  const magicaLogiaData = createMagicaLogiaData(url, json);

  // console.log(JSON.stringify(magicaLogiaData, null, "  "));

  const resultList: MemoStore[] = [];
  const strList: string[] = [];

  // 基本情報
  strList.push("## 基本情報");
  strList.push(`PL: ${magicaLogiaData.player}`);

  strList.push(
    `かりそめ: ${magicaLogiaData.coverName}(${
      magicaLogiaData.age
    }歳 ${magicaLogiaData.sex || "性別なし"} ${magicaLogiaData.cover ||
      "表の顔なし"})`
  );
  strList.push("");
  strList.push(`魔法名: ${magicaLogiaData.magicName || "なし"}`);
  strList.push(
    `第${magicaLogiaData.level}階梯「${magicaLogiaData.levelName}」 ${magicaLogiaData.domain}の${magicaLogiaData.career}`
  );
  strList.push(`信条: ${magicaLogiaData.belief || "なし"}`);
  strList.push(`功績点: ${magicaLogiaData.exp || "なし"}`);

  strList.push("### 真の姿");
  strList.push("|||");
  strList.push("|:---|:---|");
  strList.push(`|◇名称|${magicaLogiaData.trueForm.name}|`);
  strList.push(`|◇効果|${magicaLogiaData.trueForm.effect}|`);
  strList.push(`|◇説明|${magicaLogiaData.trueForm.notes}|`);

  strList.push("### ステータス");
  strList.push("|攻撃力|防御力|根源力|魔力|");
  strList.push("|:---:|:---:|:---:|:---:|");
  const createSelect = (
    label: string,
    max: number | string | null,
    current: string | number | null
  ) => {
    const maxNum = typeof max === "number" ? max : convertNumberNull(max);
    if (maxNum === null) return current;
    return `{${label}}[${[...Array(maxNum + 1)]
      .map((_, i) => i)
      .reverse()
      .join("|")}](${current})`;
  };
  strList.push(
    `|${createSelect("攻撃力", 6, magicaLogiaData.attack)}|${createSelect(
      "防御力",
      6,
      magicaLogiaData.defense
    )}|${createSelect("根源力", 6, magicaLogiaData.source)}|${createSelect(
      "魔力",
      magicaLogiaData.magic.max,
      magicaLogiaData.magic.value
    )}`
  );

  strList.push("### 状態");
  strList.push("|封印|綻び|虚弱|病魔|遮断|不運|");
  strList.push("|:---:|:---:|:---:|:---:|:---:|:---:|");
  strList.push("|[ ]|[ ]|[ ]|[ ]|[ ]|[ ]|");

  // 人物欄
  strList.push("## 人物欄");
  strList.push("||アンカー名|運命|属性|設定|");
  strList.push("|:---:|:---|:---:|:---|:---|");
  magicaLogiaData.anchorList.forEach(a => {
    strList.push(
      `|[${a.check ? "x" : " "}]|${
        a.name
      }|{運命}[3|2|1|0](${a.destiny.toLowerCase()})|${a.attribute}|${a.memo}|`
    );
  });
  strList.push("");

  resultList.push({ tab: "基本情報", text: strList.join("\r\n") });
  listToEmpty(strList);

  // 特技
  strList.push("## 特技");
  strList.push(`魂の特技: ${magicaLogiaData.soul.skill}`);
  const gapText = (ind: number) =>
    magicaLogiaData.tokugi.spaceList.indexOf(ind) > -1 ? "◆　" : "　";
  const gapColList = [
    { spaceIndex: 5, colText: "1/星" },
    { spaceIndex: 0, colText: "2/獣" },
    { spaceIndex: 1, colText: "3/力" },
    { spaceIndex: 2, colText: "4/歌" },
    { spaceIndex: 3, colText: "5/歌" },
    { spaceIndex: 4, colText: "6/闇" }
  ];
  const learnedList = magicaLogiaData.tokugi.learnedList;
  const damagedColList = magicaLogiaData.tokugi.damagedColList;
  const damagedList = magicaLogiaData.tokugi.damagedList;
  strList.push(
    `|${gapColList
      .map(gc => `${gapText(gc.spaceIndex)}|${gc.colText}　　　　`)
      .join("|")}||`
  );
  strList.push("|:--|:--|:--|:--|:--|:--|:--|:--|:--|:--|:--|:--|:--:|");
  const checkStr = (list: TokugiInfo[], r: number, c: number) =>
    `[${list.some(lt => lt.row === r && lt.column === c) ? "x" : " "}]`;
  magicaLogiaData.tokugi.table.forEach((tList: string[], r: number) => {
    strList.push(
      tList
        .map(
          (t: string, c: number) =>
            `|${gapText(gapColList[c].spaceIndex)}|${
              learnedList.some(t => t.row === r && t.column === c) ? "◆" : ""
            }${checkStr(damagedList, r, c)}${t}`
        )
        .join("") + `|${r + 2}|`
    );
  });
  strList.push(
    `|${gapColList
      .map(
        (gc, ind) =>
          `　|${gc.colText}[${
            damagedColList.some(d => d === ind) ? "x" : " "
          }]　　　`
      )
      .join("|")}||`.replace(/^\|　/, "|庇")
  );

  resultList.push({ tab: "特技", text: strList.join("\r\n") });
  listToEmpty(strList);

  // 蔵書
  strList.push("## 蔵書");
  strList.push("||魔法名|タイプ|指定特技|目標|コスト|チャージ|効果|呪句|");
  strList.push("|:---|:---|:---:|:---|:---|:---|:---:|:---|:---:|");
  const rep = (text: string) =>
    text.replaceAll("\n", "<br>").replaceAll("。", "。<br>");
  strList.push(
    ...magicaLogiaData.libraryList.map(
      l =>
        `|[${l.check ? "X" : " "}]|${rep(l.name)}|${rep(l.type)}|${rep(
          l.skill
        )}|${rep(rep(l.target))}|${l.cost}|[0|1|2|3|4|5|6](0)|${rep(
          l.effect
        )}|[${l.ivCheck ? "X" : " "}]|`
    )
  );

  resultList.push({ tab: "蔵書", text: strList.join("\r\n") });
  listToEmpty(strList);

  return resultList;
}
