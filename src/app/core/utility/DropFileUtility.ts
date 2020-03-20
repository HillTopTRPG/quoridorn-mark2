import JSZip from "jszip";
import iconv from "iconv-lite";

/**
 * ドロップインされたファイル群から、Fileの配列を得る。
 * フォルダーやzipファイルは展開し、中身も配列に加える。
 *
 * @param dataTransfer
 */
export async function getDropFileList(
  dataTransfer: DataTransfer
): Promise<File[]> {
  let files: File[] = [];
  const rawFiles = dataTransfer.files;
  for (const file of rawFiles) files.push(file);

  /*
   * ドロップされたものの中にフォルダが含まれており、かつブラウザが対応している場合は
   * フォルダの中身もしっかり見ていく
   */
  const rawItems: DataTransferItemList = dataTransfer.items;
  if (rawItems) {
    const items: DataTransferItem[] = [];
    for (const item of rawItems) items.push(item);

    const fileList: File[] = [];
    await Promise.all(
      items
        .filter(item => "webkitGetAsEntry" in item)
        .map(item => scanEntryFiles(item.webkitGetAsEntry(), fileList, ""))
    );
    if (fileList.length) files = fileList;
  }

  /*
   * zipファイルは解凍して、その中身を返却リストに加える
   */
  const unzipFunc = async (z: File): Promise<void> => {
    const zipFileList: File[] = await getZipFileList(z);
    files.push(...zipFileList);
  };

  // 直列の非同期で全部実行する
  await files
    .filter(file => file.type.indexOf("zip") > -1)
    .map(file => () => unzipFunc(file))
    .reduce((prev, curr) => prev.then(curr), Promise.resolve());

  // フォルダの中も拾うし、zipも解凍した後の一覧
  return files.filter(file => {
    const name = file.name;
    if (name.startsWith("__MACOSX/")) return false;
    if (name.endsWith(".DS_Store")) return false;
    return !name.endsWith(".zip");
  });
}

async function scanEntryFiles(
  entry: any,
  fileList: File[],
  folderPath: string
): Promise<void> {
  switch (true) {
    case entry.isDirectory: {
      const name = entry.name;
      const entryReader = entry.createReader();
      const entries: any[] = await new Promise(resolve => {
        entryReader.readEntries((entries: any) => resolve(entries));
      });
      await Promise.all(
        entries.map((entry: any) =>
          scanEntryFiles(entry, fileList, folderPath + name + "/")
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

      fileList.push(newFile);
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
