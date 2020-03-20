import { convertNumberZero, sum } from "@/app/core/utility/PrimaryDataUtility";

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
      list[index] = convertNumberZero(list[index]);
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
