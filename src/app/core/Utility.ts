import { all, create } from "mathjs";
import {
  ChatInfo,
  CustomDiceBotInfo,
  StandImageInfo,
  Texture
} from "@/@types/room";
import LanguageManager from "@/LanguageManager";
import { ApplicationError } from "@/app/core/error/ApplicationError";
import urljoin from "url-join";
import GameObjectManager from "@/app/basic/GameObjectManager";
import BcdiceManager from "@/app/core/api/bcdice/BcdiceManager";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import { StoreUseData } from "@/@types/store";

const config = {};
const math = create(all, config);

export function listToEmpty(list: Array<unknown>) {
  list.splice(0, list.length);
}

export function getSrc(path: string): string {
  if (path.startsWith("http")) return path;
  if (path.startsWith("data:")) return path;
  if (path.startsWith(".")) path = path.replace(/^\./, "");
  const protocol = window.location.protocol;
  const host = window.location.host;
  const baseUrl = process.env.BASE_URL;
  return urljoin(protocol, host, baseUrl, path);
}

/**
 * URLパラメータ取得処理
 *
 * @param name
 * @param url
 */
export function getUrlParam(
  name: string,
  url: string = window.location.href
): string | null {
  name = name.replace(/[[\]]/g, "\\$&");
  const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
  let results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/(\+)|(¥%20)/g, " "));
}

/**
 * 極彩ログ処理
 *
 * @param a
 */
export function qLog(...a: any): void {
  // window.console.log(...arguments)

  let format = "";
  const logs = [];

  format += "%c%s";
  logs.push("color:blue; font-weight: bold;");
  logs.push("[System]");

  const args: any[] = [];
  let str = "";
  Array.prototype.slice.call(arguments).forEach(arg => {
    if (toString.call(arg) === "[object String]") {
      str += ` ${arg}`;
    } else {
      args.push(str.trim());
      str = "";
      args.push(arg);
    }
  });
  if (str !== "") {
    args.push(str.trim());
  }

  args.forEach((arg: any) => {
    const indent = "        ";
    const toString = Object.prototype.toString;
    if (toString.call(arg) === "[object String]") {
      const m1 = arg.match(/^(\[[^\]]+])(.+)$/);
      if (m1) {
        format += `%c${format.endsWith("\n") ? indent : ""}${m1[1]}`;
        logs.push("color:blue; font-weight: bold;");
        arg = m1[2];
      }
      const m2 = arg.match(/^ *(.+) +=> *(.*)$/);
      if (m2) {
        format += `%c${m2[1]}`;
        logs.push(
          "color:magenta; font-size: 120%; margin-left: 0.5em; font-weight: bold; border-radius: 3px; border: 1px solid magenta; padding: 1px 4px;"
        );
        format += `%c=>`;
        logs.push("margin: 0 0.5em;");
        arg = m2[2];
      }
      let m3;
      while (
        arg &&
        (m3 = arg.match(
          /^( *[^:]* +)?(([^ ]+) *: *((\([^)]+\))|([^ ,]*)))([ ,]+.+)?$/
        ))
      ) {
        // (\([^)]+\))|
        // window.console.log(arg)
        // window.console.log(m3)
        if (m3[1]) {
          format += `%c${format.endsWith("\n") ? indent : ""}${m3[1]}`;
          logs.push("");
        }
        format += `%c${format.endsWith("\n") ? indent : ""}${m3[3]}:`;
        logs.push(
          "color:white; background-color: green; font-weight: bold; padding: 1px 4px; border-radius: 0px; border: 1px solid green; border-right: none;"
        );
        format += `%c${m3[4] || m3[5] || ""}`;
        logs.push(
          "color:green; background-color: white; font-weight: bold; padding: 1px 4px; border-radius: 0px; border: 1px solid green; border-left: none;"
        );
        arg = m3[7];
      }
      if (arg) {
        format += `%c${format.endsWith("\n") ? indent : ""}${arg}`;
        logs.push("");
      }
    } else if (toString.call(arg) === "[object Array]") {
      format += "%c%s";
      logs.push("color: blue;");
      logs.push(`[ ${arg.join(", ")} ]`);
    } else if (toString.call(arg) === "[object Undefined]") {
      format += "%s";
      logs.push(arg);
    } else {
      const jsonStr = JSON.stringify(arg, undefined, 2)
        .split("\n")
        .map(line => `${indent}${line}`)
        .join("\n");

      // Objectを整形して出力するかそのまま出力するか
      if (jsonStr.length > 0) {
        format += "%O";
        logs.push(arg);
      } else {
        format += "%c\n%s\n";
        logs.push("color: blue;");
        logs.push(jsonStr);
      }
    }
  });
  window.console.log(format, ...logs);
}

export function saveJson(name: string, data: any): void {
  const blob = new Blob([JSON.stringify(data, null, "  ")], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.download = `${name}.json`;
  anchor.href = url;
  anchor.click();
}

export function saveHTML(name: string, text: string): void {
  const blob = new Blob([text], {
    type: "text/html"
  });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.download = `${name}.html`;
  anchor.href = url;
  anchor.click();
}

export function saveText(name: string, text: string): void {
  const blob = new Blob([text], {
    type: "text/plain"
  });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.download = `${name}.txt`;
  anchor.href = url;
  anchor.click();
}

const colorMap: { [name: string]: string } = {
  white: "#ffffff",
  whitesmoke: "#f5f5f5",
  ghostwhite: "#f8f8ff",
  aliceblue: "#f0f8ff",
  lavender: "#e6e6fa",
  azure: "#f0ffff",
  lightcyan: "#e0ffff",
  mintcream: "#f5fffa",
  honeydew: "#f0fff0",
  ivory: "#fffff0",
  beige: "#f5f5dc",
  lightyellow: "#ffffe0",
  lightgoldenrodyellow: "#fafad2",
  lemonchiffon: "#fffacd",
  floralwhite: "#fffaf0",
  oldlace: "#fdf5e6",
  cornsilk: "#fff8dc",
  papayawhite: "#ffefd5",
  blanchedalmond: "#ffebcd",
  bisque: "#ffe4c4",
  snow: "#fffafa",
  linen: "#faf0e6",
  antiquewhite: "#faebd7",
  seashell: "#fff5ee",
  lavenderblush: "#fff0f5",
  mistyrose: "#ffe4e1",
  gainsboro: "#dcdcdc",
  lightgray: "#d3d3d3",
  lightsteelblue: "#b0c4de",
  lightblue: "#add8e6",
  lightskyblue: "#87cefa",
  powderblue: "#b0e0e6",
  paleturquoise: "#afeeee",
  skyblue: "#87ceeb",
  mediumaquamarine: "#66cdaa",
  aquamarine: "#7fffd4",
  palegreen: "#98fb98",
  lightgreen: "#90ee90",
  khaki: "#f0e68c",
  palegoldenrod: "#eee8aa",
  moccasin: "#ffe4b5",
  navajowhite: "#ffdead",
  peachpuff: "#ffdab9",
  wheat: "#f5deb3",
  pink: "#ffc0cb",
  lightpink: "#ffb6c1",
  thistle: "#d8bfd8",
  plum: "#dda0dd",
  silver: "#c0c0c0",
  darkgray: "#a9a9a9",
  lightslategray: "#778899",
  slategray: "#708090",
  slateblue: "#6a5acd",
  steelblue: "#4682b4",
  mediumslateblue: "#7b68ee",
  royalblue: "#4169e1",
  blue: "#0000ff",
  dodgerblue: "#1e90ff",
  cornflowerblue: "#6495ed",
  deepskyblue: "#00bfff",
  cyan: "#00ffff",
  aqua: "#00ffff",
  turquoise: "#40e0d0",
  mediumturquoise: "#48d1cc",
  darkturquoise: "#00ced1",
  lightseagreen: "#20b2aa",
  mediumspringgreen: "#00fa9a",
  springgreen: "#00ff7f",
  lime: "#00ff00",
  limegreen: "#32cd32",
  yellowgreen: "#9acd32",
  lawngreen: "#7cfc00",
  chartreuse: "#7fff00",
  greenyellow: "#adff2f",
  yellow: "#ffff00",
  gold: "#ffd700",
  orange: "#ffa500",
  darkorange: "#ff8c00",
  goldenrod: "#daa520",
  burlywood: "#deb887",
  tan: "#d2b48c",
  sandybrown: "#f4a460",
  darksalmon: "#e9967a",
  lightcoral: "#f08080",
  salmon: "#fa8072",
  lightsalmon: "#ffa07a",
  coral: "#ff7f50",
  tomato: "#ff6347",
  orangered: "#ff4500",
  red: "#ff0000",
  deeppink: "#ff1493",
  hotpink: "#ff69b4",
  palevioletred: "#db7093",
  violet: "#ee82ee",
  orchid: "#da70d6",
  magenta: "#ff00ff",
  fuchsia: "#ff00ff",
  mediumorchid: "#ba55d3",
  darkorchid: "#9932cc",
  darkviolet: "#9400d3",
  blueviolet: "#8a2be2",
  mediumpurple: "#9370db",
  gray: "#808080",
  mediumblue: "#0000cd",
  darkcyan: "#008b8b",
  cadetblue: "#5f9ea0",
  darkseagreen: "#8fbc8f",
  mediumseagreen: "#3cb371",
  teal: "#008080",
  forestgreen: "#228b22",
  seagreen: "#2e8b57",
  darkkhaki: "#bdb76b",
  peru: "#cd853f",
  crimson: "#dc143c",
  indianred: "#cd5c5c",
  rosybrown: "#bc8f8f",
  mediumvioletred: "#c71585",
  dimgray: "#696969",
  black: "#000000",
  midnightblue: "#191970",
  darkslateblue: "#483d8b",
  darkblue: "#00008b",
  navy: "#000080",
  darkslategray: "#2f4f4f",
  green: "#008000",
  darkgreen: "#006400",
  darkolivegreen: "#556b2f",
  olivedrab: "#6b8e23",
  olive: "#808000",
  darkgoldenrod: "#b8860b",
  chocolate: "#d2691e",
  sienna: "#a0522d",
  saddlebrown: "#8b4513",
  firebrick: "#b22222",
  brown: "#a52a2a",
  maroon: "#800000",
  darkred: "#8b0000",
  darkmagenta: "#8b008b",
  purple: "#800080",
  indigo: "#4b0082"
};
export function parseColor(colorText: string) {
  let _c: any = null;
  colorText = colorText.trim().toLowerCase();
  if (colorMap[colorText]) colorText = colorMap[colorText];
  const colorCodeRegExp = new RegExp(
    "^#(([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})|([0-9a-f])([0-9a-f])([0-9a-f]))$"
  );
  const rgbRegExp = new RegExp(
    "^rgb *\\( *([0-9]+) *, *([0-9]+) *, *([0-9]+) *\\)$"
  );
  const rgbaRegExp = new RegExp(
    "^rgba *\\( *([0-9]+) *, *([0-9]+) *, *([0-9]+) *, *(1|0|0\\.[0-9]+) *\\)$"
  );
  const rgbaResult = colorText.match(rgbaRegExp);
  const rgbResult = colorText.match(rgbRegExp);
  const colorCodeResult = colorText.match(colorCodeRegExp);
  if (rgbaResult) {
    _c = {
      r: parseInt(rgbaResult[1].trim(), 10),
      g: parseInt(rgbaResult[2].trim(), 10),
      b: parseInt(rgbaResult[3].trim(), 10),
      a: parseFloat(rgbaResult[4])
    };
  } else if (rgbResult) {
    _c = {
      r: parseInt(rgbResult[1].trim(), 10),
      g: parseInt(rgbResult[2].trim(), 10),
      b: parseInt(rgbResult[3].trim(), 10),
      a: 1
    };
  } else if (colorCodeResult) {
    if (colorCodeResult[1].length === 6) {
      _c = {
        r: parseInt(colorCodeResult[2], 16),
        g: parseInt(colorCodeResult[3], 16),
        b: parseInt(colorCodeResult[4], 16),
        a: 1
      };
    } else {
      _c = {
        r: parseInt(Array(3).join(colorCodeResult[5]), 16),
        g: parseInt(Array(3).join(colorCodeResult[6]), 16),
        b: parseInt(Array(3).join(colorCodeResult[7]), 16),
        a: 1
      };
    }
  } else {
    throw new ApplicationError(`Illegal color-text. text: ${colorText}`);
  }
  _c.getColorCode = () =>
    `#${zeroPadding(_c.r.toString(16), 2)}${zeroPadding(
      _c.g.toString(16),
      2
    )}${zeroPadding(_c.b.toString(16), 2)}`;
  _c.getColorCodeReverse = () =>
    `#${zeroPadding((255 - _c.r).toString(16), 2)}${zeroPadding(
      (255 - _c.g).toString(16),
      2
    )}${zeroPadding((255 - _c.b).toString(16), 2)}`;
  _c.getRGB = () => `rgb(${_c.r}, ${_c.g}, ${_c.b})`;
  _c.getRGBA = () => `rgba(${_c.r}, ${_c.g}, ${_c.b}, ${_c.a})`;
  _c.getRGBReverse = () => `rgb(${255 - _c.r}, ${255 - _c.g}, ${255 - _c.b})`;
  return _c;
}

export function zeroPadding(num: number | string, length: number): string {
  return ("0".repeat(length) + num).slice(-length);
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
  ): { name: string[]; base: string } => {
    return convertTable.filter(
      unit => unit.name.filter((name: string) => name === unitName)[0]
    )[0];
  };
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

/**
 * 文字列をクリップボードにコピーする
 *
 * @param text
 */
export function execCopy(text: string): boolean {
  const temp = document.createElement("div");

  temp.appendChild(document.createElement("pre")).textContent = text;

  const s = temp.style;
  s.position = "fixed";
  s.left = "-100%";

  document.body.appendChild(temp);
  document.getSelection()!.selectAllChildren(temp);

  const result = document.execCommand("copy");

  document.body.removeChild(temp);
  // true なら実行できている falseなら失敗か対応していないか

  if (result) {
    const message = LanguageManager.instance.getText(
      "message.copy-to-clipboard"
    );
    alert(`${message}\n${text}`);
  }

  return result;
}

/**
 * 拡張子を除去する
 *
 * @param fileName
 */
export function removeExt(fileName: string): string {
  const matchExt: string[] | null = fileName.match(/(.*)(?:\.([^.]+$))/);
  return matchExt ? matchExt[1] : fileName;
}

/**
 * ファイル名から情報を取得する
 *
 * @param fileName
 */
export function getFileNameArgList(fileName: string): StandImageInfo | null {
  const matchExt: string[] | null = fileName.match(/(.*)(?:\.([^.]+$))/);

  const useFileName: string = matchExt ? matchExt[1] : fileName;
  const index: number = useFileName.indexOf("__");

  if (index < 0) return null;

  const argStr: string = useFileName.substring(index + 2).trim();

  const argList: (string | number)[] = argStr
    ? argStr.split("_").map(str => {
        const num: number = parseInt(str, 10);
        return isNaN(num) ? str : num;
      })
    : [];

  const numberIndexList: number[] = [];
  const stringIndexList: number[] = [];
  argList.forEach((arg, index) => {
    if (typeof arg === "string") stringIndexList.push(index);
    else numberIndexList.push(index);
  });

  const baseInfo: StandImageInfo = {
    type: "pile",
    x: 0,
    y: 0,
    viewStart: 0,
    viewEnd: 100,
    status: ""
  };
  if (stringIndexList.length > 0) {
    const str = argList[stringIndexList[0]] as string;
    if (str === "pile" || str === "replace") {
      baseInfo.type = str;
    } else {
      baseInfo.status = str;
    }
  }
  if (stringIndexList.length > 1) {
    const str = argList[stringIndexList[1]] as string;
    if (str === "pile" || str === "replace") {
      baseInfo.type = str;
    } else {
      baseInfo.status = str;
    }
  }
  if (numberIndexList.length >= 2) {
    baseInfo.x = argList[numberIndexList[0]] as number;
    baseInfo.y = argList[numberIndexList[1]] as number;
  }
  if (numberIndexList.length >= 4) {
    baseInfo.viewStart = argList[numberIndexList[2]] as number;
    baseInfo.viewEnd = argList[numberIndexList[3]] as number;
    if (baseInfo.viewStart < 0 || 100 < baseInfo.viewStart)
      baseInfo.viewStart = 0;
    if (baseInfo.viewEnd < 0 || 100 < baseInfo.viewEnd) baseInfo.viewEnd = 100;
  }

  return baseInfo;
}

export function toInitiativeObjList(
  format: string
): {
  property: string;
  min: number | string | null;
  max: number | string | null;
  type: string;
}[] {
  const absoluteTrans = (list: any[], index: number): boolean => {
    // 全角文字を半角に変換
    if (/^(ー?[０-９]+|？)$/.test(list[index])) {
      window.console.log(list[index]);
      list[index] = list[index].replace(/[ー０-９？]/g, (s: string) => {
        if (s === "ー") return "-";
        return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
      });
      window.console.log(list[index]);
    }
    if (list[index] === "?") return true;
    if (/^-?[0-9]+$/.test(list[index])) {
      list[index] = parseInt(list[index], 10);
      return true;
    }
    return false;
  };
  const check = (list: any[], index: number): number => {
    if (/^(-?[0-9]+|\?)$/.test(list[index])) return 1;
    if (/^(ー?[０-９]+|？)$/.test(list[index])) return 2;
    return 0;
  };
  const resultList: any = [];

  let colorPickIndex: number = 0;
  const colorList: string[] = [
    "#D40044",
    "#99CF30",
    "#0D2189",
    "#FF7F15",
    "#008679",
    "#56017B",
    "#FE411A",
    "#33A244",
    "#271383",
    "#FFE62F",
    "#035D86",
    "#AF0063"
  ];

  /* eslint no-irregular-whitespace: ["error", {"skipRegExps": true}] */
  if (format === "") return resultList;
  format.split(/[ 　]+/).forEach(str => {
    const fs: any[] = str.split(/[<＜]/);

    const obj: any = {
      type: "number",
      property: str,
      fromProperty: null,
      refStr: str,
      min: null,
      max: null,
      color: "#000000"
    };

    // 想定外の多さ
    if (fs.length > 3) {
      resultList.push(obj);
      return;
    }

    // min＜item＜max
    if (fs.length === 3) {
      if (!absoluteTrans(fs, 0)) {
        resultList.push(obj);
        return;
      }
      if (!absoluteTrans(fs, 2)) {
        resultList.push(obj);
        return;
      }
      if (fs[0] === "?") {
        resultList.push({
          type: "min",
          property: fs[1] + "の最小値",
          fromProperty: fs[1],
          refStr: fs[1] + "-min",
          min: null,
          max: null
        });
      } else {
        obj.min = fs[0];
      }

      obj.property = fs[1];
      obj.refStr = fs[1];

      if (fs[2] !== "?") {
        obj.max = fs[2];
      }
      resultList.push(obj);
      if (fs[2] === "?") {
        resultList.push({
          type: "max",
          property: fs[1] + "の最大値",
          fromProperty: fs[1],
          refStr: fs[1] + "-max",
          min: null,
          max: null
        });
      }
    }

    // min<item or item<max
    if (fs.length === 2) {
      const check0 = check(fs, 0);
      const check1 = check(fs, 1);
      if ((check0 === 0 && check1 === 0) || (check0 > 0 && check1 > 0)) {
        resultList.push(obj);
        return;
      }
      if (check0 === 2) absoluteTrans(fs, 0);
      if (check1 === 2) absoluteTrans(fs, 1);
      if (check0 > 0) {
        if (fs[0] === "?") {
          resultList.push({
            type: "min",
            property: fs[1] + "の最小値",
            fromProperty: fs[1],
            refStr: fs[1] + "-min",
            min: null,
            max: null
          });
        } else {
          obj.min = fs[0];
        }

        obj.property = fs[1];
        obj.refStr = fs[1];

        resultList.push(obj);
      }
      if (check1 > 0) {
        obj.property = fs[0];
        obj.refStr = fs[0];

        if (fs[1] !== "?") obj.max = fs[1];
        resultList.push(obj);
        if (fs[1] === "?") {
          resultList.push({
            type: "max",
            property: fs[0] + "の最大値",
            fromProperty: fs[0],
            refStr: fs[0] + "-max",
            min: null,
            max: null
          });
        }
      }
    }

    // item
    if (fs.length === 1) {
      const checkMatchResult = fs[0].match(/^[*＊](.+)$/);
      if (checkMatchResult) {
        obj.type = "checkbox";

        obj.property = checkMatchResult[1];
        obj.refStr = checkMatchResult[1];

        // TODO 色の設定
        const color: string = colorList[colorPickIndex++];
        if (colorPickIndex >= colorList.length) colorPickIndex = 0;
        obj.color = color;
      }
      resultList.push(obj);
    }
  });
  return resultList;
}

/**
 * 合計値を算出する
 *
 * @param list
 */
export function sum(list: number[]): number {
  return list.reduce((accumlator, current) => accumlator + current);
}

/**
 * イニシアティブ表の各列の幅を再計算する
 *
 * @param widthList
 * @param formatObjList
 */
export function arrangeInitiativeWidthList(
  widthList: number[],
  formatObjList: any[]
): number[] {
  const contentWidth = sum(widthList);
  const orderWidth = 20;
  const baseWidth = 30;
  const newWidthList = [
    orderWidth,
    baseWidth,
    baseWidth,
    baseWidth,
    ...formatObjList.map(() => baseWidth),
    0
  ];
  const textColumnWidth =
    contentWidth +
    (widthList.length - 1) -
    (newWidthList.length - 1) -
    sum(newWidthList);
  newWidthList[newWidthList.length - 1] = textColumnWidth;
  if (textColumnWidth < baseWidth) {
    newWidthList[newWidthList.length - 1] = baseWidth;
    const diffSum = baseWidth - textColumnWidth;
    const diff = Math.ceil(diffSum / newWidthList.length);
    const useDiffSum = diffSum - diff * newWidthList.length;
    newWidthList.forEach((val, index) => (newWidthList[index] -= diff));
    newWidthList[newWidthList.length - 1] -= useDiffSum;
  }
  return newWidthList;
}

/**
 * リストから特定の要素を削除する
 *
 * @param list
 * @param filterFunc
 */
export function listDelete(
  list: any[],
  filterFunc: (item: any, index: number) => {}
) {
  const deleteList: any[] = list.filter(filterFunc);
  const deleteIndexList: number[] = deleteList.map(deleteItem =>
    list.indexOf(deleteItem)
  );
  deleteIndexList.sort((n1: number, n2: number) => {
    if (n1 > n2) return -1;
    if (n1 < n2) return 1;
    return 0;
  });
  deleteIndexList.forEach(deleteIndex => list.splice(deleteIndex, 1));
}

export function fileToBase64(imageFiles: File[]): PromiseLike<any> {
  const promiseList: PromiseLike<any>[] = imageFiles.map(file =>
    createBase64DataSet(file, { w: 96, h: 96 })
  );
  return Promise.all(promiseList);
}

function createBase64DataSet(
  imageFile: any,
  { w, h }: { w: number; h: number }
): any {
  // 画像の読み込み処理
  const normalLoad = new Promise<String>(
    (resolve: Function, reject: Function) => {
      try {
        const reader: any = new FileReader();
        reader.onload = () => {
          // サムネイル画像でない場合はプレーンな画像データからBase64データを取得する
          resolve(reader.result);
        };
        reader.readAsDataURL(imageFile);
      } catch (error) {
        reject(error);
      }
    }
  );
  // サムネイル画像の読み込み処理
  const thumbnailLoad = new Promise<String>(
    (resolve: Function, reject: Function) => {
      // 画像の読み込み処理
      try {
        const reader: any = new FileReader();
        reader.onload = function(event: any) {
          // サムネイル画像作成の場合は小さくて決まったサイズの画像データに加工する（アニメGIFも最初の１コマの静止画になる）

          const image = new Image();
          image.onload = function() {
            const useSize = {
              w: image.width,
              h: image.height
            };

            // 大きい場合は、比率を保ったまま縮小する
            if (useSize.w > w || useSize.h > h) {
              const scale = Math.min(w / useSize.w, h / useSize.h);
              useSize.w = useSize.w * scale;
              useSize.h = useSize.h * scale;
            }

            // 画像を描画してデータを取り出す（Base64変換の実装）
            const canvas: HTMLCanvasElement = document.createElement(
              "canvas"
            ) as HTMLCanvasElement;
            const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;
            canvas.width = w;
            canvas.height = h;
            const locate = {
              x: (canvas.width - useSize.w) / 2,
              y: (canvas.height - useSize.h) / 2
            };
            ctx.drawImage(image, locate.x, locate.y, useSize.w, useSize.h);

            // 非同期で返却
            resolve(canvas.toDataURL());
          };
          image.src = event.target.result;
        };
        reader.readAsDataURL(imageFile);
      } catch (error) {
        reject(error);
      }
    }
  );
  return Promise.all<String>([normalLoad, thumbnailLoad]).then(
    (values: String[]) => ({
      name: imageFile.name,
      imageArgList: getFileNameArgList(imageFile.name),
      image: values[0],
      thumbnail: values[1]
    })
  );
}

export function convertNumber(str: string | null): number | null {
  if (str === null) return null;
  return str.match(/^[0-9]+$/) ? parseInt(str, 10) : null;
}

export function clone<T>(obj: T | null): T | null {
  if (!obj) return obj;
  return JSON.parse(JSON.stringify(obj)) as T;
}

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

export function transText(text: string) {
  text = text
    .replace(/\[\[quot]]/g, "&quot;")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&#39;")
    .replace(/\n/g, "<br />");

  const matchInfoList: any[] = [];
  let matchResult = null;
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
  actorId: string;
  text: string;
  tabId: string | null;
  statusId: string | null;
  targetId: string | null;
  system: string | null;
  isSecret: boolean;
};

export async function addChatLog(chatInfo: ChatInfo) {
  window.console.log(JSON.stringify(chatInfo, null, "  "));
  await SocketFacade.instance.chatListCC().addDirect([chatInfo], {
    permission: {
      view: {
        type: "none",
        list: []
      },
      edit: {
        type: "allow",
        list: [
          {
            type: "owner"
          }
        ]
      },
      chmod: {
        type: "none",
        list: []
      }
    }
  });
}

export async function sendChatLog(
  payload: SendChatInfo,
  subCustomDiceBotList: CustomDiceBotInfo[]
) {
  const actorId =
    payload.actorId || GameObjectManager.instance.chatPublicInfo.actorId;
  const targetId =
    payload.targetId ||
    GameObjectManager.instance.groupChatTabList.filter(
      gct => gct.data!.isSystem
    )[0].id!;

  const actorInfo = GameObjectManager.instance.actorList.filter(
    actor => actor.id === actorId
  )[0];
  const actorStatus = GameObjectManager.instance.actorStatusList.filter(
    as => as.id === actorInfo.data!.statusId
  )[0];
  const groupChatTabInfo = GameObjectManager.instance.groupChatTabList.filter(
    gct => gct.id === targetId
  )[0];

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
      groupChatTabInfo && groupChatTabInfo.data!.outputChatTabId
        ? groupChatTabInfo.data!.outputChatTabId
        : payload.tabId || GameObjectManager.instance.chatPublicInfo.tabId,
    statusId: payload.statusId || actorStatus!.id!,
    system: payload.system || GameObjectManager.instance.chatPublicInfo.system
  };

  const outputNormalChat = async (command: string) => {
    if (!/[@><+-/*=0-9a-zA-Z()"?^$]+/.test(command)) {
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
  const customDiceBotObj = BcdiceManager.instance.customDiceBotList.filter(
    cdb => cdb.commandName.toLowerCase() === commandStr
  )[0];
  const customDiceBotRoomSysObj = subCustomDiceBotList.filter(
    cdb => cdb.commandName.toLowerCase() === commandStr
  )[0];
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

    let diceRollResult: string | null = null;
    let dices: any[] | null = null;
    let diceResultStr: string | null = null;
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

export function getTextureStyle(texture: Texture) {
  const style = {
    transform: "",
    backgroundColor: "transparent",
    backgroundImage: "none"
  };
  if (texture.type === "color") {
    style.backgroundColor = texture.backgroundColor;
  } else {
    const imageData = GameObjectManager.instance.imageList.filter(
      i => i.id === texture.imageId
    )[0];
    if (imageData && imageData.data) {
      style.backgroundImage = `url("${getSrc(imageData.data.data)}")`;
    }
    if (texture.direction === "horizontal") style.transform = "scale(-1, 1)";
    if (texture.direction === "vertical") style.transform = "scale(1, -1)";
    if (texture.direction === "180") style.transform = "rotate(180deg)";
  }
  return style;
}

export function createEmptyStoreUseData<T>(
  id: string | null,
  data: T
): StoreUseData<T> {
  return {
    id,
    order: -1,
    exclusionOwner: null,
    lastExclusionOwner: null,
    owner: null,
    data,
    permission: null,
    status: "added",
    createTime: new Date(),
    updateTime: null
  };
}
