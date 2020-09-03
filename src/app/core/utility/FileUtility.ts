import yaml from "js-yaml";
import { Size } from "address";
import { StandImageInfo } from "@/@types/room";
import { convertNumberNull, getFileName } from "./PrimaryDataUtility";
import { createSize } from "./CoordinateUtility";
import { ApplicationError } from "../error/ApplicationError";
import { getYoutubeThunbnail } from "../../basic/cut-in/bgm/YoutubeManager";
import DropBoxManager from "../api/drop-box/DropBoxManager";
import {
  UploadMediaInfo,
  UploadMediaRequest,
  UploadMediaResponse
} from "@/@types/socket";
import SocketFacade from "../api/app-server/SocketFacade";
import { ExportDataFormat } from "@/@types/store";
import { getSrc } from "@/app/core/utility/Utility";
import LanguageManager from "@/LanguageManager";

/**
 * テキストファイルをロードする
 *
 * @param path
 * @param isErrorIgnore
 */
export async function loadText(
  path: string,
  isErrorIgnore: boolean = false
): Promise<string> {
  try {
    const response = await fetch(process.env.BASE_URL + path);
    return await response.text();
  } catch (err) {
    throw new ApplicationError(`textファイルの読み込みに失敗しました：${path}`);
  }
}

export function unicodeEscape(str: string) {
  let code = "";
  const head: { [key: number]: string } = {
    1: "\\u000",
    2: "\\u00",
    3: "\\u0",
    4: "\\u"
  };
  return str.replace(/[^./a-zA-Z0-9]/g, function(c) {
    return head[(code = c.charCodeAt(0).toString(16)).length] + code;
  });
}

/**
 * Yamlファイルをロードする
 *
 * @param path
 * @param isErrorIgnore
 */
export async function loadYaml<T>(
  path: string,
  isErrorIgnore: boolean = false
): Promise<T> {
  try {
    const text = await loadText(path, isErrorIgnore);
    return yaml.safeLoad(text) as T;
  } catch (err) {
    throw new ApplicationError(
      `yamlファイルの読み込みに失敗しました path:${path}`
    );
  }
}

/**
 * Jsonファイルをロードする
 *
 * @param path
 */
export async function loadJson<T>(path: string): Promise<T> {
  try {
    const text = await loadText(path);
    return JSON.parse(text);
  } catch (err) {
    throw new ApplicationError(
      `jsonファイルの読み込みに失敗しました path:${path}`
    );
  }
}

async function showOpenFileDialog(): Promise<File | null> {
  return new Promise(resolve => {
    const input: HTMLInputElement = document.createElement("input");
    input.type = "file";
    input.accept = ".json, text/plain";
    input.onchange = () => {
      resolve(input.files ? input.files[0] : null);
    };
    input.click();
  });
}

async function readAsText(file: File | null): Promise<string | null> {
  return new Promise(resolve => {
    if (!file) return null;
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
      resolve(String(reader.result));
    };
  });
}

/**
 * Jsonファイルをインポートする
 *
 * @param type
 */
export async function importJson<T>(
  type: string
): Promise<ExportDataFormat<T> | null> {
  const file = await showOpenFileDialog();
  const text = await readAsText(file);
  if (!text) return null;
  try {
    const obj: ExportDataFormat<T> = JSON.parse(text);
    return obj.type === type ? obj : null;
  } catch (err) {
    return null;
  }
}

/**
 * Textファイルをインポートする
 */
export async function importText(): Promise<string | null> {
  const file = await showOpenFileDialog();
  return await readAsText(file);
}

/**
 * テキストファイルをセーブする
 *
 * @param name
 * @param text
 */
export function saveText(name: string, text: string): void {
  const blob = new Blob([text], {
    type: "text/plain"
  });
  saveFile(`${name}.txt`, blob);
}

/**
 * Jsonファイルをセーブする
 *
 * @param name
 * @param type
 * @param data
 */
export function saveJson<T>(name: string, type: string, data: T): void {
  const saveData: ExportDataFormat<T> = {
    version: process.env.npm_package_version!,
    type,
    data
  };
  const blob = new Blob([JSON.stringify(saveData, null, "  ")], {
    type: "application/json"
  });
  saveFile(`${name}.json`, blob);
}

/**
 * HTMLファイルをセーブする
 *
 * @param name
 * @param text
 */
export function saveHTML(name: string, text: string): void {
  const blob = new Blob([text], {
    type: "text/html"
  });
  saveFile(`${name}.html`, blob);
}

/**
 * 適当ファイルをセーブする
 *
 * @param name
 * @param blob
 */
export function saveFile(name: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.download = name;
  anchor.href = url;
  anchor.click();
}

export type IconClass =
  | "icon-warning"
  | "icon-youtube2"
  | "icon-image"
  | "icon-music"
  | "icon-text";

export type UrlType = "youtube" | "image" | "music" | "setting" | "unknown";

function getUrlTypes(url: string): { urlType: UrlType; iconClass: IconClass } {
  if (url.match(/^https?:\/\/www.youtube.com\/watch\?v=/)) {
    return { urlType: "youtube", iconClass: "icon-youtube2" };
  } else {
    const ext = extname(url);
    switch (ext) {
      case "png":
      case "gif":
      case "jpg":
      case "jpeg":
        return { urlType: "image", iconClass: "icon-image" };
      case "mp3":
      case "wav":
      case "wave":
        return { urlType: "music", iconClass: "icon-music" };
      case "json":
      case "yaml":
        return { urlType: "setting", iconClass: "icon-text" };
      default:
        return { urlType: "unknown", iconClass: "icon-warning" };
    }
  }
}

async function raw2UploadMediaInfo(
  raw: string | File
): Promise<{ uploadMediaInfo: UploadMediaInfo; raw: string | File }> {
  let rawText: string = typeof raw === "string" ? raw : raw.name;
  let name = ""; // 後で必ず上書き
  const tag = "";
  const { urlType, iconClass } = getUrlTypes(rawText);

  let { url, dataLocation } =
    typeof raw === "string"
      ? getSrc(raw)
      : { url: "", dataLocation: "server" as "server" };

  let imageSrc: string = "";

  if (urlType === "youtube") {
    imageSrc = getYoutubeThunbnail(rawText);
    name = LanguageManager.instance.getText("label.no-target");
  } else {
    name = getFileName(rawText);
  }

  if (urlType === "image") {
    if (typeof raw === "string") {
      imageSrc = raw;
    } else {
      imageSrc = await file2Base64(raw);
    }
  }

  let result: UploadMediaInfo | null = null;

  if (dataLocation === "direct") {
    // Base64フォーマット文字列か、外部URL
    result = { name, tag, url, urlType, iconClass, imageSrc, dataLocation };
  } else {
    let blob: Blob | undefined = undefined;
    let arrayBuffer: ArrayBuffer | undefined = undefined;
    if (typeof raw === "string") {
      // クライアントに置かれているファイルへの参照
      arrayBuffer = await url2ArrayBuffer(url);
      blob = new Blob([arrayBuffer]);
    } else {
      // ファイルをドロップインされた
      blob = raw;
      arrayBuffer = await blob2ArrayBuffer(blob);
    }
    result = {
      name,
      tag,
      url,
      urlType,
      iconClass,
      imageSrc,
      dataLocation,
      blob,
      arrayBuffer
    };
  }
  return { uploadMediaInfo: result, raw };
}

export async function raw2UploadMediaInfoList(
  rawList: (string | File)[]
): Promise<UploadMediaInfo[]> {
  const resultList: {
    uploadMediaInfo: UploadMediaInfo;
    raw: string | File;
  }[] = [];
  await Promise.all(
    rawList.map(raw =>
      (async () => {
        resultList.push(await raw2UploadMediaInfo(raw));
      })()
    )
  );

  // 非同期処理は並列で行った代わりに、順序を保証するためにソートするaa
  const getStr = (data: string | File) =>
    typeof data === "string" ? data : data.name;
  const rawStrList = rawList.map(r => getStr(r));
  resultList.sort((umi1, umi2) => {
    const umi1Str = getStr(umi1.raw);
    const umi2Str = getStr(umi2.raw);
    const idx1 = rawStrList.findIndex(rs => umi1Str === rs);
    const idx2 = rawStrList.findIndex(rs => umi2Str === rs);
    if (idx1 < idx2) return -1;
    if (idx1 > idx2) return 1;
    return 0;
  });
  return resultList.map(r => r.uploadMediaInfo);
}

export async function mediaUpload(
  uploadMediaRequest: UploadMediaRequest
): Promise<UploadMediaResponse> {
  // DropBox連携
  if (DropBoxManager.instance.ready) {
    const uploadDropBoxFunc = async (
      uploadMediaInfo: UploadMediaInfo
    ): Promise<void> => {
      if (uploadMediaInfo.dataLocation === "direct") return;
      const dropBoxResult = await DropBoxManager.instance.upload(
        uploadMediaInfo.blob,
        uploadMediaInfo.name
      );
      console.log("::DropBoxResult::");
      console.log(dropBoxResult);
    };
    // 直列の非同期で全部実行する
    await uploadMediaRequest.uploadMediaInfoList
      .map(umi => () => uploadDropBoxFunc(umi))
      .reduce((prev, curr) => prev.then(curr), Promise.resolve());
  }

  // アップロードする
  return await SocketFacade.instance.socketCommunication<
    UploadMediaRequest,
    UploadMediaResponse
  >("upload-media", uploadMediaRequest);
}

async function url2ArrayBuffer(url: string): Promise<ArrayBuffer> {
  return new Promise<ArrayBuffer>(
    (resolve: (result: ArrayBuffer) => void, reject: () => void) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.responseType = "arraybuffer";
      xhr.onload = function(e) {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            const arrayBuffer: ArrayBuffer = this.response;
            resolve(arrayBuffer);
          } else {
            reject();
          }
        }
      };
      xhr.onerror = function() {
        reject();
      };
      xhr.ontimeout = function() {
        reject();
      };
      xhr.send();
    }
  );
}

async function url2Blob(url: string): Promise<Blob> {
  return new Blob([await url2ArrayBuffer(url)]);
}

async function blob2ArrayBuffer(blob: Blob | File): Promise<ArrayBuffer> {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const fr = new FileReader();
    fr.readAsArrayBuffer(blob);
    fr.onload = event => {
      resolve(event.target!.result as ArrayBuffer);
    };
    fr.onerror = err => {
      reject(err);
    };
  });
}

export function extname(path: string): string {
  return path.replace(/^.+\./, "");
}

export async function file2Base64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result!.toString());
    reader.onerror = error => reject(error);
  });
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
        const num: number | null = convertNumberNull(str);
        return num === null ? str : num;
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

/**
 * 画像ファイルからBASE64形式の本物とサムネイルの２パターンの画像ファイルを生成する
 *
 * @param imageFile
 * @param size
 */
function createBase64DataSet(imageFile: any, size: Size): any {
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
            const useSize: Size = createSize(image.width, image.height);

            // 大きい場合は、比率を保ったまま縮小する
            if (useSize.width > size.width || useSize.height > size.height) {
              const scale = Math.min(
                size.width / useSize.width,
                size.height / useSize.height
              );
              useSize.width = useSize.width * scale;
              useSize.height = useSize.height * scale;
            }

            // 画像を描画してデータを取り出す（Base64変換の実装）
            const canvas: HTMLCanvasElement = document.createElement(
              "canvas"
            ) as HTMLCanvasElement;
            const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;
            canvas.width = size.width;
            canvas.height = size.height;
            const locate = {
              x: (canvas.width - useSize.width) / 2,
              y: (canvas.height - useSize.height) / 2
            };
            ctx.drawImage(
              image,
              locate.x,
              locate.y,
              useSize.width,
              useSize.height
            );

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

export function imageFileToBase64(imageFiles: File[]): PromiseLike<any[]> {
  const promiseList: PromiseLike<any>[] = imageFiles.map(file =>
    createBase64DataSet(file, createSize(96, 96))
  );
  return Promise.all(promiseList);
}
