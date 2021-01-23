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
      commit-text="add"
      @commit="commit()"
      @rollback="rollback()"
      :use-preview="true"
      @preview="preview()"
    />
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { CutInStore } from "@/@types/store-data";
import { Direction } from "@/@types/store-data-optional";
import CutInInfoForm from "@/app/basic/cut-in/CutInInfoForm.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import WindowVue from "@/app/core/window/WindowVue";
import BgmManager from "@/app/basic/cut-in/bgm/BgmManager";
import VueEvent from "@/app/core/decorator/VueEvent";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import AddWindowDelegator, {
  AddWindow
} from "@/app/core/window/AddWindowDelegator";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";

@Component({ components: { ButtonArea, CutInInfoForm } })
export default class CutInAddWindow
  extends Mixins<WindowVue<CutInStore, boolean>>(WindowVue)
  implements AddWindow<CutInStore> {
  private addWindowDelegator = new AddWindowDelegator<CutInStore>(this);

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
  private isUseImage: boolean = false;
  private isUseBgm: boolean = false;
  private fitEdge: "none" | "width" | "height" = "width";
  private imageWidth: number = 300;
  private imageHeight: number = 300;

  @LifeCycle
  public async mounted() {
    await this.addWindowDelegator.init();
    this.inputEnter("input:not([type='button'])", this.commit);
  }

  public isCommitAble(): boolean {
    if (!this.title) return false;
    if (this.isUseImage && !this.imageKey) return false;
    return !(this.isUseBgm && !this.bgmKey);
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

  public setStoreData(data: CutInStore): void {
    this.title = data.title;
    this.tag = data.tag;
    this.isRepeat = data.isRepeat;
    this.fadeIn = data.fadeIn;
    this.fadeOut = data.fadeOut;
    this.start = data.start;
    this.end = data.end;
    this.volume = data.volume;
    this.chatLinkageType = data.chatLinkageType;
    this.chatLinkageTarget = data.chatLinkageTarget;
    this.isStandBy = data.isStandBy;
    this.isForceContinue = data.isForceContinue;
    this.isForceNew = data.isForceNew;
    this.imageKey = data.imageKey;
    this.imageTag = data.imageTag;
    this.direction = data.direction;
    this.bgmKey = data.bgmKey;
    this.bgmTag = data.bgmTag;
    this.isUseImage = data.isUseImage;
    this.isUseBgm = data.isUseBgm;
    this.fitEdge = data.fitEdge;
    this.imageWidth = data.imageWidth;
    this.imageHeight = data.imageHeight;
  }

  public async getStoreDataList(): Promise<DelegateStoreData<CutInStore>[]> {
    return [
      {
        collection: SocketFacade.instance.cutInDataCC().collectionNameSuffix,
        data: {
          title: this.title,
          tag: this.tag,
          isRepeat: this.isRepeat,
          fadeIn: this.fadeIn,
          fadeOut: this.fadeOut,
          start: this.start,
          end: this.end,
          volume: this.volume,
          chatLinkageType: this.chatLinkageType,
          chatLinkageTarget: this.chatLinkageTarget,
          isStandBy: this.isStandBy,
          isForceContinue: this.isForceContinue,
          isForceNew: this.isForceNew,
          imageKey: this.imageKey,
          imageTag: this.imageTag,
          direction: this.direction,
          bgmKey: this.bgmKey,
          bgmTag: this.bgmTag,
          isUseImage: this.isUseImage,
          isUseBgm: this.isUseBgm,
          fitEdge: this.fitEdge,
          imageWidth: this.imageWidth,
          imageHeight: this.imageHeight
        }
      }
    ];
  }

  @VueEvent
  private onChangeMessage(message: string) {
    this.windowInfo.message = message;
  }

  @VueEvent
  private async preview() {
    await BgmManager.instance.callBgm({
      targetKey: null,
      data: (await this.getStoreDataList())[0]!.data
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
