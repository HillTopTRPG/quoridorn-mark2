<template>
  <div class="container" ref="window-container">
    <cut-in-info-form
      :window-key="windowKey"
      :title.sync="title"
      :tag.sync="tag"
      :isRepeat.sync="isRepeat"
      :fadeIn.sync="fadeIn"
      :fadeOut.sync="fadeOut"
      :start.sync="start"
      :end.sync="end"
      :volume.sync="volume"
      :chatLinkageType.sync="chatLinkageType"
      :chatLinkageTarget.sync="chatLinkageTarget"
      :isStandBy.sync="isStandBy"
      :isForceContinue.sync="isForceContinue"
      :isForceNew.sync="isForceNew"
      :image-key.sync="imageKey"
      :image-tag.sync="imageTag"
      :direction.sync="direction"
      :bgm-key.sync="bgmKey"
      :bgm-tag.sync="bgmTag"
      :is-use-image.sync="isUseImage"
      :is-use-bgm.sync="isUseBgm"
      :fit-edge.sync="fitEdge"
      :image-width.sync="imageWidth"
      :image-height.sync="imageHeight"
      @change-message="onChangeMessage"
    />

    <button-area
      :is-commit-able="isCommitAble()"
      commit-text="modify"
      @commit="commit()"
      @rollback="rollback()"
      :use-preview="true"
      @preview="preview()"
    />
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import { CutInStore } from "@/@types/store-data";
import { Direction } from "@/@types/store-data-optional";
import CutInInfoForm from "@/app/basic/cut-in/CutInInfoForm.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import WindowVue from "@/app/core/window/WindowVue";
import BgmManager from "@/app/basic/cut-in/bgm/BgmManager";
import VueEvent from "@/app/core/decorator/VueEvent";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import EditWindowDelegator, {
  EditWindow
} from "@/app/core/window/EditWindowDelegator";
import { findRequireByKey } from "@/app/core/utility/Utility";

@Component({ components: { ButtonArea, CutInInfoForm } })
export default class CutInEditWindow
  extends Mixins<WindowVue<DataReference, never>>(WindowVue)
  implements EditWindow<CutInStore> {
  private editWindowDelegator = new EditWindowDelegator<CutInStore, "title">(
    this,
    "title"
  );

  private title: string = "";
  private tag: string = "";
  private isRepeat: boolean = false;
  private fadeIn: number = 0;
  private fadeOut: number = 0;
  private start: number = 0;
  private end: number = 0;
  private volume: number = 80;
  private chatLinkageType: "none" | "last" | "regexp" = "none";
  private chatLinkageTarget: string = "";
  private isStandBy: boolean = false;
  private isForceContinue: boolean = false;
  private isForceNew: boolean = false;
  private imageKey: string | null = null;
  private imageTag: string | null = null;
  private direction: Direction = "none";
  private bgmKey: string | null = null;
  private bgmTag: string | null = null;
  private isUseImage: boolean = true;
  private isUseBgm: boolean = true;
  private fitEdge: "none" | "width" | "height" = "none";
  private imageWidth: number = 300;
  private imageHeight: number = 200;

  @LifeCycle
  public async mounted() {
    await this.editWindowDelegator.init();
    this.inputEnter("input:not([type='button'])", this.commit);
  }

  public isCommitAble(): boolean {
    if (!this.title) return false;
    if (this.isUseImage && !this.imageKey) return false;
    if (this.isUseBgm && !this.bgmKey) return false;
    return !this.isDuplicate();
  }

  public isDuplicate(): boolean {
    return this.editWindowDelegator.isDuplicateBasic(this.title);
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

  public pullStoreData(data: StoreData<CutInStore>): void {
    const info = data.data!;
    this.title = info.title;
    this.tag = info.tag;
    this.isRepeat = info.isRepeat;
    this.fadeIn = info.fadeIn;
    this.fadeOut = info.fadeOut;
    this.start = info.start;
    this.end = info.end;
    this.volume = info.volume;
    this.chatLinkageType = info.chatLinkageType;
    this.chatLinkageTarget = info.chatLinkageTarget;
    this.isStandBy = info.isStandBy;
    this.isForceContinue = info.isForceContinue;
    this.isForceNew = info.isForceNew;
    this.imageKey = info.imageKey;
    this.imageTag = info.imageTag;
    this.direction = info.direction;
    this.bgmKey = info.bgmKey;
    this.bgmTag = info.bgmTag;
    this.isUseImage = info.isUseImage;
    this.isUseBgm = info.isUseBgm;
    this.fitEdge = info.fitEdge;
    this.imageWidth = info.imageWidth;
    this.imageHeight = info.imageHeight;
  }

  public async pushStoreData(data: StoreData<CutInStore>): Promise<void> {
    data.data!.title = this.title;
    data.data!.tag = this.tag;
    data.data!.isRepeat = this.isRepeat;
    data.data!.fadeIn = this.fadeIn;
    data.data!.fadeOut = this.fadeOut;
    data.data!.start = this.start;
    data.data!.end = this.end;
    data.data!.volume = this.volume;
    data.data!.chatLinkageType = this.chatLinkageType;
    data.data!.chatLinkageTarget = this.chatLinkageTarget;
    data.data!.isStandBy = this.isStandBy;
    data.data!.isForceContinue = this.isForceContinue;
    data.data!.isForceNew = this.isForceNew;
    data.data!.imageKey = this.imageKey;
    data.data!.imageTag = this.imageTag;
    data.data!.direction = this.direction;
    data.data!.bgmKey = this.bgmKey;
    data.data!.bgmTag = this.bgmTag;
    data.data!.isUseImage = this.isUseImage;
    data.data!.isUseBgm = this.isUseBgm;
    data.data!.fitEdge = this.fitEdge;
    data.data!.imageWidth = this.imageWidth;
    data.data!.imageHeight = this.imageHeight;
  }

  @VueEvent
  private onChangeMessage(message: string) {
    this.windowInfo.message = message;
  }

  @VueEvent
  private async preview() {
    const data = findRequireByKey(
      this.editWindowDelegator.list,
      this.editWindowDelegator.docKey
    );
    await this.pushStoreData(data);
    await BgmManager.instance.callBgm({
      targetKey: null,
      data: data.data!
    });
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.container {
  @include flex-box(column, flex-start, flex-start);
  width: 100%;
  height: 100%;
}

.button-area {
  @include flex-box(row, center, flex-start);
  width: 100%;
}
</style>
