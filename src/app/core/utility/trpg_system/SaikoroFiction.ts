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
};

export function createTokugi(
  json: any,
  table: string[][]
): SaikoroFictionTokugi {
  const tokugi: SaikoroFictionTokugi = {
    table,
    learnedList: [],
    damagedList: [],
    damagedColList: [],
    spaceList: []
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

export function nlFormat(text: string | null) {
  if (!text) return "";
  return text.replaceAll(/。\n?/g, "。<br>").replaceAll("\n", "<br>");
}
