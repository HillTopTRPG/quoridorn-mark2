import { all, create } from "mathjs";
import { ChatInfo, CustomDiceBotInfo } from "@/@types/room";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import GameObjectManager from "@/app/basic/GameObjectManager";
import BcdiceManager from "@/app/core/api/bcdice/BcdiceManager";
import { sum } from "@/app/core/utility/PrimaryDataUtility";
import {
  findById,
  findRequireById,
  someByStr
} from "@/app/core/utility/Utility";

const config = {};
const math = create(all, config);

// 名前空間を汚さないように3つの正規表現オブジェクトを初期化
const { borderStyleRegExp, styleRegExp, lineRegExp } = (() => {
  const colorFormat = "#[0-9a-f]+|rgba? *\\([0-9., ]+\\)|[a-z]+";
  const lineStyleFormat = "solid|double|dotted|dashed|wavy";
  const colorAndLineFormat = `(${lineStyleFormat}|${colorFormat})`;
  const styleRegExpList = [
    `(b?c)(?: *{ *)(${colorFormat})(?: *})`,
    `([uo])(?: *{ *)${colorAndLineFormat}(?: *\\| *${colorAndLineFormat})?(?: *})`,
    "(b)",
    "(i)",
    "(lt)",
    "(r)(?: *{ *)([^}]+)(?: *})"
  ];
  const styleRegExpStr = `(?:: *)(?:${styleRegExpList.join("|")})`;

  const regExpStr = `\\[\\[ *style((?: *${styleRegExpStr})*) *]]`;

  const borderStyleRegExp = new RegExp(lineStyleFormat, "gi");
  const styleRegExp = new RegExp(styleRegExpStr, "gi");
  const lineRegExp = new RegExp(regExpStr, "gi");

  return {
    borderStyleRegExp,
    styleRegExp,
    lineRegExp
  };
})();

export function escapeHtml(text: string): string {
  return text
    .replace(/\[\[quot]]/g, "&quot;")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&#39;")
    .replace(/\n/g, "<br />");
}

export function transText(text: string): string {
  text = escapeHtml(text);

  const matchInfoList: any[] = [];
  let matchResult: RegExpExecArray | null;
  while ((matchResult = lineRegExp.exec(text)) !== null) {
    const styleStr = matchResult[1];
    const startIndex = matchResult.index;
    const contentsIndex = matchResult.index + matchResult[0].length;
    matchInfoList.push({
      styleStr,
      startIndex,
      contentsIndex
    });
  }

  if (!matchInfoList.length) return text;

  matchInfoList.push({ startIndex: text.length });
  const resultTexts: string[] = [];
  resultTexts.push(text.substring(0, matchInfoList[0].startIndex));

  for (let i = 0; i < matchInfoList.length - 1; i++) {
    const styleStr: string = matchInfoList[i]!.styleStr;
    const startIndex: number = matchInfoList[i]!.contentsIndex;
    const endIndex: number = matchInfoList[i + 1]!.startIndex;
    const contentsStr = text.substring(startIndex, endIndex);

    const style: string[] = [];
    const textDecoration: string[] = [];
    let rubyText: string = "";
    let matchResult = null;
    while ((matchResult = styleRegExp.exec(styleStr)) !== null) {
      if (matchResult[1] === "c") style.push(`color: ${matchResult[2]}`);
      if (matchResult[1] === "bc")
        style.push(`background-color: ${matchResult[2]}`);
      if (matchResult[3] === "u" || matchResult[3] === "o") {
        const lineObj: any = {
          type: matchResult[3] === "u" ? "underline" : "overline",
          style: "",
          color: ""
        };
        const setFunc: Function = (str: string): void => {
          if (str) {
            if (borderStyleRegExp.test(str)) lineObj.style = ` ${str}`;
            else lineObj.color = ` ${str}`;
          }
        };
        setFunc(matchResult[4]);
        setFunc(matchResult[5]);

        textDecoration.push(`${lineObj.type}${lineObj.style}${lineObj.color}`);
      }
      if (matchResult[6] === "b") style.push("font-weight: bold");
      if (matchResult[7] === "i") style.push("font-style: italic");
      if (matchResult[8] === "lt") textDecoration.push("line-through");
      if (matchResult[9] === "r") rubyText = matchResult[10];
    }
    if (textDecoration.length) {
      style.push(`text-decoration: ${textDecoration.join(" ")}`);
    }

    const styleText: string = style.join(";");
    const styleAttrStr: string = styleText ? ` style="${styleText};"` : "";
    let contentsText: string = contentsStr;
    if (rubyText) {
      contentsText = `<ruby><rb${styleAttrStr}>${contentsText}</rb><rp>（</rp><rt${styleAttrStr}>${rubyText}</rt><rp>）</rp></ruby>`;
    } else {
      if (styleText) {
        contentsText = `<span${styleAttrStr}>${contentsText}</span>`;
      }
    }
    resultTexts.push(contentsText);
  }
  return resultTexts.join("");
}

type SendChatInfo = {
  actorId: string | null;
  text: string;
  tabId: string | null;
  statusId: string | null;
  targetId: string | null;
  system: string | null;
  isSecret: boolean;
};

async function addChatLog(chatInfo: ChatInfo) {
  window.console.log(JSON.stringify(chatInfo, null, "  "));
  await SocketFacade.instance.chatListCC().addDirect(
    [chatInfo],
    [
      {
        permission: {
          view: { type: "none", list: [] },
          edit: { type: "allow", list: [{ type: "owner" }] },
          chmod: { type: "none", list: [] }
        }
      }
    ]
  );
}

export async function sendChatLog(
  payload: SendChatInfo,
  subCustomDiceBotList: CustomDiceBotInfo[]
) {
  const actorList = GameObjectManager.instance.actorList;
  const actorStatusList = GameObjectManager.instance.actorStatusList;
  const groupChatTabList = GameObjectManager.instance.groupChatTabList;

  const actorId =
    payload.actorId || GameObjectManager.instance.chatPublicInfo.actorId;
  const targetId =
    payload.targetId || groupChatTabList.find(gct => gct.data!.isSystem)!.id!;

  const actorStatus = findRequireById(
    actorStatusList,
    findRequireById(actorList, actorId).data!.statusId
  );
  const groupChatTabInfo = findById(groupChatTabList, targetId);

  const chatInfo: ChatInfo = {
    actorId,
    text: payload.text,
    diceRollResult: null,
    customDiceBotResult: null,
    isSecret: payload.isSecret,
    isSecretDice: false,
    dices: [],
    targetId,
    targetType: groupChatTabInfo ? "group" : "actor",
    tabId:
      payload.tabId ||
      (groupChatTabInfo && groupChatTabInfo.data!.outputChatTabId
        ? groupChatTabInfo.data!.outputChatTabId
        : GameObjectManager.instance.chatPublicInfo.tabId),
    statusId: payload.statusId || actorStatus.id!,
    system: payload.system || GameObjectManager.instance.chatPublicInfo.system
  };

  const outputNormalChat = async (command: string) => {
    if (!/[@><+-/*=0-9a-zA-Z()"?^$]+/.test(command)) {
      // とりあえずコマンドじゃなさそう
      await addChatLog(chatInfo);
      return;
    }
    const resultJson = await BcdiceManager.sendBcdiceServer({
      system: chatInfo.system,
      command
    });

    if (resultJson.ok) {
      // bcdiceとして結果が取れた
      chatInfo.diceRollResult = resultJson.result!;
      chatInfo.isSecretDice = resultJson.secret!;
      chatInfo.dices = resultJson.dices!;
    } else {
      // bcdiceとして結果は取れなかった
    }

    // TODO ダイス結果を画面から非表示にする

    await addChatLog(chatInfo);

    if (chatInfo.isSecretDice) {
      // TODO シークレットダイスの画面表示処理
    }
  };

  // -------------------
  // 独自ダイスBot処理
  // -------------------
  const commandStr = chatInfo.text
    // 空白で分割した1行目
    .split(new RegExp("\\s+"))[0]
    // 全角を半角へ
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s: string) =>
      String.fromCharCode(s.charCodeAt(0) - 65248)
    )
    .toLowerCase();
  const customDiceBotObj = BcdiceManager.instance.customDiceBotList.find(
    cdb => cdb.commandName.toLowerCase() === commandStr
  );
  const customDiceBotRoomSysObj = subCustomDiceBotList.find(
    cdb => cdb.commandName.toLowerCase() === commandStr
  );
  const useCustomDiceBotObj = customDiceBotObj || customDiceBotRoomSysObj;
  if (!useCustomDiceBotObj) {
    // 独自ダイスボットが見つからなかったので通常のチャット処理
    await outputNormalChat(commandStr);
  } else {
    // 独自ダイスボットが見つかった
    const diceRoll = useCustomDiceBotObj.diceRoll;
    const tableTitle = useCustomDiceBotObj.tableTitle;
    const diceBotSystem = useCustomDiceBotObj.system;
    const tableContents = useCustomDiceBotObj.tableContents;

    const resultJson = await BcdiceManager.sendBcdiceServer({
      system: diceBotSystem,
      command: diceRoll
    });

    if (resultJson.ok) {
      // bcdiceとして結果が取れた
      chatInfo.diceRollResult = resultJson.result!;
      chatInfo.isSecretDice = resultJson.secret!;
      chatInfo.dices = resultJson.dices!;

      const diceRollResult = resultJson.result!.replace(/^.*→ */, "");
      const pips = chatInfo.dices.map(d => d.value);
      const diceResultStr = `(${sum(pips)}[${pips.join(",")}])`;

      const customDiceBotResult = tableContents[diceRollResult];

      chatInfo.customDiceBotResult = [
        tableTitle,
        diceResultStr,
        " → ",
        customDiceBotResult || "該当値なし"
      ].join("");

      // TODO メッセージに結果表示
      const viewMessage =
        customDiceBotResult || `該当値なし\n${diceRollResult}`;

      await addChatLog(chatInfo);
    } else {
      // bcdiceとして結果は取れなかった
    }
  }
}

export function conversion(
  num: number,
  unitName: string
): { value: number; name: string; unit: string }[] | null {
  const convertTable: { name: string[]; base: string }[] = [
    {
      name: ["mm", "mm", "millimeter", "㍉", "㍉㍍", "ミリメートル"],
      base: "Length"
    },
    {
      name: ["cm", "cm", "centimeter", "㌢", "㌢㍍", "センチメートル"],
      base: "Length"
    },
    { name: ["m", "m", "meter", "㍍", "メートル"], base: "Length" },
    { name: ["km", "km", "kilometer", "㌔㍍", "キロメートル"], base: "Length" },
    { name: ["in", "in", "inch", "㌅", "インチ"], base: "Length" },
    { name: ["ft", "ft", "foot", "㌳", "フィート"], base: "Length" },
    { name: ["yd", "yd", "yard", "㍎", "ヤード"], base: "Length" },
    { name: ["mi", "mi", "mile", "マイル"], base: "Length" },
    { name: ["li", "li", "link", "リンク"], base: "Length" },
    { name: ["rd", "rd", "rod", "ロッド"], base: "Length" },
    { name: ["ch", "ch", "chain", "チェーン"], base: "Length" },
    { name: ["angstrom", "Å", "オングストローム"], base: "Length" },
    { name: ["mil", "mil", "ミル"], base: "Length" },
    // { name: ["寸"], base: "Length" },
    // { name: ["尺"], base: "Length" },
    // { name: ["里"], base: "Length" },
    {
      name: ["mm2", "mm²", "㎟", "平方㍉㍍", "平方ミリメートル"],
      base: "Surface area"
    },
    {
      name: ["cm2", "cm²", "㎠", "平方㌢㍍", "平方メートル"],
      base: "Surface area"
    },
    {
      name: ["m2", "m²", "㎡", "平方㍍", "平方メートル"],
      base: "Surface area"
    },
    {
      name: ["km2", "km²", "㎢", "平方㌔㍍", "平方キロメートル"],
      base: "Surface area"
    },
    {
      name: ["sqin", "in²", "sq in", "平方㌅", "平方インチ"],
      base: "Surface area"
    },
    {
      name: ["sqft", "ft²", "sq ft", "平方㌳", "平方フィート"],
      base: "Surface area"
    },
    {
      name: ["sqyd", "yd²", "sq yd", "平方㍎", "平方ヤード"],
      base: "Surface area"
    },
    { name: ["sqmi", "mi²", "sq mi", "平方マイル"], base: "Surface area" },
    { name: ["sqrd", "rd²", "sq rd", "平方ロッド"], base: "Surface area" },
    { name: ["sqch", "ch²", "sq ch", "平方チェイン"], base: "Surface area" },
    { name: ["sqmil", "mil²", "sq mil", "平方ミル"], base: "Surface area" },
    { name: ["acre", "ac", "エーカー"], base: "Surface area" },
    { name: ["hectare", "ha", "㌶", "ヘクタール"], base: "Surface area" },
    // { name: ["a", "アール"], base: "Surface area" },
    // { name: ["坪", "歩"], base: "Surface area" },
    // { name: ["畝"], base: "Surface area" },
    // { name: ["反"], base: "Surface area" },
    // { name: ["町"], base: "Surface area" },
    { name: ["mm3", "mm³", "平方㍉㍍", "立方ミリメートル"], base: "Volume" },
    {
      name: ["cm3", "cm³", "平方㌢㍍", "平方㌢", "立方センチメートル"],
      base: "Volume"
    },
    { name: ["m3", "m³", "㎥", "平方㍍", "立方メートル"], base: "Volume" },
    {
      name: ["km3", "km³", "平方㌖", "平方㌔㍍", "立方キロメートル"],
      base: "Volume"
    },
    {
      name: ["l", "L", "ℓ", "lt", "liter", "litre", "㍑", "リットル"],
      base: "Volume"
    },
    { name: ["cc", "cc", "㏄", "シーシー"], base: "Volume" },
    { name: ["cuin", "in³", "cu in", "平方㌅", "立方インチ"], base: "Volume" },
    {
      name: ["cuft", "ft³", "cu ft", "平方㌳", "立方フィート"],
      base: "Volume"
    },
    { name: ["cuyd", "yd³", "cu yd", "平方㍎", "立方ヤード"], base: "Volume" },
    { name: ["teaspoon", "tsp", "小さじ"], base: "Volume" },
    { name: ["tablespoon", "tbsp", "大さじ"], base: "Volume" },
    { name: ["minim", "min", "ミニム"], base: "Volume" },
    {
      name: ["fldr", "fldr", "fluiddram", "fl dr", "液量ドラム"],
      base: "Volume"
    },
    {
      name: ["floz", "floz", "fluidounce", "fl oz", "液量オンス"],
      base: "Volume"
    },
    { name: ["gi", "gi", "gill", "ジル"], base: "Volume" },
    { name: ["cp", "cp", "cup", "カップ"], base: "Volume" },
    { name: ["pt", "pt", "pint", "パイント"], base: "Volume" },
    { name: ["qt", "qt", "quart", "クォート"], base: "Volume" },
    { name: ["gal", "gal", "gallon", "ガロン"], base: "Volume" },
    {
      name: ["bbl", "bbl", "beerbarrel", "バレル", "米液量バレル"],
      base: "Volume"
    },
    { name: ["obl", "obl", "oilbarrel", "石油用バレル"], base: "Volume" },
    { name: ["hogshead", "hogshead", "ホッグスヘッド"], base: "Volume" },
    { name: ["gtt", "gtt", "drop", "ドロップ"], base: "Volume" },
    // { name: ["pk", "peck", "ペック"], base: "Volume" },
    // { name: ["升"], base: "Volume" },
    // { name: ["合"], base: "Volume" },
    // { name: ["斗"], base: "Volume" },
    // { name: ["石"], base: "Volume" },
    { name: ["mg", "mg", "milligram", "㍉㌘", "ミリグラム"], base: "Mass" },
    { name: ["g", "g", "gram", "㌘", "グラム"], base: "Mass" },
    {
      name: ["kg", "kg", "kilogram", "㌔㌘", "㌕", "キログラム"],
      base: "Mass"
    },
    { name: ["ton", "t", "tonne", "㌧", "トン"], base: "Mass" },
    { name: ["gr", "gr", "grain", "グレーン"], base: "Mass" },
    { name: ["dr", "dr", "dram", "ドラム"], base: "Mass" },
    { name: ["oz", "oz", "ounce", "オンス"], base: "Mass" },
    { name: ["lb", "lb", "lbm", "lbs", "poundmass", "ポンド"], base: "Mass" },
    {
      name: ["cwt", "cwt", "hundredweight", "ハンドレッドウェイト"],
      base: "Mass"
    }
  ];

  const getUnit: Function = (
    unitName: string
  ): { name: string[]; base: string } | null =>
    convertTable.find(unit => someByStr(unit.name, unitName)) || null;
  const filteredUnit = getUnit(unitName);
  if (!filteredUnit) return null;

  const base = filteredUnit.base;
  const name = filteredUnit.name[0];

  // window.console.log(num, unitName, base, name);

  return (
    convertTable
      .filter(unit => unit.base === base && unit.name[0] !== name)
      .map(targetUnit => targetUnit.name[0])
      .map((unit: string) => `${num}${name} to ${unit}`)
      // .map((unit: string) => {
      //   window.console.log(unit);
      //   return unit;
      // })
      .map((unit: string) => math.eval(unit).format())
      .map((result: string) => {
        // window.console.log(result);
        const mr: any = result.match(/([^ ]+) (.+)/);
        const floatValue: number = parseFloat(mr[1]);
        const unitStr: string = mr[2];
        const unit = getUnit(unitStr);
        return {
          value: floatValue,
          name: unit.name[unit.name.length - 1],
          unit: unit.name[1]
        };
      })
  );
}
