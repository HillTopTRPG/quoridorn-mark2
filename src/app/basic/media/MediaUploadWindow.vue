<template>
  <div class="container" ref="window-container">
    <div class="operate-box">
      <s-button
        class="s-button"
        icon="price-tags"
        colorStyle="skyblue"
        :disabled="!localResultList.length"
        @hover="hoverEditTags"
        @click="editTags()"
      />
      <s-button
        class="s-button"
        icon="bin"
        colorStyle="skyblue"
        :disabled="!localResultList.length"
        @hover="hoverDeleteAll"
        @click="deleteAll()"
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
    <input type="file" />
    <simple-tab-component
      class="view-type-tab"
      :windowKey="windowKey"
      :tabList="tabList"
      v-model="currentTabInfo"
    >
      <div class="tab-container">
        <media-upload-item-component
          v-for="(resultInfo, idx) in useLocalResultList"
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
import {
  createUploadMediaInfoList,
  mediaUpload,
  UploadMediaInfo
} from "@/app/core/utility/FileUtility";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import BaseInput from "@/app/core/component/BaseInput.vue";
import MediaUploadItemComponent from "@/app/basic/media/MediaUploadItemComponent.vue";
import SCheck from "@/app/basic/common/components/SCheck.vue";
import SButton from "@/app/basic/common/components/SButton.vue";
import LanguageManager from "@/LanguageManager";

@Component({
  components: {
    SButton,
    SCheck,
    MediaUploadItemComponent,
    BaseInput,
    CtrlButton,
    SimpleTabComponent
  }
})
export default class MediaUploadWindow extends Mixins<
  WindowVue<MediaUploadInfo, never>
>(WindowVue) {
  private localResultList: UploadMediaInfo[] = [];
  private dropBoxAccessKey: string = "";
  private searchText: string = "";

  @VueEvent
  private get useLocalResultList(): UploadMediaInfo[] {
    if (!this.searchText) return this.localResultList.concat();
    const regExp = new RegExp(this.searchText);
    return this.localResultList.filter(r => r.name.match(regExp));
  }

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

  @VueEvent
  private hoverEditTags(isHover: boolean) {
    this.settingHoverMessage(isHover, "edit-tag-together");
  }

  @VueEvent
  private hoverDeleteAll(isHover: boolean) {
    this.settingHoverMessage(isHover, "delete-together");
  }

  private settingHoverMessage(isHover: boolean, target: string) {
    this.windowInfo.message = isHover
      ? LanguageManager.instance.getText(
          `media-upload-window.message-list.${target}`
        )
      : "";
  }

  @VueEvent
  private editTags() {
    const msg = LanguageManager.instance.getText(
      "media-upload-window.dialog.input-tag"
    );
    const tag = window.prompt(msg, "");
    window.console.log(tag);
    if (tag === null || tag === undefined) return;
    this.useLocalResultList.forEach(result => {
      result.tag = tag;
    });
  }

  @VueEvent
  private deleteAll() {
    const msg = LanguageManager.instance.getText(
      "media-upload-window.dialog.delete-together"
    );
    const result = window.confirm(msg);
    if (!result) return;

    const idxList: number[] = [];
    this.useLocalResultList.forEach(ur => {
      idxList.unshift(
        this.localResultList.findIndex(
          r => JSON.stringify(ur) === JSON.stringify(r)
        )
      );
    });

    idxList.forEach(idx => {
      this.localResultList.splice(idx, 1);
    });
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
    this.localResultList = await createUploadMediaInfoList(
      this.windowInfo.args!.resultList
    );
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
  private preview(fileInfo: UploadMediaInfo) {
    // TODO プレビュー
    window.console.log("preview", JSON.stringify(fileInfo, null, "  "));
  }

  @VueEvent
  private deleteFile(fileInfo: UploadMediaInfo) {
    const idx = this.localResultList.findIndex(
      ulr => ulr.name === fileInfo.name
    );
    this.localResultList.splice(idx, 1);
  }

  @VueEvent
  private async commit() {
    await mediaUpload(this.localResultList);
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
  height: calc(100% - 6em - 1rem);
  margin-top: 0.5rem;
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
