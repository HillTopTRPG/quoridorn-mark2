import { StoreUseData } from "@/@types/store";
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
  const importRawData: StoreUseData<any>[] = [];
  const jsonList = await readJsonFiles(jsonFileList);
  jsonList
    .filter(j => j.type === "quoridorn-export-data-list")
    .forEach(j => importRawData.push(...(j.data as StoreUseData<any>[])));
  return importRawData;
}

async function getMediaLineage(
  dropList: (string | File)[]
): Promise<{
  mediaInfoList: StoreUseData<MediaInfo>[];
  otherInfoList: StoreUseData<any>[];
  mediaFileList: File[];
}> {
  const removeDropListIdxList: number[] = [];
  const jsonFileList: File[] = [];
  dropList.forEach((d, idx) => {
    if (typeof d === "string" || getExt(d.name) !== "json") return;
    removeDropListIdxList.push(idx);
    jsonFileList.push(d);
  });

  let importRawData: StoreUseData<any>[] = await jsonFileList2JsonList(
    jsonFileList
  );
  console.log(JSON.stringify(importRawData, null, "  "));

  const mediaInfoList: StoreUseData<MediaInfo>[] = [];
  const otherInfoList: StoreUseData<any>[] = [];
  importRawData.forEach(ir => {
    if (ir.collection === "media-list") {
      mediaInfoList.push(ir as StoreUseData<MediaInfo>);
    } else {
      otherInfoList.push(ir);
    }
  });

  const mediaFileList = mediaInfoList.map(
    mi =>
      (dropList.find((d, idx) => {
        const result = typeof d !== "string" && d.name === mi.data!.mediaFileId;
        if (result) removeDropListIdxList.push(idx);
        return result;
      }) as File | undefined) || null
  );

  // jsonファイルはアップロードしない
  removeDropListIdxList
    .sort((idx1, idx2) => {
      if (idx1 > idx2) return -1;
      if (idx1 < idx2) return 1;
      return 0;
    })
    .forEach(idx => dropList.splice(idx, 1));

  const removeIdxList: number[] = [];
  mediaFileList.forEach((mf, idx) => {
    if (!mf) removeIdxList.push(idx);
  });
  removeIdxList.reverse().forEach(idx => {
    mediaFileList.splice(idx, 1);
    mediaInfoList.splice(idx, 1);
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
      from: new RegExp(`mediaId="${mediaInfo.id!}"`),
      to: () => `mediaId="${mu.docId}"`
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

  await SocketFacade.instance.socketCommunication<StoreUseData<any>[], void>(
    "import-data",
    directImportDataList
  );
}
