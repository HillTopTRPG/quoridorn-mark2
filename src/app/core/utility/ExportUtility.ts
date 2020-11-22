import {
  createJsonBlob,
  saveFile,
  saveJson
} from "@/app/core/utility/FileUtility";
import moment from "moment/moment";
import { clone } from "@/app/core/utility/PrimaryDataUtility";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { findRequireByKey } from "@/app/core/utility/Utility";
import * as JSZip from "jszip";

async function fetchFile(url: string): Promise<{ src: any; fileName: string }> {
  return new Promise(resolve => {
    const fileName = url.slice(url.lastIndexOf("/") + 1);
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "blob";
    xhr.onload = function() {
      // ファイル名とデータ返却
      console.log(this.response);
      resolve({ src: this.response, fileName });
    };
    // reject だと await Promise.all を抜けてしまう
    // => resolve でデータ無し
    xhr.onerror = () => resolve({ src: null, fileName });
    xhr.onabort = () => resolve({ src: null, fileName });
    xhr.ontimeout = () => resolve({ src: null, fileName });
    xhr.send();
  });
}

export type ExportLevel =
  | "full" // 部屋データ全体
  | "user" // ユーザーデータ
  | "actor" // アクターデータ
  | "part"; // 個別データ

export async function exportData(
  list: StoreData<any>[],
  exportLevel: ExportLevel
) {
  const dateStr = moment().format("YYYYMMDD_HHmmss");
  const fileName = `quoridorn_export_data_${dateStr}`;

  const exportJsonList: Partial<StoreUseData<any>>[] = clone(list)!;

  let mediaUrlList: string[] = [];
  list.forEach(l => {
    const matchResult = JSON.stringify(l.data).matchAll(
      /"mediaKey": ?"([^"]+)"/g
    );
    const mediaKeyList = Array.from(matchResult, mr => mr[1]);
    const mediaList = GameObjectManager.instance.mediaList.filter(m =>
      mediaKeyList.some(mk => mk === m.key)
    );
    exportJsonList.unshift(...mediaList);
    mediaUrlList.push(...mediaList.map(m => m.data!.url));
  });
  mediaUrlList = mediaUrlList.filter(
    (url, index, list) => list.findIndex(u => u === url) === index
  );

  const userList = list
    .filter(l => l.ownerType === "user-list")
    .map(l => findRequireByKey(GameObjectManager.instance.userList, l.owner))
    .filter(
      u =>
        !exportJsonList.some(
          data => data.collection === "user-list" && data.key === u.key
        )
    );
  exportJsonList.unshift(...userList);

  exportJsonList.forEach(data => {
    delete data.id;
    delete data.status;
    delete data.lastExclusionOwner;
    delete data.exclusionOwner;
    delete data.updateTime;
    delete data.createTime;
    if (
      JSON.stringify(data.permission) ===
      JSON.stringify(GameObjectManager.PERMISSION_DEFAULT)
    ) {
      delete data.permission;
    }

    const anyData = data.data as any;
    if (data.collection === "user-list") {
      delete anyData.token;
      delete anyData.login;
    }
  });

  console.log(mediaUrlList);

  const exportData = {
    exportLevel,
    list: exportJsonList
  };

  const resultList = (
    await Promise.all(mediaUrlList.map(url => fetchFile(url)))
  ).filter(r => r.src);
  if (!resultList.length) {
    await saveJson(fileName, "quoridorn-export-data-list", exportData);
  } else {
    const zip = new JSZip();

    // メディアファイルを追加
    resultList.forEach(result => {
      zip.file(result.fileName, result.src);
    });

    // JSONを追加
    zip.file(
      "data.json",
      createJsonBlob("quoridorn-export-data-list", exportData)
    );

    // zip を生成
    zip.generateAsync({ type: "blob" }).then((blob: Blob) => {
      saveFile(`${fileName}.zip`, blob);
    });
  }
}
