import urljoin from "url-join";
import { StoreUseData } from "@/@types/store";
import LanguageManager from "@/LanguageManager";
import { Texture } from "@/@types/room";
import GameObjectManager from "@/app/basic/GameObjectManager";

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
