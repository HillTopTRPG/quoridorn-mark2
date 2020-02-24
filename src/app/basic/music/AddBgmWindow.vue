<template>
  <div class="container" ref="window">
    <bgm-info-form
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
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import NekostoreCollectionController from "@/app/core/api/app-server/NekostoreCollectionController";
import VueEvent from "@/app/core/decorator/VueEvent";
import BgmInfoForm from "@/app/basic/music/BgmInfoForm.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import WindowVue from "@/app/core/window/WindowVue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import { CutInDeclareInfo } from "@/@types/room";
import BgmManager from "@/app/basic/music/BgmManager";

@Component({
  components: {
    BgmInfoForm,
    CtrlButton
  }
})
export default class AddBgmWindow extends Mixins<WindowVue<void, never>>(
  WindowVue
) {
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
    await this.cc!.addDirect([this.cutInData]);
    await this.close();
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
  private async rollback() {
    await this.close();
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
