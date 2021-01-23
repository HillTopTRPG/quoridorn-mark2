<template>
  <div class="container" ref="window-container">
    <div class="operate-box">
      <ctrl-button @click="registerUrl()" classes="register-button">
        <span v-t="'media-url-add-window.window-title'"></span>
      </ctrl-button>
      <s-check
        class="view-check"
        v-model="isViewThumbnail"
        colorStyle="skyblue"
        c-icon="image"
        :c-label="$t('media-list-window.label.thumbnail')"
        n-icon="list2"
        :n-label="$t('media-list-window.label.list')"
        @hover="onHoverThumbnailView"
      />
      <input
        type="text"
        class="search-name"
        :value="searchText"
        @input="searchText = $event.target.value"
        :placeholder="$t('label.search-name-box')"
        @keydown.enter.prevent.stop
        @keyup.enter.prevent.stop
        @keydown.229.prevent.stop
        @keyup.229.prevent.stop
      />
    </div>
    <simple-tab-component
      class="tag-tab"
      :windowKey="windowKey"
      :tabList="tabList"
      v-model="currentTabInfo"
    >
      <div class="tab-container">
        <media-item-component
          v-for="media in useMediaList"
          :key="media.key"
          :media="media"
          :isViewThumbnail="isViewThumbnail"
          @preview="preview(media)"
          @edit="editMedia(media)"
          @chmod="chmodMedia(media)"
          @delete="deleteMedia(media)"
          @addCutIn="addCutIn(media)"
        />
      </div>
    </simple-tab-component>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import { CutInStore, MediaStore } from "@/@types/store-data";
import { TabInfo, WindowOpenInfo } from "@/@types/window";
import { DeleteFileRequest } from "@/@types/socket";
import { questionDialog } from "@/app/core/utility/Utility";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import App from "@/views/App.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import MediaItemComponent from "@/app/basic/media/MediaItemComponent.vue";
import MediaUploadItemComponent from "@/app/basic/media/MediaUploadItemComponent.vue";
import SocketFacade, {
  permissionCheck
} from "@/app/core/api/app-server/SocketFacade";
import VueEvent from "@/app/core/decorator/VueEvent";
import TaskManager from "@/app/core/task/TaskManager";
import WindowVue from "@/app/core/window/WindowVue";
import SCheck from "@/app/basic/common/components/SCheck.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import LanguageManager from "@/LanguageManager";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import { Direction } from "@/@types/store-data-optional";

@Component({
  components: {
    CtrlButton,
    SCheck,
    MediaItemComponent,
    MediaUploadItemComponent,
    SimpleTabComponent
  }
})
export default class MediaListWindow extends Mixins<WindowVue<void, never>>(
  WindowVue
) {
  private mediaList = GameObjectManager.instance.mediaList;
  private useMediaList: StoreData<MediaStore>[] = [];
  private mediaCC = SocketFacade.instance.mediaCC();

  private tabList: TabInfo[] = [];
  private currentTabInfo: TabInfo | null = null;

  private isViewThumbnail: boolean = true;
  private searchText: string = "";

  @LifeCycle
  private async mounted() {
    await this.init();
  }

  @LifeCycle
  private created() {
    this.createTabInfoList();
  }

  @VueEvent
  private registerUrl() {
    App.openSimpleWindow("media-url-add-window");
  }

  @Watch("mediaList", { deep: true })
  private onChangeMediaList() {
    const beforeTab = JSON.stringify(this.currentTabInfo);
    this.createTabInfoList();
    const afterTab = JSON.stringify(this.currentTabInfo);
    if (beforeTab === afterTab) this.setUseMediaList();
  }

  @Watch("currentTabInfo")
  private onChangeCurrentTabInfo() {
    this.setUseMediaList();
  }

  @Watch("searchText")
  private onChangeSearchText() {
    this.setUseMediaList();
  }

  private setUseMediaList() {
    const regExp = this.searchText ? new RegExp(this.searchText) : null;
    this.useMediaList = this.currentTabInfo
      ? this.mediaList.filter(m => {
          if (this.currentTabInfo!.target !== m.data!.tag) return false;
          if (regExp) {
            const name = m.data!.name;
            if (!name.match(regExp)) return false;
          }
          return permissionCheck(m, "view");
        })
      : [];
  }

  @TaskProcessor("language-change-finished")
  private async languageChangeFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    this.createTabInfoList();
    task.resolve();
  }

  private createTabInfoList() {
    this.windowInfo.message = this.$t(
      "media-list-window.message-list.how-to-upload"
    ).toString();
    this.tabList = this.mediaList
      .filter(m => permissionCheck(m, "view"))
      .map(m => m.data!.tag)
      .filter((tag, index, list) => list.indexOf(tag) === index)
      .map((tag, index) => ({
        key: index.toString(),
        target: tag,
        text: tag || this.$t("label.non-tag")!.toString(),
        isDisabled: false
      }));
    if (!this.currentTabInfo) {
      this.currentTabInfo = this.tabList[0];
      return;
    }

    const index = this.tabList.findIndex(
      t => JSON.stringify(t) === JSON.stringify(this.currentTabInfo)
    );
    if (index === -1) this.currentTabInfo = this.tabList[0];
  }

  private static getDialogMessage(target: string) {
    const msgTarget = "media-list-window.dialog." + target;
    return LanguageManager.instance.getText(msgTarget);
  }

  @VueEvent
  private async editMedia(media: StoreData<MediaStore>) {
    console.log("editMedia", media.data!.dataLocation);
    if (media.data!.dataLocation === "direct") {
      await TaskManager.instance.ignition<WindowOpenInfo<DataReference>, never>(
        {
          type: "window-open",
          owner: "Quoridorn",
          value: {
            type: "media-url-edit-window",
            args: {
              type: media.collection,
              key: media.key
            }
          }
        }
      );
    }
  }

  @VueEvent
  private async chmodMedia(media: StoreData<MediaStore>) {
    await TaskManager.instance.ignition<WindowOpenInfo<DataReference>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "chmod-window",
        args: {
          type: media.collection,
          key: media.key
        }
      }
    });
  }

  @VueEvent
  private async deleteMedia(media: StoreData<MediaStore>) {
    const text = MediaListWindow.getDialogMessage("delete-media").replace(
      "$1",
      media.data!.name
    );
    const confirm = await questionDialog({
      title: this.$t("button.delete").toString(),
      text,
      confirmButtonText: this.$t("button.delete").toString(),
      cancelButtonText: this.$t("button.reject").toString()
    });
    if (!confirm) return;

    try {
      await this.mediaCC.deletePackage([media.key]);
    } catch (err) {
      // TODO error message.
      return;
    }

    await SocketFacade.instance.socketCommunication<DeleteFileRequest, void>(
      "delete-file",
      { urlList: [media.data!.url] }
    );
  }

  private setHoverWindowMessage(isHover: boolean, messageType: string) {
    this.windowInfo.message = isHover
      ? this.$t(
          `${this.windowInfo.type}.message-list.${messageType}`
        )!.toString()
      : "";
  }

  @VueEvent
  private async addCutIn(media: StoreData<MediaStore>) {
    const cutInData: CutInStore = {
      title: media.data!.name,
      tag: media.data!.tag,
      isRepeat: false,
      fadeIn: 0,
      fadeOut: 0,
      start: 0,
      end: 0,
      volume: 80,
      chatLinkageType: "none",
      chatLinkageTarget: "",
      isStandBy: false,
      isForceNew: false,
      isForceContinue: false,
      imageKey: null,
      imageTag: null,
      direction: "none",
      bgmKey: null,
      bgmTag: null,
      isUseImage: false,
      isUseBgm: false,
      fitEdge: "width",
      imageWidth: 300,
      imageHeight: 300
    };
    const urlType = media.data!.urlType;
    if (urlType === "youtube" || urlType === "music") {
      cutInData.isUseBgm = true;
      cutInData.bgmKey = media.key;
      cutInData.bgmTag = media.data!.tag;
    }
    if (urlType === "image") {
      cutInData.isUseImage = true;
      cutInData.imageKey = media.key;
      cutInData.imageTag = media.data!.tag;
    }
    await TaskManager.instance.ignition<WindowOpenInfo<CutInStore>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "cut-in-add-window",
        args: cutInData
      }
    });
  }

  @VueEvent
  private onHoverThumbnailView(isHover: boolean) {
    this.setHoverWindowMessage(isHover, "choose-view-mode");
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.container {
  @include flex-box(column, stretch, center);
  width: 100%;
  height: 100%;
}

.operate-box {
  @include inline-flex-box(row, space-between, center);
  height: 2em;
  margin-bottom: 0.5rem;

  .register-button {
    margin-right: auto;
  }
}

.search-name {
  @include inline-flex-box(row, flex-start, center);
  font-size: inherit;
  height: 2em;
  min-height: 2em;
}

.tag-tab {
  @include flex-box(column, stretch, flex-start);
  height: calc(100% - 2em - 0.5rem);
}

.tab-container {
  @include inline-flex-box(column, stretch, flex-start);
  flex: 1;
  border: 1px solid gray;
  overflow-y: scroll;
  margin-top: -1px;
  padding: 0.5rem;
}
</style>
