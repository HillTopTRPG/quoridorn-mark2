import urljoin from "url-join";
import GameObjectManager from "../../basic/GameObjectManager";
import LanguageManager from "../../../LanguageManager";
import { ApplicationError } from "../error/ApplicationError";
import * as jsonp from "jsonp";
import { Texture } from "@/@types/store-data-optional";

export function getSrc(
  path: string
): { url: string; dataLocation: "server" | "direct" } {
  if (!path) return { url: path, dataLocation: "direct" };
  if (path.startsWith("http")) return { url: path, dataLocation: "direct" };
  if (path.startsWith("data:")) return { url: path, dataLocation: "direct" };
  if (path.startsWith(".")) path = path.replace(/^\./, "");
  const protocol = window.location.protocol;
  const host = window.location.host;
  const baseUrl = process.env.BASE_URL;
  const url = urljoin(protocol, host, baseUrl, path);
  return { url, dataLocation: "server" };
}

export function shuffleOrder(list: StoreData<any>[]): void {
  for (let i = list.length - 1; i > 0; i--) {
    const r = Math.floor(Math.random() * (i + 1));
    const tmpOrder = list[i].order;
    list[i].order = list[r].order;
    list[r].order = tmpOrder;
  }
}

/**
 * 極彩ログ処理
 *
 * @param a
 */
export function qLog(...a: any): void {
  // console.log(...arguments)

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
        // console.log(arg)
        // console.log(m3)
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
  console.log(format, ...logs);
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
    successDialog({
      title: LanguageManager.instance.getText("message.success"),
      text: `${message}\n${text}`
    }).then();
  }

  return result;
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
    const mediaList = GameObjectManager.instance.mediaList;
    const imageData = findByKey(mediaList, texture.mediaKey);
    if (imageData && imageData.data) {
      style.backgroundImage = `url('${imageData.data.url}')`;
    }
    if (texture.direction === "horizontal") style.transform = "scale(-1, 1)";
    if (texture.direction === "vertical") style.transform = "scale(1, -1)";
    if (texture.direction === "180") style.transform = "rotate(180deg)";
  }
  return style;
}

export function createEmptyStoreUseData<T>(
  key: string,
  data: T
): StoreUseData<T> {
  return {
    id: "",
    collection: "volatile",
    key,
    order: -1,
    ownerType: null,
    owner: null,
    exclusionOwner: null,
    lastExclusionOwner: null,
    permission: null,
    status: "added",
    createTime: new Date(),
    updateTime: null,
    refList: [],
    data
  };
}

export function someByStr(list: string[], str: string | null): boolean {
  return list.some(s => s === str);
}

export function findByKey<T extends { key: string | null }>(
  list: T[],
  key: string | null
): T | null {
  return list.find(obj => obj.key === key) || null;
}

export function findRequireByKey<T extends { key: string | null }>(
  list: T[],
  key: string | null
): T {
  const result = list.find(obj => obj.key === key);
  if (!result) {
    throw new ApplicationError(
      `findRequireByKey ${JSON.stringify({ key }, null, "  ")}`
    );
  }
  return result;
}

export function findRequireByOwner<T extends { owner: string | null }>(
  list: T[],
  owner: string | null
): T {
  const result = list.find(obj => obj.owner === owner);
  if (!result) {
    throw new ApplicationError(``);
  }
  return result;
}

export async function getJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    jsonp(url, { name: "getJson" }, (err: any, result: any) => {
      if (err) reject(err);
      resolve(result);
    });
  });
}

async function simpleDialog(obj: {
  title: string;
  text: string;
  icon: "warning" | "error" | "success" | "info" | "question";
}): Promise<void> {
  const html = `<div style="text-align: left;">${obj.text.replaceAll(
    "\n",
    "<br />"
  )}</div>`;
  delete obj.text;
  const confirm = await Swal.fire({
    ...obj,
    html
  });
}

export async function errorDialog(obj: {
  title: string;
  text: string;
}): Promise<void> {
  await simpleDialog({
    ...obj,
    icon: "error"
  });
}

export async function warningDialog(obj: {
  title: string;
  text: string;
}): Promise<void> {
  await simpleDialog({
    ...obj,
    icon: "warning"
  });
}

export async function successDialog(obj: {
  title: string;
  text: string;
}): Promise<void> {
  await simpleDialog({
    ...obj,
    icon: "success"
  });
}

export async function questionDialog(obj: {
  title: string;
  text: string;
  confirmButtonText: string;
  cancelButtonText: string;
}): Promise<boolean> {
  const html = `<div style="text-align: left;">${obj.text.replaceAll(
    "\n",
    "<br />"
  )}</div>`;
  delete obj.text;
  const confirm = await Swal.fire({
    ...obj,
    html,
    icon: "question",
    showCancelButton: true
  });
  return confirm.isConfirmed;
}

export function replaceArrayElements(
  list: any[],
  targetIdx: number,
  sourceIdx: number
) {
  const cloneArray = [...list];
  [cloneArray[targetIdx], cloneArray[sourceIdx]] = [
    list[sourceIdx],
    list[targetIdx]
  ];
  return cloneArray;
}

export function setOrderByListOrder(dataList: StoreData<any>[]) {
  const orderList: number[] = dataList.map(data => data.order);
  orderList.sort();
  dataList.forEach((data, idx) => (data.order = orderList[idx]));
}
