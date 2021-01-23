<template>
  <div class="container" ref="window-container">
    <media-url-info-form
      :windowKey="windowKey"
      :name.sync="name"
      :tag.sync="tag"
      :url.sync="url"
    />

    <button-area
      :is-commit-able="isCommitAble()"
      commit-text="add"
      @commit="commit()"
      @rollback="rollback()"
    />
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import { exchangeMediaInfo } from "@/app/core/utility/FileUtility";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import WindowVue from "@/app/core/window/WindowVue";
import VueEvent from "@/app/core/decorator/VueEvent";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import MediaUrlInfoForm from "@/app/basic/media/url/MediaUrlInfoForm.vue";
import { MediaStore } from "@/@types/store-data";
import AddWindowDelegator, {
  AddWindow
} from "@/app/core/window/AddWindowDelegator";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
const uuid = require("uuid");

@Component({ components: { MediaUrlInfoForm, ButtonArea } })
export default class MediaUrlAddWindow
  extends Mixins<WindowVue<MediaStore, boolean>>(WindowVue)
  implements AddWindow<MediaStore> {
  private addWindowDelegator = new AddWindowDelegator<MediaStore>(this);

  private name: string = "";
  private tag: string = "";
  private url: string = "";

  @LifeCycle
  public async mounted() {
    await this.addWindowDelegator.init();
    this.inputEnter("input:not([type='button'])", this.commit);
  }

  public isCommitAble(): boolean {
    return !!this.name && !!this.url;
  }

  @VueEvent
  private async commit() {
    await this.addWindowDelegator.commit();
  }

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing2(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    return await this.addWindowDelegator.windowCloseClosing(task);
  }

  @VueEvent
  private async rollback() {
    await this.addWindowDelegator.rollback();
  }

  public setStoreData(data: MediaStore): void {
    this.name = data.name;
    this.tag = data.tag;
    this.url = data.url;
  }

  public async getStoreDataList(): Promise<DelegateStoreData<MediaStore>[]> {
    const uploadMediaInfoList = await exchangeMediaInfo(
      this.url,
      this.tag,
      this.name
    );
    return uploadMediaInfoList.map(umi => ({
      collection: SocketFacade.instance.mediaCC().collectionNameSuffix,
      data: {
        name: umi.name,
        rawPath: umi.rawPath,
        mediaFileId: umi.mediaFileId,
        tag: umi.tag,
        url: umi.url,
        urlType: umi.urlType,
        iconClass: umi.iconClass,
        imageSrc: umi.imageSrc,
        dataLocation: umi.dataLocation
      }
    }));
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.container {
  @include flex-box(column, stretch, flex-start);
  width: 100%;
  height: 100%;
}
</style>
