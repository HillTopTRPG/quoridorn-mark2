import { MediaStore } from "@/@types/store-data";
import {
  mediaUpload,
  raw2UploadMediaInfoList,
  readJsonFiles
} from "@/app/core/utility/FileUtility";
import { getExt } from "@/app/core/utility/PrimaryDataUtility";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { UploadMediaInfo } from "@/@types/socket";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import { ExportLevel } from "./ExportUtility";

async function jsonFileList2JsonList(
  jsonFileList: File[]
): Promise<{ [exportLevel in ExportLevel]?: StoreData<any>[] }> {
  const importRawData: {
    [exportLevel in ExportLevel]?: StoreData<any>[];
  } = {};
  const jsonList = await readJsonFiles(jsonFileList);
  jsonList
    .filter(j => j.type === "quoridorn-export-data-list")
    .forEach(j => {
      const exportLevelRaw = j.data.exportLevel;
      if (
        exportLevelRaw !== "part" ||
        exportLevelRaw !== "actor" ||
        exportLevelRaw !== "user" ||
        exportLevelRaw !== "full"
      )
        return;
      const exportLevel = exportLevelRaw as ExportLevel;
      const rawData = importRawData[exportLevel];
      const list = j.data.list as StoreData<any>[];
      if (rawData) {
        rawData.push(...list);
      } else {
        importRawData[exportLevel] = list;
      }
    });
  return importRawData;
}

async function getMediaLineage(
  dropList: (string | File)[]
): Promise<{
  exportLevel: ExportLevel;
  mediaInfoList: StoreData<MediaStore>[];
  otherInfoList: StoreData<any>[];
  mediaFileList: File[];
}> {
  let exportLevel: ExportLevel = "part";
  const mediaInfoList: StoreData<MediaStore>[] = [];
  const otherInfoList: StoreData<any>[] = [];
  const mediaFileList: File[] = [];

  const removeDropListIndexList: number[] = [];
  const jsonFileList: File[] = [];
  dropList.forEach((d, index) => {
    if (typeof d === "string" || getExt(d.name) !== "json") return;
    removeDropListIndexList.push(index);
    jsonFileList.push(d);
  });

  const importRawData = await jsonFileList2JsonList(jsonFileList);
  const createResult = (
    exportLevel: "part" | "full",
    rawData: StoreData<any>[]
  ): void => {
    rawData.forEach(ir => {
      if (ir.collection === "media-list") {
        mediaInfoList.push(ir as StoreData<MediaStore>);
      } else {
        otherInfoList.push(ir);
      }
    });

    mediaFileList.push(
      ...mediaInfoList.map(
        mi =>
          (dropList.find((d, index) => {
            const result =
              typeof d !== "string" && d.name === mi.data!.mediaFileId;
            if (result) removeDropListIndexList.push(index);
            return result;
          }) as File) || null
      )
    );
  };

  if (importRawData.full) {
    createResult("full", importRawData.full);
    exportLevel = "full";
  }
  if (importRawData.part) {
    createResult("part", importRawData.part);
  }

  const removeIndexList: number[] = [];
  mediaFileList.forEach((mf, index) => {
    if (!mf) removeIndexList.push(index);
  });
  removeIndexList.reverse().forEach(index => {
    mediaFileList.splice(index, 1);
    mediaInfoList.splice(index, 1);
  });

  // 除外ファイルはアップロードしない
  removeDropListIndexList
    .sort((index1, index2) => {
      if (index1 > index2) return -1;
      if (index1 < index2) return 1;
      return 0;
    })
    .forEach(index => dropList.splice(index, 1));

  return {
    mediaInfoList,
    otherInfoList,
    mediaFileList,
    exportLevel
  };
}

export async function importInjection(dropList: (string | File)[]) {
  const {
    exportLevel,
    mediaFileList,
    mediaInfoList,
    otherInfoList
  } = await getMediaLineage(dropList);
  const uploadMediaInfoList: UploadMediaInfo[] = await raw2UploadMediaInfoList(
    mediaFileList
  );
  uploadMediaInfoList.forEach(ui => {
    const mediaInfo = mediaInfoList.find(
      mi => mi.data!.mediaFileId === ui.rawPath
    )!;
    ui.key = mediaInfo.key;
    ui.name = mediaInfo.data!.name;
    ui.rawPath = mediaInfo.data!.rawPath;
    ui.mediaFileId = mediaInfo.data!.mediaFileId;
    ui.iconClass = mediaInfo.data!.iconClass;
    ui.tag = mediaInfo.data!.tag;
    ui.dataLocation = mediaInfo.data!.dataLocation;
    ui.urlType = mediaInfo.data!.urlType;
  });

  const conversionList: {
    from: RegExp;
    to: (match: string, p1: string) => string;
  }[] = [];

  if (uploadMediaInfoList.length) {
    const mediaUploadResult = await mediaUpload({
      uploadMediaInfoList,
      option: { permission: GameObjectManager.PERMISSION_OWNER_VIEW }
    });

    // メディアKeyの置換
    conversionList.push(
      ...mediaUploadResult.map(mu => ({
        from: new RegExp(
          `"mediaKey": ?"${
            mediaInfoList.find(mi => mi.data!.rawPath === mu.rawPath)!.key
          }"`,
          "g"
        ),
        to: () => `"mediaKey":"${mu.key}"`
      }))
    );
  }

  // TODO User Key の置
  // TODO Actor Key の置換

  if (!otherInfoList.length) return;

  // データを変換していく
  const directImportDataList = otherInfoList.map(info => {
    let str = JSON.stringify(info);
    conversionList.forEach(c => {
      str = str.replaceAll(c.from, c.to);
    });
    return JSON.parse(str);
  });

  await SocketFacade.instance.socketCommunication<
    { importType: ExportLevel; list: StoreData<any>[] },
    void
  >("import-data", {
    importType: exportLevel,
    list: directImportDataList
  });
}
