import JSZip from "jszip";
import iconv from "iconv-lite";
import yaml from "js-yaml";

/**
 * ドロップインされたファイル群から、Fileの配列を得る。
 * フォルダーやzipファイルは展開し、中身も配列に加える。
 *
 * @param dataTransfer
 */
export async function getDropFileList(
  dataTransfer: DataTransfer
): Promise<(File | string)[]> {
  let list: (File | string)[] = [];
  const rawFiles = dataTransfer.files;
  for (const file of rawFiles) list.push(file);

  /*
   * ドロップされたものの中にフォルダが含まれており、かつブラウザが対応している場合は
   * フォルダの中身もしっかり見ていく
   */
  const rawItems: DataTransferItemList = dataTransfer.items;
  if (rawItems) {
    const items: DataTransferItem[] = [];
    for (const item of rawItems) items.push(item);

    const resultList: (File | string)[] = [];
    await Promise.all(
      items
        .filter(item => "webkitGetAsEntry" in item)
        .map(item => {
          if (item.kind === "string") return item;
          return item.webkitGetAsEntry;
        })
        .map(obj => scanEntryFiles(obj, resultList, ""))
    );
    if (resultList.length)
      list = resultList.filter(
        (r, idx, list) =>
          list.findIndex(i => JSON.stringify(i) === JSON.stringify(r)) === idx
      );
  }

  /*
   * zipファイルは解凍して、その中身を返却リストに加える
   */
  const unzipFunc = async (z: File): Promise<void> => {
    const zipFileList: File[] = await getZipFileList(z);
    list.push(...zipFileList);
  };

  // 直列の非同期で全部実行する
  await list
    .filter(item => typeof item !== "string" && item.type.indexOf("zip") > -1)
    .map(file => () => unzipFunc(file as File))
    .reduce((prev, curr) => prev.then(curr), Promise.resolve());

  // フォルダの中も拾うし、zipも解凍した後の一覧
  return list.filter(item => {
    if (typeof item === "string") return true;
    const name = item.name;
    if (name.startsWith("__MACOSX/")) return false;
    if (name.endsWith(".DS_Store")) return false;
    return !name.endsWith(".zip");
  });
}

function getResultList(text: string): string[] {
  // jsonはパースできたらOK
  try {
    JSON.parse(text);
    return [text];
  } catch (err) {
    // Nothing.
  }

  // yamlは "type"プロパティを持つものしか認めない
  try {
    const yamlObj: any = yaml.safeLoad(text);
    if ("type" in yamlObj) {
      return [JSON.stringify(yamlObj)];
    }
  } catch (err) {
    // Nothing.
  }

  // テキスト形式は分解して、URLのみを取得
  return text.split("\n").filter(s => s && s.startsWith("http"));
}

async function scanEntryFiles(
  entry: any,
  resultList: (File | string)[],
  folderPath: string
): Promise<void> {
  if ("kind" in entry && entry.kind === "string") {
    await new Promise(resolve => {
      entry.getAsString((result: string) => {
        const textList = getResultList(result);
        if (textList.length) resultList.push(...textList);
        resolve();
      });
    });
    return;
  }
  switch (true) {
    case entry.isDirectory: {
      const name = entry.name;
      const entryReader = entry.createReader();
      const entries: any[] = await new Promise(resolve => {
        entryReader.readEntries((entries: any) => resolve(entries));
      });
      await Promise.all(
        entries.map((entry: any) =>
          scanEntryFiles(entry, resultList, folderPath + name + "/")
        )
      );
      break;
    }
    case entry.isFile: {
      const file: File = await new Promise(resolve => {
        entry.file((file: File) => resolve(file));
      });
      const newFileName = folderPath + file.name;
      const newFile: File = new File([file], newFileName, {
        type: file.type,
        lastModified: file.lastModified
      });

      resultList.push(newFile);
      break;
    }
    default: {
      // Nothing.
    }
  }
}

/**
 * @param zipFile
 * @param charCode add 'CP932'
 */
async function getZipFileList(
  zipFile: File,
  charCode?: string
): Promise<File[]> {
  const option = charCode
    ? {
        decodeFileName: (fileNameBinary: Buffer) =>
          iconv.decode(fileNameBinary, charCode)
      }
    : undefined;
  const zip = await JSZip.loadAsync(zipFile, option);

  const fileList: File[] = [];
  for (const fileName in zip.files) {
    if (!zip.files.hasOwnProperty(fileName)) continue;
    const result = zip.files[fileName];
    if (result.dir) continue;
    const blob = await result.async("blob");
    const file = new File([blob], result.name);
    fileList.push(file);
  }

  return fileList;
}
