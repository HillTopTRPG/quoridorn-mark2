<template>
  <div class="container" ref="window-container">
    <div class="operate-box">
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
import WindowVue from "../../core/window/WindowVue";
import LifeCycle from "../../core/decorator/LifeCycle";
import { Task, TaskResult } from "task";
import TaskProcessor from "../../core/task/TaskProcessor";
import MediaItemComponent from "./MediaItemComponent.vue";
import MediaUploadItemComponent from "./MediaUploadItemComponent.vue";
import SocketFacade, {
  permissionCheck
} from "../../core/api/app-server/SocketFacade";
import VueEvent from "../../core/decorator/VueEvent";
import { MediaStore } from "@/@types/store-data";
import TaskManager from "../../core/task/TaskManager";
import SCheck from "../common/components/SCheck.vue";
import GameObjectManager from "../GameObjectManager";
import LanguageManager from "../../../LanguageManager";
import { TabInfo, WindowOpenInfo } from "@/@types/window";
import SimpleTabComponent from "../../core/component/SimpleTabComponent.vue";
import { DeleteFileRequest } from "@/@types/socket";

@Component({
  components: {
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
        text: tag || this.$t("label.non-tag")!.toString()
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
    const msg = MediaListWindow.getDialogMessage("delete-media").replace(
      "$1",
      media.data!.name
    );
    const result = window.confirm(msg);
    if (!result) return;

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
    await TaskManager.instance.ignition<WindowOpenInfo<MediaStore>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "bgm-add-window",
        args: media.data!
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
  @include inline-flex-box(row, flex-end, center);
  height: 2em;
  margin-bottom: 0.5rem;
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
