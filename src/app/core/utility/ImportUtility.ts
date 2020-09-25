import { StoreObj } from "@/@types/store";
import { MediaInfo } from "@/@types/room";
import {
  mediaUpload,
  raw2UploadMediaInfoList,
  readJsonFiles
} from "@/app/core/utility/FileUtility";
import { getExt } from "@/app/core/utility/PrimaryDataUtility";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { UploadMediaInfo } from "@/@types/socket";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";

async function jsonFileList2JsonList(jsonFileList: File[]) {
  const importRawData: StoreObj<any>[] = [];
  const jsonList = await readJsonFiles(jsonFileList);
  jsonList
    .filter(j => j.type === "quoridorn-export-data-list")
    .forEach(j => importRawData.push(...(j.data as StoreObj<any>[])));
  return importRawData;
}

async function getMediaLineage(
  dropList: (string | File)[]
): Promise<{
  mediaInfoList: StoreObj<MediaInfo>[];
  otherInfoList: StoreObj<any>[];
  mediaFileList: File[];
}> {
  const removeDropListIndexList: number[] = [];
  const jsonFileList: File[] = [];
  dropList.forEach((d, index) => {
    if (typeof d === "string" || getExt(d.name) !== "json") return;
    removeDropListIndexList.push(index);
    jsonFileList.push(d);
  });

  let importRawData: StoreObj<any>[] = await jsonFileList2JsonList(
    jsonFileList
  );
  console.log(JSON.stringify(importRawData, null, "  "));

  const mediaInfoList: StoreObj<MediaInfo>[] = [];
  const otherInfoList: StoreObj<any>[] = [];
  importRawData.forEach(ir => {
    if (ir.collection === "media-list") {
      mediaInfoList.push(ir as StoreObj<MediaInfo>);
    } else {
      otherInfoList.push(ir);
    }
  });

  const mediaFileList = mediaInfoList.map(
    mi =>
      (dropList.find((d, index) => {
        const result = typeof d !== "string" && d.name === mi.data!.mediaFileId;
        if (result) removeDropListIndexList.push(index);
        return result;
      }) as File | undefined) || null
  );

  // jsonファイルはアップロードしない
  removeDropListIndexList
    .sort((index1, index2) => {
      if (index1 > index2) return -1;
      if (index1 < index2) return 1;
      return 0;
    })
    .forEach(index => dropList.splice(index, 1));

  const removeIndexList: number[] = [];
  mediaFileList.forEach((mf, index) => {
    if (!mf) removeIndexList.push(index);
  });
  removeIndexList.reverse().forEach(index => {
    mediaFileList.splice(index, 1);
    mediaInfoList.splice(index, 1);
  });

  return {
    mediaInfoList,
    otherInfoList,
    mediaFileList: mediaFileList as File[]
  };
}

export async function importInjection(dropList: (string | File)[]) {
  const { mediaInfoList, otherInfoList, mediaFileList } = await getMediaLineage(
    dropList
  );
  const uploadMediaInfoList: UploadMediaInfo[] = await raw2UploadMediaInfoList(
    mediaFileList
  );
  uploadMediaInfoList.forEach(ui => {
    const mediaInfo = mediaInfoList.find(
      mi => mi.data!.imageSrc === ui.imageSrc
    )!;
    ui.name = mediaInfo.data!.name;
    ui.rawPath = mediaInfo.data!.rawPath;
    ui.mediaFileId = mediaInfo.data!.mediaFileId;
    ui.iconClass = mediaInfo.data!.iconClass;
    ui.tag = mediaInfo.data!.tag;
    ui.dataLocation = mediaInfo.data!.dataLocation;
    ui.urlType = mediaInfo.data!.urlType;
  });
  const mediaUploadResult = await mediaUpload({
    uploadMediaInfoList,
    option: { permission: GameObjectManager.PERMISSION_OWNER_VIEW }
  });

  const conversionList: {
    from: RegExp;
    to: (match: string, p1: string) => string;
  }[] = [];
  mediaUploadResult.forEach(mu => {
    const mediaInfo = mediaInfoList.find(
      mi => mi.data!.rawPath === mu.rawPath
    )!;
    conversionList.push({
      from: new RegExp(`mediaKey="${mediaInfo.key}"`),
      to: () => `mediaKey="${mu.key}"`
    });
  });

  // データを変換していく
  const directImportDataList = otherInfoList.map(info => {
    let str = JSON.stringify(info);
    conversionList.forEach(c => {
      str = str.replace(c.from, c.to);
    });
    return JSON.parse(str);
  });

  await SocketFacade.instance.socketCommunication<StoreObj<any>[], void>(
    "import-data",
    directImportDataList
  );
}
