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
          v-for="(resultInfo, index) in useLocalResultList"
          :key="index"
          :resultInfo="resultInfo"
          @preview="preview(resultInfo)"
          @delete="deleteFile(resultInfo)"
        />
      </div>
    </simple-tab-component>

    <button-area
      :is-commit-able="true"
      commit-text="upload"
      @commit="commit()"
      @rollback="rollback()"
    />
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import { MediaUploadInfo } from "@/@types/room";
import { TabInfo } from "@/@types/window";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { UploadMediaInfo } from "@/@types/socket";
import { questionDialog } from "@/app/core/utility/Utility";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import MediaUploadItemComponent from "@/app/basic/media/MediaUploadItemComponent.vue";
import {
  mediaUpload,
  raw2UploadMediaInfoList
} from "@/app/core/utility/FileUtility";
import SButton from "@/app/basic/common/components/SButton.vue";
import BaseInput from "@/app/core/component/BaseInput.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import DropBoxManager from "@/app/core/api/drop-box/DropBoxManager";
import WindowVue from "@/app/core/window/WindowVue";
import SCheck from "@/app/basic/common/components/SCheck.vue";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";

@Component({
  components: {
    ButtonArea,
    SButton,
    SCheck,
    MediaUploadItemComponent,
    BaseInput,
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
    { key: "1", target: "local", text: "", isDisabled: false },
    { key: "2", target: "dropbox", text: "", isDisabled: false }
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
      ? this.$t(`media-upload-window.message-list.${target}`)!.toString()
      : "";
  }

  @VueEvent
  private editTags() {
    const msg = this.$t("media-upload-window.dialog.input-tag")!.toString();
    const tag = window.prompt(msg, "");
    console.log(tag);
    if (tag === null || tag === undefined) return;
    this.useLocalResultList.forEach(result => {
      result.tag = tag;
    });
  }

  @VueEvent
  private async deleteAll() {
    const text = this.$t(
      "media-upload-window.dialog.delete-together"
    )!.toString();
    const confirm = await questionDialog({
      title: this.$t("button.delete").toString(),
      text,
      confirmButtonText: this.$t("button.delete").toString(),
      cancelButtonText: this.$t("button.reject").toString()
    });
    if (!confirm) return;

    const indexList: number[] = [];
    this.useLocalResultList.forEach(ur => {
      indexList.unshift(
        this.localResultList.findIndex(
          r => JSON.stringify(ur) === JSON.stringify(r)
        )
      );
    });

    indexList.forEach(index => {
      this.localResultList.splice(index, 1);
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
    const rawList: (string | File)[] = this.windowInfo.args!.resultList;
    this.localResultList = await raw2UploadMediaInfoList(rawList);
  }

  @Watch("dropBoxAccessKey")
  private async onChangeDropBoxAccessKey() {
    DropBoxManager.instance.init(this.dropBoxAccessKey);
    if (this.dropBoxAccessKey) {
      // TODO 疎通確認してから
      const links = await DropBoxManager.instance.getListSharedLinks("");
      console.log(JSON.stringify(links, null, "  "));
    }
  }

  @VueEvent
  private preview(fileInfo: UploadMediaInfo) {
    // TODO プレビュー
    console.log("preview", JSON.stringify(fileInfo, null, "  "));
  }

  @VueEvent
  private deleteFile(fileInfo: UploadMediaInfo) {
    const index = this.localResultList.findIndex(
      ulr => ulr.name === fileInfo.name
    );
    this.localResultList.splice(index, 1);
  }

  @VueEvent
  private async commit() {
    console.log("MediaUploadWindow");
    await mediaUpload({
      uploadMediaInfoList: this.localResultList,
      option: { permission: GameObjectManager.PERMISSION_OWNER_VIEW }
    });
    await this.close();
  }

  @VueEvent
  private async rollback() {
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
