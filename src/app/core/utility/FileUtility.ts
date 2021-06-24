import yaml from "js-yaml";
import { getFileName } from "./PrimaryDataUtility";
import { ApplicationError } from "../error/ApplicationError";
import DropBoxManager from "../api/drop-box/DropBoxManager";
import {
  UploadMediaInfo,
  UploadMediaRequest,
  UploadMediaResponse
} from "@/@types/socket";
import SocketFacade from "../api/app-server/SocketFacade";
import { getSrc } from "@/app/core/utility/Utility";
import LanguageManager from "@/LanguageManager";
import { IconClass, Size, UrlType } from "@/@types/store-data-optional";
import { getYoutubeThunbnail } from "@/app/basic/cut-in/bgm/YoutubeManager";
import { createSize } from "@/app/core/utility/CoordinateUtility";
import { MediaStore } from "@/@types/store-data";

export type ExportDataFormat<T> = {
  type: string;
  version: string;
  data: T;
};

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
    const response = await fetch(
      `${process.env.BASE_URL}${path}?version=${process.env.VUE_APP_VERSION!}`
    );
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
  let text: string = "";
  try {
    text = await loadText(path, isErrorIgnore);
  } catch (err) {
    throw new ApplicationError(
      `yamlファイルが存在しませんでした。 path:${path}`
    );
  }
  try {
    return yaml.safeLoad(text) as T;
  } catch (err) {
    throw new ApplicationError(`yaml形式が壊れています。 path:${path}`);
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

export async function getImageSize(path: string): Promise<Size | null> {
  const loadImage = async () => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = e => reject(e);
      img.src = path;
    });
  };
  try {
    const res: any = await loadImage();
    return createSize(res.width, res.height);
  } catch (e) {
    return null;
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

export async function readJsonFiles(fileList: File[]): Promise<any[]> {
  return (await Promise.all(fileList.map(f => readAsText(f))))
    .filter(t => t)
    .map(t => JSON.parse(t!));
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

export function createJsonBlob(type: string, data: any): Blob {
  const saveData: ExportDataFormat<any> = {
    version: process.env.VUE_APP_VERSION!,
    type,
    data
  };
  return new Blob([JSON.stringify(saveData, null, "  ")], {
    type: "application/json"
  });
}

/**
 * Jsonファイルをセーブする
 *
 * @param name
 * @param type
 * @param data
 */
export function saveJson<T>(name: string, type: string, data: T): void {
  saveFile(`${name}.json`, createJsonBlob(type, data));
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
  raw: string | File,
  meta?: { urlType: UrlType; iconClass: IconClass }
): Promise<{ uploadMediaInfo: UploadMediaInfo; raw: string | File }> {
  const rawText: string = typeof raw === "string" ? raw : raw.name;
  const rawPath = rawText;
  let name: string;
  const tag = "";
  if (!meta) meta = getUrlTypes(rawText);

  const srcInfo: { url: string; dataLocation: "server" | "direct" } =
    typeof raw === "string"
      ? getSrc(raw)
      : { url: "", dataLocation: "server" as "server" };

  let imageSrc: string = "";

  if (meta.urlType === "youtube") {
    imageSrc = getYoutubeThunbnail(rawText);
    name = LanguageManager.instance.getText("label.no-target");
  } else {
    name = getFileName(rawText);
  }

  if (meta.urlType === "image") {
    if (typeof raw === "string") {
      imageSrc = raw;
    } else {
      imageSrc = await file2Base64(raw);
    }
  }

  let result: UploadMediaInfo | null = null;

  if (srcInfo.dataLocation === "direct") {
    // Base64フォーマット文字列か、外部URL
    result = {
      name,
      rawPath,
      mediaFileId: "",
      tag,
      url: srcInfo.url,
      urlType: meta.urlType,
      iconClass: meta.iconClass,
      imageSrc,
      dataLocation: srcInfo.dataLocation
    };
  } else {
    let blob: Blob | undefined = undefined;
    let arrayBuffer: ArrayBuffer | undefined = undefined;
    if (typeof raw === "string") {
      // クライアントに置かれているファイルへの参照
      arrayBuffer = await url2ArrayBuffer(srcInfo.url);
      blob = new Blob([arrayBuffer]);
    } else {
      // ファイルをドロップインされた
      blob = raw;
      arrayBuffer = await blob2ArrayBuffer(blob);
    }
    result = {
      name,
      rawPath,
      mediaFileId: "",
      tag,
      url: srcInfo.url,
      urlType: meta.urlType,
      iconClass: meta.iconClass,
      imageSrc,
      dataLocation: srcInfo.dataLocation,
      blob,
      arrayBuffer
    };
  }
  return { uploadMediaInfo: result!, raw };
}

export async function exchangeMediaInfo(
  url: string,
  tag: string,
  name: string
): Promise<UploadMediaInfo[]> {
  const mediaDataList: Partial<MediaStore>[] = [{ name, tag, url }];

  const uploadMediaInfoList = await raw2UploadMediaInfoList(
    mediaDataList.map(md => md.url!)
  );
  uploadMediaInfoList.forEach((umi: UploadMediaInfo, index: number) => {
    const mediaData = mediaDataList[index];
    umi.name = mediaData.name!;
    umi.tag = mediaData.tag!;
  });

  return uploadMediaInfoList;
}

export async function raw2UploadMediaInfoList(
  rawList: (string | File)[],
  metaList?: { urlType: UrlType; iconClass: IconClass }[]
): Promise<UploadMediaInfo[]> {
  const resultList: {
    uploadMediaInfo: UploadMediaInfo;
    raw: string | File;
  }[] = [];
  await Promise.all(
    rawList.map((raw, idx) =>
      (async () => {
        resultList.push(
          await raw2UploadMediaInfo(raw, metaList ? metaList[idx] : undefined)
        );
      })()
    )
  );

  // 非同期処理は並列で行った代わりに、順序を保証するためにソートする
  const getStr = (data: string | File) =>
    typeof data === "string" ? data : data.name;
  const rawStrList = rawList.map(r => getStr(r));
  resultList.sort((umi1, umi2) => {
    const umi1Str = getStr(umi1.raw);
    const umi2Str = getStr(umi2.raw);
    const index1 = rawStrList.findIndex(rs => umi1Str === rs);
    const index2 = rawStrList.findIndex(rs => umi2Str === rs);
    if (index1 < index2) return -1;
    if (index1 > index2) return 1;
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
      xhr.onload = function() {
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
