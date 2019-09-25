import { ApplicationError } from "@/app/core/error/ApplicationError";

/**
 * CSSの値を取得する
 * 対応している単位は「px」「em」「rem」「%(これはgetComputedStyleによって変換される)」
 * @param propertyName
 * @param element
 */
export function getCssPxNum(
  propertyName: string,
  element?: HTMLElement
): number {
  const getVal = (prop: string, elm: HTMLElement) =>
    window.getComputedStyle(elm).getPropertyValue(prop);
  const deleteAndFloat = (str: string, searchStr: string) =>
    parseFloat(str.replace(searchStr, ""));
  const getPxNum = (cssVal: string) => deleteAndFloat(cssVal, "px");
  const getEmNum = (cssVal: string) => deleteAndFloat(cssVal, "em");
  const getRemNum = (cssVal: string) => deleteAndFloat(cssVal, "rem");

  const createError = (cssVal: string) =>
    new ApplicationError(`Un supported font-size unit. value='${cssVal}'`);

  const targetElm = element || document.documentElement;
  const rootFontSizeNum = getPxNum(
    getVal("font-size", document.documentElement)
  );
  const getNum = (cssVal: string) => {
    if (cssVal.endsWith("px")) return getPxNum(cssVal);
    if (cssVal.endsWith("rem")) return getRemNum(cssVal) * rootFontSizeNum;
    if (cssVal.endsWith("em"))
      return (
        getEmNum(cssVal) *
        getCssPxNum("font-size", targetElm.parentElement || undefined)
      );
    throw createError(cssVal);
  };

  const fontSizeNum = getNum(getVal("font-size", targetElm));
  if (propertyName === "font-size") return fontSizeNum;

  const cssVal = getVal(propertyName, targetElm);
  if (cssVal.endsWith("px") || cssVal.endsWith("rem")) return getNum(cssVal);
  if (cssVal.endsWith("em")) return getEmNum(cssVal) * fontSizeNum;
  throw createError(cssVal);
}
