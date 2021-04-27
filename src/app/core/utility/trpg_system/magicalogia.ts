import { MemoStore } from "@/@types/store-data";
import {
  convertNumberNull,
  convertNumberZero
} from "@/app/core/utility/PrimaryDataUtility";
import {
  createDiceRollStr,
  createTokugi,
  makeSelectStr,
  outputTableList,
  outputTokugiChatPalette,
  outputTokugiTable,
  readMultiLine,
  readTokugiTableInfo,
  regStr,
  SaikoroFictionTokugi,
  tabTextProcess
} from "@/app/core/utility/trpg_system/SaikoroFiction";
import { TrpgSystemHelper } from "@/app/core/utility/trpg_system/TrpgSystemHelper";
import moment from "moment";

export class MagicalogiaHelper extends TrpgSystemHelper<MagicaLogia> {
  public readonly isSupportedOtherText = true;
  public readonly isSupportedChatPalette = true;

  public constructor(url: string) {
    super(
      url,
      /https?:\/\/character-sheets\.appspot\.com\/mglg\/.+\?key=([^&]+)/,
      "https://character-sheets.appspot.com/mglg/display?ajax=1&key={key}"
    );
  }

  /**
   * このシステムに対応しているキャラシのURLかどうかを判定する
   * @return true: 対応したキャラシである, false: 対応したキャラシではない
   */
  public async isThis(): Promise<boolean> {
    return this.urlRegExp.test(this.url);
  }

  /**
   * その他欄の情報を生成する
   */
  public async createOtherText(
    memoList: Partial<StoreData<MemoStore>>[]
  ): Promise<Partial<StoreData<MemoStore>>[] | null> {
    const { data, list } = await this.createResultList<MemoStore>();
    if (!data) return null;

    readData(data, memoList);

    // メモ
    this.addMemo(list, [
      "### 変調",
      "|封印|綻び|虚弱|病魔|遮断|不運|",
      "|:---:|:---:|:---:|:---:|:---:|:---:|",
      "|[ ]|[ ]|[ ]|[ ]|[ ]|[ ]|"
    ]);

    // 蔵書
    addLibrary(data, list);
    // 基本情報
    addBasic(data, list);
    // 特技
    addTokugi(data, list);

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

    return [
      {
        name: `◆${data.coverName}`,
        paletteText: [
          "2D6",
          "2D6>=",
          ...outputTokugiChatPalette(data.tokugi),
          `2D6>=6 魂の特技「${data.soul.skill}」`,
          "ST シーン表",
          "FCT 運命変転表",
          "RTT ランダム特技表",
          "FT ファンブル表",
          "WT 変調表",
          "AT 事件表",
          "choice[〇〇,△△,□□]",
          ...data.libraryList
            .flatMap(l => [
              "",
              `【${l.name}】《${l.skill}》（${l.target}）`,
              `効果:${l.effect}`
            ])
            .map(text => text.replaceAll(/\r?\n/g, ""))
        ].join("\n")
      }
    ];
  }

  /**
   * JSONPから取得した生データから処理用のデータを生成する
   * @param json JSONPから取得した生データ
   * @protected
   */
  protected createData(json: any): MagicaLogia | null {
    if (!json) return null;
    const textFilter = (text: string | null) => {
      if (!text) return "";
      return text.trim().replace(/\r?\n/g, "\n");
    };
    return {
      url: this.url,
      age: textFilter(json["base"]["age"]),
      attack: textFilter(json["base"]["attack"]),
      belief: textFilter(json["base"]["belief"]),
      career: textFilter(json["base"]["career"]),
      cover: textFilter(json["base"]["cover"]),
      coverName: textFilter(json["base"]["covername"]),
      defense: textFilter(json["base"]["defense"]),
      domain: domainDict[json["base"]["domain"]] || "",
      exp: textFilter(json["base"]["exp"]),
      level: textFilter(json["base"]["level"]),
      levelName: textFilter(json["base"]["levelname"]),
      magicName: textFilter(json["base"]["magicname"]),
      memo: textFilter(json["base"]["memo"]),
      player: textFilter(json["base"]["player"]),
      sex: textFilter(json["base"]["sex"]),
      source: textFilter(json["base"]["source"]),
      anchorList: (json["anchor"] as any[]).map(a => ({
        attribute: textFilter(a["attribute"]),
        check: !!a["check"],
        destiny: textFilter(a["destiny"]),
        memo: textFilter(a["memo"]),
        name: textFilter(a["name"])
      })),
      dutyList: (json["duty"] as any[]).map(d => ({
        anchor: textFilter(d["anchor"]),
        notes: textFilter(d["notes"])
      })),
      libraryList: (json["library"] as any[]).map(l => ({
        charge: convertNumberZero(l["charge"]["value"]),
        check: !!l["check"],
        cost: textFilter(l["cost"]),
        effect: textFilter(l["effect"]),
        ivCheck: !!l["ivcheck"],
        name: textFilter(l["name"]),
        skill: textFilter(l["skill"]),
        target: textFilter(l["target"]),
        type: textFilter(l["type"])
      })),
      tokugi: createTokugi(
        json,
        tokugiTable,
        false,
        true,
        true,
        (tokugi: SaikoroFictionTokugi, t: string, tt: string, move: number) => {
          const ff = tokugi.damagedList.some(d => d.name === t);
          const tf = tokugi.damagedList.some(d => d.name === tt);
          return `@@@CHAT-CMD:[${move}${ff ? "+1" : ""}]2D6${
            ff ? "-1" : ""
          }>=${move} ${t}${ff ? "（不運）" : ""}→${tt}${
            tf ? "（不運）" : ""
          }@@@`;
        }
      ),
      soul: {
        skill: textFilter(json["soul"]["skill"]),
        judge: textFilter(json["soul"]["learned"]["judge"])
      },
      magic: {
        max: convertNumberZero(json["magic"]["max"]),
        value: convertNumberZero(json["magic"]["value"])
      },
      trueForm: {
        effect: textFilter(json["trueform"]["effect"]),
        name: textFilter(json["trueform"]["name"]),
        notes: textFilter(json["trueform"]["notes"])
      }
    };
  }
}

const gapColList = [
  { spaceIndex: 5, colText: "1/星" },
  { spaceIndex: 0, colText: "2/獣" },
  { spaceIndex: 1, colText: "3/力" },
  { spaceIndex: 2, colText: "4/歌" },
  { spaceIndex: 3, colText: "5/歌" },
  { spaceIndex: 4, colText: "6/闇" }
];

const domainDict: { [key: string]: string } = {
  a: "星",
  ab: "獣",
  bc: "力",
  cd: "歌",
  de: "夢",
  e: "闇"
};

const tokugiTable: string[][] = [
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
];

type Library = {
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

type Anchor = {
  attribute: string; // 属性
  check: boolean; // チェック
  destiny: string; // 運命
  memo: string; // 設定
  name: string; // アンカー名
};

type Duty = {
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
  anchorList: Anchor[]; // 関係
  dutyList: Duty[]; // 義務
  libraryList: Library[]; // 蔵書
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

function readData(
  data: MagicaLogia,
  memoList: Partial<StoreData<MemoStore>>[]
) {
  tabTextProcess("蔵書", memoList, text => {
    // 蔵書の読み込み
    readMultiLine(
      data.libraryList,
      text,
      [
        regStr.check,
        regStr.text,
        regStr.text,
        regStr.text,
        regStr.text,
        regStr.text,
        regStr.select,
        regStr.text,
        regStr.check
      ].join("\\|"),
      "name",
      2,
      {
        1: ["check", "b"],
        8: ["charge", "n"],
        10: ["ivCheck", "b"]
      }
    );
  });

  tabTextProcess("基本情報", memoList, text => {
    // アンカーの読み込み
    readMultiLine(
      data.anchorList,
      text,
      [regStr.check, regStr.text, regStr.select, regStr.text].join("\\|"),
      "name",
      2,
      { 1: ["check", "b"], 4: ["destiny", "n"] }
    );
  });

  const tokugiText = memoList.find(m => m.data!.tab === "特技")?.data!.text;
  if (tokugiText) {
    readTokugiTableInfo(
      data.tokugi,
      gapColList,
      tokugiTable,
      tokugiText,
      false,
      true,
      "\\@\\@\\@CHAT-CMD:(?:(?!\\@\\@\\@).+?)\\@\\@\\@"
    );
    const crs = "\\[([ x])]　*";
    const regStr = `${gapColList
      .map((gc, idx) => `\\|◇${!idx ? "庇" : "　"}\\|◇${gc.colText}${crs}`)
      .join("")}\\|◇\\|`;
    const matchResult = tokugiText.match(new RegExp(regStr));
    if (matchResult) {
      const damagedColList: number[] = [];
      [...Array(gapColList.length)].forEach((_, idx) => {
        if (matchResult[idx + 1] === "x") damagedColList.push(idx);
      });
      data.tokugi.damagedColList.splice(
        0,
        data.tokugi.damagedColList.length,
        ...damagedColList
      );
    }
  }
}

function addLibrary(
  data: MagicaLogia,
  resultList: Partial<StoreData<MemoStore>>[]
) {
  resultList.push({
    data: {
      tab: "蔵書",
      type: "url",
      text: [
        `@@@RELOAD-CHARACTER-SHEET-ALL@@@ ${moment().format(
          "YYYY/MM/DD HH:mm:ss"
        )}`,
        "リロードしてもチェック状態や選択状態は引き継がれます",
        "## 蔵書",
        ...outputTableList<Library>(
          data.libraryList,
          [
            { label: "", prop: "check", align: "left" },
            { label: "魔法名", prop: "name", align: "left" },
            { label: "タイプ", prop: "type", align: "center" },
            { label: "指定特技", prop: "skill", align: "left" },
            { label: "目標", prop: "target", align: "left" },
            { label: "コスト", prop: "cost", align: "left" },
            { label: "チャージ", prop: "charge", align: "center" },
            { label: "効果", prop: "effect", align: "left" },
            { label: "呪句", prop: "ivCheck", align: "center" }
          ],
          (prop, value, data1) => {
            if (prop.label === "チャージ")
              return `${makeSelectStr("チャージ", value, { s: 0, e: 6 })}`;
            if (prop.prop === "skill") {
              const diceRollStr = createDiceRollStr(
                data.tokugi,
                gapColList,
                data1.skill
              );
              return `${value}${diceRollStr}`;
            }
            return null;
          }
        )
      ].join("\r\n")
    }
  });
}

function addBasic(
  data: MagicaLogia,
  resultList: Partial<StoreData<MemoStore>>[]
) {
  resultList.push({
    data: {
      tab: "基本情報",
      type: "url",
      text: [
        `@@@RELOAD-CHARACTER-SHEET-ALL@@@ ${moment().format(
          "YYYY/MM/DD HH:mm:ss"
        )}`,
        "リロードしてもチェック状態や選択状態は引き継がれます",
        "## 基本情報",
        `PL: ${data.player}`,
        "### かりそめ",
        `${data.coverName}（${
          data.age
            ? convertNumberNull(data.age) !== null
              ? `${data.age}歳`
              : data.age
            : "年齢不詳"
        } ${data.sex || "性別なし"}）`,
        `表の顔: ${data.cover || "なし"}`,
        "### 魔法使い",
        `魔法名: ${data.magicName || "なし"}`,
        `信条: ${data.belief || "なし"}`,
        "|階梯|領域|攻撃力|防御力|根源力|経歴/機関|功績点|",
        "|:---:|:---:|:---:|:---:|:---:|:---:|:---:|",
        `|第${data.level}階梯「${data.levelName}」|${data.domain}|${
          data.attack
        }|${data.defense}|${data.source}|${data.career || "なし"}|${data.exp ||
          "なし"}|`,
        "### 真の姿",
        "|||||",
        "|:---|:---|:---|:---|",
        `|◇名称|${data.trueForm.name}|◇効果|${data.trueForm.effect}|`,
        "",
        "## アンカー",
        ...outputTableList<Anchor>(
          data.anchorList,
          [
            { label: "運命の力", prop: "check", align: "center" },
            { label: "アンカー名", prop: "name", align: "left" },
            { label: "運命", prop: "destiny", align: "center" },
            { label: "属性", prop: "attribute", align: "left" }
          ],
          (prop, value) => {
            if (prop.prop === "destiny") {
              return `${makeSelectStr("運命", value, { s: 3, e: 0 })}`;
            }
            return null;
          }
        ),
        "### 義務",
        data.dutyList
          .filter(d => d.anchor)
          .map(d => `- ${d.anchor}`)
          .join("\n") || "なし"
      ].join("\r\n")
    }
  });
}

function addTokugi(
  data: MagicaLogia,
  resultList: Partial<StoreData<MemoStore>>[]
) {
  resultList.push({
    data: {
      tab: "特技",
      type: "url",
      text: [
        `@@@RELOAD-CHARACTER-SHEET-ALL@@@ ${moment().format(
          "YYYY/MM/DD HH:mm:ss"
        )}`,
        "リロードしてもギャップや不運、庇のチェック状態は引き継がれます",
        "## 特技",
        ...outputTokugiTable(data.tokugi, gapColList),
        `|${gapColList
          .map(
            (gc, ind) =>
              `　|◇${gc.colText}${
                data.tokugi.damagedColList.some(d => d === ind) ? "[x]" : "[ ]"
              }　　`
          )
          .join("|◇")}|◇|`.replace(/^\|　/, "|◇庇"),
        "",
        "|||",
        "|:---|:---|",
        `|◇魂の特技|${data.soul.skill}@@@CHAT-CMD:[6]2D6>=6 ${data.soul.skill}（魂の特技）魔力１消費@@@|`
      ].join("\r\n")
    }
  });
}
