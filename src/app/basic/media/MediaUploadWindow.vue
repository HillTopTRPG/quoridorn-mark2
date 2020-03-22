<template>
  <div class="container" ref="window-container">
    <input type="file" />
    <simple-tab-component
      class="view-type-tab"
      :windowKey="windowKey"
      :tabList="tabList"
      v-model="currentTabInfo"
    >
      <div class="tab-container">
        <media-upload-item-component
          v-for="(resultInfo, idx) in localResultList"
          :key="idx"
          :resultInfo="resultInfo"
          @preview="preview(resultInfo)"
          @delete="deleteFile(resultInfo)"
        />
      </div>
    </simple-tab-component>

    <div class="button-area">
      <ctrl-button @click="commit()">
        <span v-t="'button.upload'"></span>
      </ctrl-button>
      <ctrl-button @click="rollback()">
        <span v-t="'button.reject'"></span>
      </ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import WindowVue from "../../core/window/WindowVue";
import LifeCycle from "../../core/decorator/LifeCycle";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import { TabInfo } from "@/@types/window";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import { MediaUploadInfo } from "window-info";
import DropBoxManager from "@/app/core/api/drop-box/DropBoxManager";
import VueEvent from "@/app/core/decorator/VueEvent";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import { UploadFileRequest } from "@/@types/socket";
import { extname, file2ArrayBuffer } from "@/app/core/utility/FileUtility";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import BaseInput from "@/app/core/component/BaseInput.vue";
import MediaUploadItemComponent from "@/app/basic/media/MediaUploadItemComponent.vue";
import { MediaInfo } from "@/@types/room";
import { getYoutubeThunbnail } from "@/app/basic/cut-in/bgm/YoutubeManager";
import GameObjectManager from "@/app/basic/GameObjectManager";

export type ResultInfo = {
  name: string;
  type: string;
  iconClass: string;
  imageSrc: string | ArrayBuffer | null;
  tag: string;
  src: File | string;
};

@Component({
  components: {
    MediaUploadItemComponent,
    BaseInput,
    CtrlButton,
    SimpleTabComponent
  }
})
export default class MediaUploadWindow extends Mixins<
  WindowVue<MediaUploadInfo, never>
>(WindowVue) {
  private localResultList: ResultInfo[] = [];
  private dropBoxAccessKey: string = "";
  private mediaCC = SocketFacade.instance.mediaCC();

  private tabList: TabInfo[] = [
    { target: "local", text: "" },
    { target: "dropbox", text: "" }
  ];
  private currentTabInfo: TabInfo | null = this.tabList[0];

  @TaskProcessor("language-change-finished")
  private async languageChangeFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    this.createTabInfoList();
    task.resolve();
  }

  @LifeCycle
  private async created() {
    this.createTabInfoList();
  }

  private createTabInfoList() {
    this.tabList.forEach(t => {
      t.text = this.$t(`label.${t.target}`)!.toString();
    });
  }

  @LifeCycle
  private async mounted() {
    await this.init();
    this.localResultList = this.windowInfo.args!.resultList.map(src => {
      if (typeof src === "string") {
        let iconClass = "icon-sphere";
        let imageSrc: string | null = null;
        let type = "url";
        // URL
        if (src.indexOf("youtube") > -1) {
          iconClass = "icon-youtube2";
          imageSrc = getYoutubeThunbnail(src);
          type = "youtube";
        }
        return {
          name: "",
          tag: "",
          type,
          iconClass,
          imageSrc,
          src
        };
      } else {
        const ext = extname(src.name);
        let type: string = "(unknown)";
        let iconClass: string = "icon-warning";
        const fr = new FileReader();
        switch (ext) {
          case "png":
          case "gif":
          case "jpg":
          case "jpeg":
            type = "image";
            iconClass = "icon-image";
            fr.readAsDataURL(src);
            break;
          case "mp3":
            type = "music";
            iconClass = "icon-music";
            break;
          case "json":
          case "yaml":
            type = "setting";
            iconClass = "icon-text";
            break;
          default:
        }
        const result: ResultInfo = {
          name: src.name,
          tag: "",
          type,
          iconClass,
          imageSrc: null,
          src
        };
        fr.onload = () => {
          result.imageSrc = fr.result as string;
        };
        return result;
      }
    });
  }

  @Watch("dropBoxAccessKey")
  private async onChangeDropBoxAccessKey() {
    DropBoxManager.instance.init(this.dropBoxAccessKey);
    if (this.dropBoxAccessKey) {
      // TODO 疎通確認してから
      const links = await DropBoxManager.instance.getListSharedLinks("");
      window.console.log(JSON.stringify(links, null, "  "));
    }
  }

  @VueEvent
  private preview(fileInfo: ResultInfo) {
    // TODO プレビュー
    window.console.log("preview", JSON.stringify(fileInfo, null, "  "));
  }

  @VueEvent
  private deleteFile(fileInfo: ResultInfo) {
    // TODO プレビュー
    window.console.log("deleteFile", JSON.stringify(fileInfo, null, "  "));
  }

  @VueEvent
  private async commit() {
    // DropBox連携が有効なら活用していく
    if (DropBoxManager.instance.ready) {
      const uploadFunc = async (fileInfo: ResultInfo): Promise<void> => {
        const src = fileInfo.src;
        if (typeof src === "string") return;
        window.console.log(await DropBoxManager.instance.upload(src));
      };
      // 直列の非同期で全部実行する
      await this.localResultList
        .map(fileInfo => () => uploadFunc(fileInfo))
        .reduce((prev, curr) => prev.then(curr), Promise.resolve());
    }

    const uploadResultInfoList: UploadFileRequest = [];
    const createUploadResultInfo = async (
      resultInfo: ResultInfo
    ): Promise<void> => {
      const src = resultInfo.src;
      uploadResultInfoList.push({
        name: resultInfo.name,
        src: await file2ArrayBuffer(src as File)
      });
    };
    // 直列の非同期で全部実行する
    await this.localResultList
      .filter(resultInfo => typeof resultInfo.src !== "string")
      .map(resultInfo => () => createUploadResultInfo(resultInfo))
      .reduce((prev, curr) => prev.then(curr), Promise.resolve());

    window.console.log("## UPLOAD START ####################################");

    const urlList = await SocketFacade.instance.socketCommunication<
      UploadFileRequest,
      string[]
    >("upload-file", uploadResultInfoList);
    window.console.log(urlList);

    let idx = 0;
    const mediaInfoList: MediaInfo[] = this.localResultList.map(
      (result: ResultInfo) => {
        const src = result.src;
        const url = typeof src === "string" ? src : urlList[idx++];
        return {
          url,
          name: result.name,
          type: result.type,
          tag: result.tag
        };
      }
    );
    window.console.log(JSON.stringify(mediaInfoList, null, "  "));
    window.console.log("## UPLOAD END ####################################");
    await this.mediaCC.addDirect(mediaInfoList, {
      permission: GameObjectManager.PERMISSION_OWNER_VIEW
    });
    await this.close();
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.container {
  @include flex-box(column, stretch, center);
  position: relative;
  width: 100%;
  height: 100%;
}

.view-type-tab {
  @include flex-box(column, stretch, flex-start);
  height: calc(100% - 4em - 0.5rem);
}

.tab-container {
  @include inline-flex-box(column, flex-start, flex-start);
  flex: 1;
  border: 1px solid gray;
  overflow-y: scroll;
  margin-top: -1px;
  padding: 0.5rem;
}
</style>
