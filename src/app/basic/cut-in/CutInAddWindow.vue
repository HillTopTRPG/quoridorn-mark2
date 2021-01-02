<template>
  <div class="container" ref="window-container">
    <cut-in-info-form
      :window-key="windowKey"
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
      :image-key="imageKey"
      :image-tag="imageTag"
      :direction="direction"
      :bgm-key="bgmKey"
      :bgm-tag="bgmTag"
      :is-use-image="isUseImage"
      :is-use-bgm="isUseBgm"
    />

    <div class="button-area">
      <ctrl-button @click="commit()">
        <span v-t="'button.add'"></span>
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
import LifeCycle from "../../core/decorator/LifeCycle";
import { CutInStore, MediaStore } from "@/@types/store-data";
import WindowVue from "../../core/window/WindowVue";
import CtrlButton from "../../core/component/CtrlButton.vue";
import SocketFacade from "../../core/api/app-server/SocketFacade";
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
export default class CutInAddWindow extends Mixins<
  WindowVue<MediaStore, boolean>
>(WindowVue) {
  private cc: NekostoreCollectionController<
    CutInStore
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
  private imageKey: string | null = null;
  private imageTag: string | null = null;
  private direction: Direction = "none";
  private bgmKey: string | null = null;
  private bgmTag: string | null = null;
  private isUseImage: boolean = false;
  private isUseBgm: boolean = false;

  @LifeCycle
  public async mounted() {
    await this.init();

    const mediaInfo = this.windowInfo.args;
    if (mediaInfo) {
      this.url = mediaInfo.url;
      this.tag = mediaInfo.tag;
      this.title = mediaInfo.name;
    }
  }

  @VueEvent
  private async preview() {
    await BgmManager.instance.callBgm({
      targetKey: null,
      data: this.cutInData
    });
  }

  private get cutInData(): CutInStore {
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
      isForceNew: this.isForceNew,
      imageKey: this.imageKey,
      imageTag: this.imageTag,
      direction: this.direction,
      bgmKey: this.bgmKey,
      bgmTag: this.bgmTag,
      isUseImage: this.isUseImage,
      isUseBgm: this.isUseBgm
    };
  }

  @VueEvent
  private async commit() {
    await this.cc!.addDirect([{ data: this.cutInData }]);
    await this.finally(true);
  }

  @VueEvent
  private async rollback() {
    await this.finally();
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
