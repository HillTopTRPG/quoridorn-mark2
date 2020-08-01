<template>
  <div class="container" ref="window-container">
    <bgm-info-form
      v-if="isMounted"
      :url.sync="url"
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
import LifeCycle from "../../../core/decorator/LifeCycle";
import SocketFacade, {
  permissionCheck
} from "../../../core/api/app-server/SocketFacade";
import TaskProcessor from "../../../core/task/TaskProcessor";
import WindowVue from "../../../core/window/WindowVue";
import CtrlButton from "../../../core/component/CtrlButton.vue";
import { CutInDeclareInfo } from "../../../../@types/room";
import NekostoreCollectionController from "../../../core/api/app-server/NekostoreCollectionController";
import BgmManager from "./BgmManager";
import { DataReference } from "../../../../@types/data";
import BgmInfoForm from "./BgmInfoForm.vue";
import VueEvent from "../../../core/decorator/VueEvent";

@Component({
  components: {
    BgmInfoForm,
    CtrlButton
  }
})
export default class BgmEditWindow extends Mixins<
  WindowVue<DataReference, never>
>(WindowVue) {
  private docId: string = "";
  private isMounted: boolean = false;
  private isProcessed: boolean = false;
  private cc: NekostoreCollectionController<
    CutInDeclareInfo
  > = SocketFacade.instance.cutInDataCC();

  private url: string = "";
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

  @LifeCycle
  public async mounted() {
    await this.init();
    this.docId = this.windowInfo.args!.docId;
    const data = (await this.cc!.getData(this.docId))!;

    const info = data.data!;
    this.url = info.url;
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
        await this.cc.touchModify([this.docId]);
      } catch (err) {
        console.warn(err);
        this.isProcessed = true;
        await this.close();
      }
    }
    this.isMounted = true;
  }

  private get cutInData(): CutInDeclareInfo {
    return {
      url: this.url,
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
      isForceNew: this.isForceNew
    };
  }

  @VueEvent
  private async preview() {
    await BgmManager.instance.callBgm({
      targetId: null,
      data: this.cutInData
    });
  }

  @VueEvent
  private async commit() {
    const data = (await this.cc!.getData(this.docId))!.data!;

    Object.assign(data, this.cutInData);

    await this.cc!.update([this.docId], [data]);
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
      await this.cc!.releaseTouch([this.docId]);
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
@import "../../../../assets/common";

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
