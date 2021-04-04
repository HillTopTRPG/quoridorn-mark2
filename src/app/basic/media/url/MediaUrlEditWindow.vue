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
      commit-text="modify"
      @commit="commit()"
      @rollback="rollback()"
    />
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import { MediaStore } from "@/@types/store-data";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import WindowVue from "@/app/core/window/WindowVue";
import VueEvent from "@/app/core/decorator/VueEvent";
import { exchangeMediaInfo } from "@/app/core/utility/FileUtility";
import MediaUrlInfoForm from "@/app/basic/media/url/MediaUrlInfoForm.vue";
import EditWindowDelegator, {
  EditWindow
} from "@/app/core/window/EditWindowDelegator";

@Component({ components: { MediaUrlInfoForm, ButtonArea } })
export default class MediaUrlEditWindow
  extends Mixins<WindowVue<DataReference, never>>(WindowVue)
  implements EditWindow<MediaStore> {
  private editWindowDelegator = new EditWindowDelegator<MediaStore, "name">(
    this,
    "name"
  );

  private name: string = "";
  private tag: string = "";
  private url: string = "";

  @LifeCycle
  public async mounted() {
    await this.editWindowDelegator.init();
    this.inputEnter("input:not([type='button'])", this.commit);
  }

  public isCommitAble(): boolean {
    return !!this.name && !!this.url && !this.isDuplicate();
  }

  public isDuplicate(): boolean {
    return this.editWindowDelegator.isDuplicateBasic(this.name);
  }

  @Watch("name")
  private onChangeIsDuplicate() {
    this.windowInfo.message = this.editWindowDelegator.onChangeIsDuplicateBasic();
  }

  @VueEvent
  private async commit() {
    await this.editWindowDelegator.commit();
  }

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing2(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    return await this.editWindowDelegator.windowCloseClosing(task);
  }

  @VueEvent
  private async rollback() {
    await this.editWindowDelegator.rollback();
  }

  public pullStoreData(data: StoreData<MediaStore>): void {
    this.name = data.data!.name;
    this.tag = data.data!.tag;
    this.url = data.data!.url;
  }

  public async pushStoreData(data: StoreData<MediaStore>): Promise<void> {
    const uploadMediaInfoList = await exchangeMediaInfo(
      this.url,
      this.tag,
      this.name
    );
    const uploadMediaInfo = uploadMediaInfoList[0];
    data.data!.tag = this.tag;
    data.data!.name = this.name;
    data.data!.url = this.url;
    data.data!.urlType = uploadMediaInfo.urlType;
    data.data!.iconClass = uploadMediaInfo.iconClass;
    data.data!.rawPath = uploadMediaInfo.rawPath;
    data.data!.imageSrc = uploadMediaInfo.imageSrc;
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
