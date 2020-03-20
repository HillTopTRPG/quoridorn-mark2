<template>
  <div class="container" ref="window-container">
    <input type="file" />
    <simple-tab-component
      class="from-type-tab"
      :windowKey="windowKey"
      :tabList="tabList"
      v-model="currentTabInfo"
    >
    </simple-tab-component>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import WindowVue from "../../core/window/WindowVue";
import LifeCycle from "../../core/decorator/LifeCycle";
import SButton from "@/app/basic/common/components/SButton.vue";
import SCheck from "@/app/basic/common/components/SCheck.vue";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import { TabInfo } from "@/@types/window";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import LanguageManager from "@/LanguageManager";
import { MediaUploadInfo } from "window-info";
import DropBoxManager from "@/app/core/api/drop-box/DropBoxManager";
import VueEvent from "@/app/core/decorator/VueEvent";
@Component({
  components: { SimpleTabComponent, SCheck, SButton }
})
export default class MediaUploadWindow extends Mixins<
  WindowVue<MediaUploadInfo, never>
>(WindowVue) {
  private localFileList: File[] = [];
  private dropBoxAccessKey: string = "";

  private tabList: TabInfo[] = [
    { target: "local", text: "" },
    { target: "dropbox", text: "" }
  ];
  private currentTabInfo: TabInfo | null = this.tabList[0];

  @Watch("dropBoxAccessKey")
  private async onChangeDropBoxAccessKey() {
    DropBoxManager.instance.init(this.dropBoxAccessKey);
    if (this.dropBoxAccessKey) {
      // TODO 疎通確認してから
      const links = await DropBoxManager.instance.getListSharedLinks("");
      window.console.log(JSON.stringify(links, null, "  "));
    }
  }

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
    this.localFileList = this.windowInfo.args!.fileList;
  }

  @VueEvent
  private async commit() {
    // DropBox連携が有効なら活用していく
    if (DropBoxManager.instance.ready) {
      const uploadFunc = async (file: File): Promise<void> => {
        window.console.log(await DropBoxManager.instance.upload(file));
      };
      // 直列の非同期で全部実行する
      await this.localFileList
        .map(file => () => uploadFunc(file))
        .reduce((prev, curr) => prev.then(curr), Promise.resolve());
    }
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
</style>
