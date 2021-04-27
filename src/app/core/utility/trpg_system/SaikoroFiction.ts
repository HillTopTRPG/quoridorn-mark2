import {
  convertNumberNull,
  convertNumberZero,
  hoseiStr
} from "@/app/core/utility/PrimaryDataUtility";
import { MemoStore } from "@/@types/store-data";

export type TokugiInfo = {
  name: string;
  row: number;
  column: number;
};

export type SaikoroFictionTokugi = {
  table: string[][];
  learnedList: TokugiInfo[];
  damagedList: TokugiInfo[];
  damagedColList: number[];
  spaceList: number[];
  outRow: boolean;
  isUseColDamage: boolean;
  isUseSingleDamage: boolean;
  isOutputSingleDamage: boolean;
  createDiceRollText: (
    tokugi: SaikoroFictionTokugi,
    t: string,
    tt: string,
    move: number,
    r: number,
    c: number
  ) => string;
};

export type Personality = {
  emotion: string; // 感情
  name: string; // 人物名
  place: boolean; // 居所
  secret: boolean; // 秘密
  specialEffect: boolean; // 奥義
};

const emotionList: string[][] = [
  ["なし", "なし"],
  ["1+:共感", "1-:不信"],
  ["2+:友情", "2-:怒り"],
  ["3+:愛情", "3-:妬み"],
  ["4+:忠誠", "4-:侮蔑"],
  ["5+:憧憬", "5-:劣等感"],
  ["6+:狂信", "6-:殺意"]
];

export function createEmotion(json: any): Personality[] {
  return (json["personalities"] as any[]).map(p => ({
    emotion:
      emotionList[convertNumberZero(p.emotion)][
        convertNumberZero(p.direction) - 1
      ],
    name: p.name || "",
    place: p.place !== null,
    secret: p.secret !== null,
    specialEffect: p.specialEffect !== null
  }));
}

function outputTable<T>(
  data: T,
  props: {
    label: string;
    prop: keyof T | null;
  }[],
  ind: number,
  convertFunc?: (
    prop: { label: string; prop: keyof T | null },
    value: T[keyof T] | null,
    data: T,
    ind: number
  ) => string | null
): string {
  return `|${props
    .map(p => {
      const v = p.prop ? data[p.prop] : null;
      if (convertFunc) {
        const convertResult = convertFunc(p, v, data, ind);
        if (convertResult !== null) return nlFormat(convertResult);
      }
      if (typeof v === "boolean") return `${v ? "[x]" : "[ ]"}`;
      return nlFormat(v);
    })
    .join("|")}|`;
}

export function outputTableList<T>(
  dataList: T[],
  props: {
    label: string;
    prop: keyof T | null;
    align: "left" | "center" | "right";
  }[],
  convertFunc?: (
    prop: { label: string; prop: keyof T | null },
    value: T[keyof T] | null,
    data: T,
    ind: number
  ) => string | null
): string[] {
  const strList: string[] = [];
  strList.push(`|${props.map(p => p.label).join("|")}|`);
  strList.push(
    `|${props
      .map(
        p =>
          `${p.align === "right" ? "" : ":"}---${p.align === "left" ? "" : ":"}`
      )
      .join("|")}|`
  );
  strList.push(
    ...dataList.map((d, ind) =>
      outputTable<T>(
        d,
        props.map(p => ({ label: p.label, prop: p.prop })),
        ind,
        convertFunc
      )
    )
  );
  return strList;
}

export function readPersonalityList(
  data: { personalityList: Personality[] },
  text: string,
  props: {
    prop: keyof Personality;
    label: string;
  }[]
) {
  const copyProp: { [k: number]: [keyof Personality, "b" | "n" | "s"] } = [];
  const regStrList: string[] = [];
  let keyIndex: number = -1;
  let idx = 1;
  props.forEach(p => {
    switch (p.prop) {
      case "name":
        keyIndex = idx++;
        regStrList.push(regStr.text);
        break;
      case "place": // non-break
      case "secret": // non-break
      case "specialEffect":
        copyProp[idx++] = [p.prop, "b"];
        regStrList.push(regStr.check);
        break;
      case "emotion":
        copyProp[idx++] = [p.prop, "s"];
        regStrList.push(regStr.makeSelect(p.label));
        break;
      default:
    }
  });
  readMultiLine(
    data.personalityList,
    text,
    regStrList.join("\\|"),
    "name",
    keyIndex,
    copyProp
  );

  // const nameRegStr = "(.*?)";
  // const checkRegStr = "\\[([ x])]";
  // const emotionRegStr = `{感情}\\[${emotionList
  //   .flatMap((rl, idx) =>
  //     idx ? rl.map(r => r.replace(/([+-])/, s => `\\${s}`)) : [rl[0]]
  //   )
  //   .join("\\|")}]\\((.*?)\\)`;
  // const regStr = `\\|${props
  //   .map(p => {
  //     if (p.prop === "name") return nameRegStr;
  //     if (p.prop === "emotion") return emotionRegStr;
  //     return checkRegStr;
  //   })
  //   .join("\\|")}`;
  // const personalityList: Personality[] = Array.from(
  //   text.matchAll(new RegExp(regStr, "g"))
  // ).map(r => {
  //   const result = {
  //     name: "",
  //     place: false,
  //     secret: false,
  //     specialEffect: false,
  //     emotion: ""
  //   };
  //   props.forEach((p, idx) => {
  //     if (p.prop === "name" || p.prop === "emotion")
  //       result[p.prop] = r[idx + 1];
  //     else result[p.prop] = r[idx + 1] === "x";
  //   });
  //   return result;
  // });
  // mergeList(data.personalityList, personalityList, "name", [
  //   "place",
  //   "secret",
  //   "specialEffect",
  //   "emotion"
  // ]);
}

export function outputPersonalityList(
  personalityList: Personality[],
  props: {
    prop: keyof Personality;
    label: string;
    align: "left" | "center" | "right";
  }[]
): string[] {
  return outputTableList(personalityList, props, (prop, value) => {
    if (prop.prop === "emotion") {
      return `{感情}[${emotionList
        .flatMap((l, ind) => (ind ? l : [l[0]]))
        .join("|")}](${value})`;
    }
    return null;
  });
}

export function readTokugiTableInfo(
  tokugi: SaikoroFictionTokugi,
  gapColList: { spaceIndex: number; colText: string }[],
  tokugiTable: string[][],
  text: string,
  columnDamageUse: boolean,
  damageUse: boolean,
  tokugiRegStr: string
) {
  const crs = "\\[([ x])]　*";
  const regStr1 = `${gapColList
    .map(gc => `\\|${crs}\\|${gc.colText}　*${columnDamageUse ? crs : ""}`)
    .join("")}\\|\\|`;
  const matchResult1 = text.match(new RegExp(regStr1));
  if (matchResult1) {
    if (columnDamageUse) {
      const damagedColList: number[] = [];
      [...Array(gapColList.length)].forEach((_, idx) => {
        if (matchResult1[(idx + 1) * 2] === "x") damagedColList.push(idx);
      });
      tokugi.damagedColList.splice(
        0,
        tokugi.damagedColList.length,
        ...damagedColList
      );
    }
    const spaceList: number[] = [];
    gapColList.forEach((gc, idx) => {
      if (matchResult1[idx * (columnDamageUse ? 2 : 1) + 1] === "x")
        spaceList.push(gc.spaceIndex);
    });
    tokugi.spaceList.splice(0, tokugi.spaceList.length, ...spaceList);
  }
  if (damageUse) {
    const damagedList: TokugiInfo[] = [];
    let notFoundFlg = false;
    tokugiTable.forEach((tr, r) => {
      const regStr = `${tr
        .map(t => `\\|¦?　*\\|¦?\\[([ x])]${t}(?:${tokugiRegStr})?`)
        .join("")}\\|◇[0-9]+\\|`;
      const matchResult = text.match(new RegExp(regStr));
      if (matchResult) {
        gapColList.forEach((gc, idx) => {
          if (matchResult[idx + 1] === "x")
            damagedList.push({
              row: r,
              column: idx,
              name: tr[idx]
            });
        });
      } else {
        notFoundFlg = true;
      }
    });
    if (!notFoundFlg) {
      tokugi.damagedList.splice(0, tokugi.damagedList.length, ...damagedList);
    }
  }
}

export function createDiceRollStr(
  tokugi: SaikoroFictionTokugi,
  gapColList: { spaceIndex: number; colText: string }[],
  tokugiName: string
): string {
  let r: number = -1;
  let c: number = -1;
  tokugi.table.forEach((rl, rIdx) => {
    const cIdx = rl.findIndex(n => n === tokugiName);
    if (cIdx >= 0) {
      r = rIdx;
      c = cIdx;
    }
  });
  if (r === -1 || c === -1) return "";

  const minTokugiInfo: {
    r: number;
    c: number;
    name: string;
    move: number;
  } = tokugi.learnedList
    .filter(
      t =>
        (!tokugi.isUseColDamage ||
          !tokugi.damagedColList.some(c => c === t.column)) &&
        (!tokugi.isUseSingleDamage ||
          !tokugi.damagedList.some(
            d => d.row === t.row && d.column === t.column
          ))
    )
    .map(t => {
      const learnedTokugi = tokugi.table[t.row][t.column];
      let cMove: number = [...Array(Math.abs(t.column - c))].reduce(
        (accumulator, currentValue_, idx) => {
          const currentColumn = Math.min(t.column, c) + idx;
          return (
            accumulator +
            (tokugi.spaceList.some(s => s === currentColumn) ? 1 : 2)
          );
        },
        0
      );
      // 一番左のギャップが埋まっていたら、左右が繋がっているものとして扱う
      if (tokugi.spaceList.some(s => s === gapColList[0].spaceIndex)) {
        const cMoveRight: number = [
          ...Array(
            Math.min(t.column, c) + gapColList.length - Math.max(t.column, c)
          )
        ].reduce((accumulator, currentValue_, idx) => {
          let currentColumn = Math.max(t.column, c) + idx;
          if (currentColumn >= gapColList.length) {
            currentColumn -= gapColList.length;
          }
          return (
            accumulator +
            (tokugi.spaceList.some(s => s === currentColumn) ? 1 : 2)
          );
        }, 0);
        cMove = Math.min(cMove, cMoveRight);
      }
      let rMove = Math.abs(t.row - r);
      if (tokugi.outRow) {
        rMove = Math.min(rMove, Math.min(t.row, r) + 11 - Math.max(t.row, r));
      }
      return {
        r: t.row,
        c: t.column,
        name: learnedTokugi,
        move: rMove + cMove + 5
      };
    })
    .reduce(
      (accumulator, currentValue) =>
        accumulator.move > currentValue.move ? currentValue : accumulator,
      {
        r: 0,
        c: 0,
        name: "",
        move: Number.MAX_VALUE
      }
    );
  if (minTokugiInfo.move === Number.MAX_VALUE) return "";
  return tokugi.createDiceRollText(
    tokugi,
    tokugiName,
    minTokugiInfo.name,
    minTokugiInfo.move,
    minTokugiInfo.r,
    minTokugiInfo.c
  );
}

export function outputTokugiTable(
  tokugi: SaikoroFictionTokugi,
  gapColList: { spaceIndex: number; colText: string }[]
): string[] {
  const checkStr = (list: TokugiInfo[], r: number, c: number): string =>
    `${list.some(lt => lt.row === r && lt.column === c) ? "[x]" : "[ ]"}`;
  return [
    `|${gapColList
      .map(
        (gc, idx) =>
          `${tokugi.spaceList.some(s => s === gc.spaceIndex) ? "[x]" : "[ ]"}|${
            gc.colText
          }${
            tokugi.isUseColDamage
              ? tokugi.damagedColList.some(d => d === idx)
                ? "[x]"
                : "[ ]"
              : ""
          }　　　`
      )
      .join("|")}||`,
    "|:--|:--|:--|:--|:--|:--|:--|:--|:--|:--|:--|:--|:--:|",
    ...tokugi.table.map(
      (tList: string[], r: number) =>
        tList
          .map(
            (t: string, c: number) =>
              `|${
                tokugi.spaceList.some(s => s === gapColList[c].spaceIndex)
                  ? "¦"
                  : ""
              }　|${
                tokugi.learnedList.some(t => t.row === r && t.column === c)
                  ? "¦"
                  : ""
              }${
                tokugi.isOutputSingleDamage
                  ? checkStr(tokugi.damagedList, r, c)
                  : ""
              }${t}${createDiceRollStr(tokugi, gapColList, t)}`
          )
          .join("") + `|◇${r + 2}|`
    )
  ];
}

export function outputTokugiChatPalette(tokugi: SaikoroFictionTokugi) {
  return tokugi.learnedList.map(
    t => `2D6>=5 《${tokugi.table[t.row][t.column]}》`
  );
}

export function createTokugi(
  json: any,
  table: string[][],
  isUseColDamage: boolean,
  isUseSingleDamage: boolean,
  isOutputSingleDamage: boolean,
  createDiceRollText: (
    tokugi: SaikoroFictionTokugi,
    t: string,
    tt: string,
    move: number,
    r: number,
    c: number
  ) => string
): SaikoroFictionTokugi {
  const outRow = Boolean(json["skills"]["outRow"]);
  const tokugi: SaikoroFictionTokugi = {
    table,
    learnedList: [],
    damagedList: [],
    damagedColList: [],
    spaceList: [],
    outRow,
    isUseColDamage,
    isUseSingleDamage,
    isOutputSingleDamage,
    createDiceRollText
  };
  (json["learned"] as any[])
    .filter(t => t["id"])
    .forEach(t => {
      const id = t["id"];

      const row = parseInt(id.match(/row([0-9]+)/)[1]);
      const column = parseInt(id.match(/name([0-9]+)/)[1]);
      const name = tokugi.table[row][column];

      tokugi.learnedList.push({ column, row, name });
    });

  for (let i = 0; i < 6; i++) {
    if (json["skills"][String.fromCharCode("a".charCodeAt(0) + i)] !== null) {
      tokugi.spaceList.push(i);
    }
    if (
      json["skills"]["damage"] &&
      json["skills"]["damage"][`check${i}`] !== null
    ) {
      tokugi.damagedColList.push(i);
    }
    for (let j = 0; j < 11; j++) {
      if (json["skills"][`row${j}`][`check${i}`] !== null) {
        tokugi.damagedList.push({
          column: i,
          row: j,
          name: tokugi.table[j][i]
        });
      }
    }
  }
  return tokugi;
}

export function nlFormat(text: any) {
  if (text === null || text === undefined) return "";
  return text
    .toString()
    .replaceAll(/。\r?\n?/g, "。<br>")
    .replaceAll(/\r?\n/g, "<br>");
}

function mergeList<T>(
  list1: T[],
  list2: T[],
  keyProp: keyof T,
  mergePropList: (keyof T)[],
  originalRecover: boolean = true
): void {
  list2.forEach(i2 => {
    (Object.keys(i2) as (keyof T)[]).forEach(k => {
      const val = i2[k];
      if (typeof val === "string") {
        if (keyProp === k) {
          i2[k] = (val.replaceAll("<br>", "") as unknown) as T[keyof T];
        } else {
          i2[k] = (val
            .replaceAll("。<br>", "。")
            .replaceAll("<br>", "\n") as unknown) as T[keyof T];
        }
      }
    });
  });
  list1.forEach(i1 => {
    const i2 = list2.find(i2 => i2[keyProp] === i1[keyProp]);
    if (i2) {
      mergePropList.forEach(mk => {
        i1[mk] = i2[mk];
      });
    }
  });
  if (originalRecover) {
    list1.push(
      ...list2.filter(i2 => !list1.some(i1 => i1[keyProp] === i2[keyProp]))
    );
  }
}

export function duplicateNameRename<T, K extends keyof T>(
  list: T[],
  nameProp: K
) {
  const nameMap: Map<string, number[]> = new Map<string, number[]>();
  list.forEach((item, idx) => {
    const name = String(item[nameProp]);
    if (!nameMap.has(name)) nameMap.set(name, []);
    const idxList = nameMap.get(name)!;
    idxList.push(idx);
  });
  list.forEach((item, idx) => {
    const name = String(item[nameProp]);
    const idxList = nameMap.get(name)!;
    if (idxList.length === 1) return;
    item[nameProp] = ((name +
      (idxList.findIndex(i => i === idx) + 1)) as unknown) as T[K];
  });
}

export function updateData(data: any, updateInfo: string | undefined) {
  if (!updateInfo) return;
  let obj: any = data;
  const mr = updateInfo.match(/(.+)=(.+)/);
  if (mr) {
    const propStr = mr[1];
    const value = mr[2];
    propStr.split(".").forEach((s, idx, self) => {
      if (obj === null || obj === undefined) return;
      let propName = s;
      let filterProp: string | null = null;
      let filterValue: string | null = null;
      const mr = s.match(/^(.+?)(?:{(.+?):(.+?)})?$/);
      if (mr) {
        propName = mr[1];
        filterProp = mr[2];
        filterValue = mr[3];
      }
      if (idx < self.length - 1) {
        obj = obj[propName];
        if (obj === null || obj === undefined) return;
        if (Array.isArray(obj) && filterProp && filterValue) {
          obj = obj.find(item => item[filterProp!] === filterValue);
        }
      } else {
        if (obj[propName] === null || obj[propName] === undefined) return;
        switch (typeof obj[propName]) {
          case "string":
            obj[propName] = value;
            break;
          case "number":
            obj[propName] = convertNumberZero(value);
            break;
          case "boolean":
            obj[propName] = value && value.toLowerCase() === "true";
            break;
          default:
        }
      }
    });
  }
}

export function makeSelectStr(
  label: string,
  value: any,
  payload: {
    // start
    s?: number;
    // end
    e?: number;
    // before
    b?: string[];
    // after
    a?: string[];
    // isHoseiNul
    h?: boolean;
  }
): string {
  const selection: string[] = [];
  if (payload.b) selection.push(...payload.b);
  if (payload.s !== undefined && payload.e !== undefined) {
    if (payload.s < payload.e) {
      for (let i = payload.s; i <= payload.e; i++)
        selection.push(payload.h ? hoseiStr(i) : i.toString(10));
    } else {
      for (let j = payload.s; j >= payload.e; j--)
        selection.push(payload.h ? hoseiStr(j) : j.toString(10));
    }
  }
  let valueStr = value !== null && value !== undefined ? value.toString() : "";
  if (payload.h && valueStr) {
    const numVal = convertNumberNull(valueStr);
    if (numVal !== null) valueStr = hoseiStr(numVal);
  }
  if (payload.a) selection.push(...payload.a);
  return `{${label}}[${selection.join("|")}](${valueStr})`;
}

export const regStr = {
  button: "@@@(?:.+?):(?:(?!@@@).+?)@@@",
  check: "\\[([ x])]",
  select: "{([^}]+?)}\\[.*?]\\((.*?)\\)",
  text: "(.*?)",
  makeSelect: (label: string) => `{${label}}\\[.*?]\\((.*?)\\)`
};

export function tabTextProcess(
  tab: string,
  memoList: Partial<StoreData<MemoStore>>[],
  callback: (text: string) => void
) {
  const text = memoList.find(m => m.data!.tab === tab)?.data!.text;
  if (text) callback(text);
}

type FilterKeys<T, U> = {
  [P in keyof T]: T[P] extends U ? P : never;
}[keyof T];

export function readMultiLine<T>(
  list: T[],
  text: string,
  regExpStr: string,
  keyProp: FilterKeys<T, string>,
  keyPropMatchIndex: number,
  copyProp: { [k: number]: [keyof T, "b" | "n" | "s"] },
  originalRecover: boolean = true
) {
  const findList: T[] = Array.from(
    text.matchAll(new RegExp(`^\\|${regExpStr}\\|$`, "gm"))
  ).map((r, rIdx) => {
    const obj: any = {};

    obj[keyProp] = r[keyPropMatchIndex];
    ((Object.keys(copyProp) as unknown) as number[]).forEach(t => {
      obj[copyProp[t][0]] =
        copyProp[t][1] === "b"
          ? r[t] === "x"
          : copyProp[t][1] === "n"
          ? convertNumberZero(r[t])
          : r[t];
    });
    return obj as T;
  });
  mergeList(
    list,
    findList,
    keyProp!,
    Object.values(copyProp).map(p => p[0]),
    originalRecover
  );
}

type FilterArrayKeys<T, U> = {
  [P in keyof T]: T[P] extends Array<U> ? P : never;
}[keyof T];
