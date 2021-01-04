<template>
  <div class="container" ref="window-container">
    <cut-in-info-form
      :window-key="windowKey"
      v-if="isMounted"
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

    <div class="button-area">
      <ctrl-button @click="commit()">
        <span v-t="'button.modify'"></span>
      </ctrl-button>
      <ctrl-button @click="rollback()">
        <span v-t="'button.reject'"></span>
      </ctrl-button>
      <ctrl-button @click="preview()">
        <span v-t="'button.preview'"></span>
      </ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import LifeCycle from "../../core/decorator/LifeCycle";
import SocketFacade, {
  permissionCheck
} from "../../core/api/app-server/SocketFacade";
import TaskProcessor from "../../core/task/TaskProcessor";
import WindowVue from "../../core/window/WindowVue";
import CtrlButton from "../../core/component/CtrlButton.vue";
import { CutInStore } from "@/@types/store-data";
import NekostoreCollectionController from "../../core/api/app-server/NekostoreCollectionController";
import BgmManager from "./bgm/BgmManager";
import VueEvent from "../../core/decorator/VueEvent";
import { Direction } from "@/@types/store-data-optional";
import CutInInfoForm from "@/app/basic/cut-in/CutInInfoForm.vue";

@Component({
  components: {
    CutInInfoForm,
    CtrlButton
  }
})
export default class CutInEditWindow extends Mixins<
  WindowVue<DataReference, never>
>(WindowVue) {
  private docKey: string = "";
  private isMounted: boolean = false;
  private isProcessed: boolean = false;
  private cc: NekostoreCollectionController<
    CutInStore
  > = SocketFacade.instance.cutInDataCC();

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
    await this.init();
    this.docKey = this.windowInfo.args!.key;
    const data = (await this.cc!.findSingle("key", this.docKey))!.data!;

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

    if (this.windowInfo.status === "window") {
      // 排他チェック
      if (data.exclusionOwner) {
        this.isProcessed = true;
        await this.close();
        return;
      }

      // パーミッションチェック
      if (!permissionCheck(data, "edit")) {
        this.isProcessed = true;
        await this.close();
        return;
      }
    }

    if (this.windowInfo.status === "window") {
      try {
        await this.cc.touchModify([this.docKey]);
      } catch (err) {
        console.warn(err);
        this.isProcessed = true;
        await this.close();
      }
    }
    this.isMounted = true;
  }

  @VueEvent
  private onChangeMessage(message: string) {
    this.windowInfo.message = message;
  }

  private get cutInData(): CutInStore {
    return {
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
    };
  }

  @VueEvent
  private async preview() {
    await BgmManager.instance.callBgm({
      targetKey: null,
      data: this.cutInData
    });
  }

  @VueEvent
  private async commit() {
    const data = (await this.cc!.findSingle("key", this.docKey))!.data!.data!;

    Object.assign(data, this.cutInData);

    await this.cc!.update([
      {
        key: this.docKey,
        data: data
      }
    ]);
    this.isProcessed = true;
    await this.close();
  }

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing2(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value !== this.windowInfo.key) return;
    if (!this.isProcessed) {
      this.isProcessed = true;
      await this.rollback();
    }
  }

  @VueEvent
  private async rollback() {
    try {
      await this.cc!.releaseTouch([this.docKey]);
    } catch (err) {
      // nothing
    }
    if (!this.isProcessed) {
      this.isProcessed = true;
      await this.close();
    }
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
