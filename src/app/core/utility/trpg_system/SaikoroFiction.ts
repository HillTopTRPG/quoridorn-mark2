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
    if (json["skills"]["damage"][`check${i}`] !== null) {
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
