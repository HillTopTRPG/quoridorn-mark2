import {
  convertNumberNull,
  convertNumberZero
} from "@/app/core/utility/PrimaryDataUtility";

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
    name: p.name,
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
        if (convertResult) return nlFormat(convertResult);
      }
      if (typeof v === "boolean") return `[${v ? "x" : " "}]`;
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

export function outputTokugiTable(
  tokugi: SaikoroFictionTokugi,
  gapColList: { spaceIndex: number; colText: string }[],
  isOutputDamage: boolean,
  headerFunc: (text: string, ind: number) => string
): string[] {
  const checkStr = (list: TokugiInfo[], r: number, c: number) =>
    `[${list.some(lt => lt.row === r && lt.column === c) ? "x" : " "}]`;
  return [
    `|${gapColList
      .map((gc, ind) => `　|${headerFunc(gc.colText, ind)}`)
      .join("|")}||`,
    "|:--|:--|:--|:--|:--|:--|:--|:--|:--|:--|:--|:--|:--:|",
    ...tokugi.table.map(
      (tList: string[], r: number) =>
        tList
          .map(
            (t: string, c: number) =>
              `|${
                tokugi.spaceList.indexOf(gapColList[c].spaceIndex) > -1
                  ? "¦"
                  : ""
              }　|${
                tokugi.learnedList.some(t => t.row === r && t.column === c)
                  ? "¦"
                  : ""
              }${isOutputDamage ? checkStr(tokugi.damagedList, r, c) : ""}${t}`
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
  table: string[][]
): SaikoroFictionTokugi {
  const outRow = json["skills"]["outRow"];
  const tokugi: SaikoroFictionTokugi = {
    table,
    learnedList: [],
    damagedList: [],
    damagedColList: [],
    spaceList: [],
    outRow: outRow !== null
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

export function createSelect(
  label: string,
  max: number | string | null,
  current: string | number | null
): string {
  const maxNum: number | null =
    typeof max === "number" ? max : convertNumberNull(max);
  if (maxNum === null) return current ? current.toString() : "";
  return `${label ? `{${label}}` : ""}[${[...Array(maxNum + 1)]
    .map((_, i) => i)
    .reverse()
    .join("|")}](${convertNumberZero(current ? current.toString() : null)})`;
}

export function nlFormat(text: any) {
  if (text === null) return "";
  return text
    .toString()
    .replaceAll(/。\n?/g, "。<br>")
    .replaceAll("\n", "<br>");
}
