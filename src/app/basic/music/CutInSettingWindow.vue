<template>
  <div>
    <div class="button-area space-between margin-none">
      <ctrl-button @click="play()">
        <span>{{ $t("button.send") }}</span>
      </ctrl-button>
      <ctrl-button @click="preview">
        <span v-t="'button.preview'"></span>
      </ctrl-button>
    </div>

    <table-component
      :windowInfo="windowInfo"
      :tableIndex="0"
      :status="status"
      :dataList="cutInList"
      keyProp="id"
      v-model="selectedCutInId"
      @doubleClick="play"
      @adjustWidth="adjustWidth"
    >
      <template #contents="{ colDec, data, index }">
        <template v-if="index === 0">
          <span v-if="data.data.chatLinkage > 0" v-t="'label.exist'"></span>
          <span v-else v-t="'label.not-exist'"></span>
        </template>
        <template v-else-if="index === 2">
          <i :class="data | icon"></i>
        </template>
        <template v-else-if="index === 4">{{ data | time }}</template>
        <template v-else-if="index === 5">
          <i class="icon-loop" v-if="data.data.url && data.data.isLoop"></i>
          {{ data | isLoop }}
        </template>
        <template v-else-if="index === 6">{{ data | volume }}</template>
        <template v-else-if="index === 7">{{ data | fade }}</template>
        <template v-else>
          {{ data.data[colDec.target] }}
        </template>
      </template>
    </table-component>

    <div class="button-area">
      <ctrl-button @click="addMusic">
        <span v-t="'button.add'"></span>
      </ctrl-button>
      <ctrl-button @click="editMusic">
        <span v-t="'button.modify'"></span>
      </ctrl-button>
      <ctrl-button @click="copyMusic">
        <span v-t="'button.copy'"></span>
      </ctrl-button>
      <ctrl-button @click="deleteMusic">
        <span v-t="'button.delete'"></span>
      </ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit } from "vue-property-decorator";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import WindowVue from "@/app/core/window/WindowVue";
import TableComponent from "@/app/core/component/table/SimpleTableComponent.vue";
import BgmManager from "@/app/basic/music/BgmManager";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import VueEvent from "@/app/core/decorator/VueEvent";
import { Mixins } from "vue-mixin-decorator";
import { StoreUseData } from "@/@types/store";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import { CutInDeclareInfo } from "@/@types/room";
import { BgmPlayInfo } from "task-info";

@Component({
  components: { TableComponent, CtrlButton },
  filters: {
    icon: (data: StoreUseData<CutInDeclareInfo>) => {
      if (!data.data!.url) return "icon-stop2";
      if (BgmManager.isYoutube(data.data!)) return "icon-youtube2";
      if (BgmManager.isDropbox(data.data!)) return "icon-dropbox";
      return "icon-file-music";
    },
    time: (data: StoreUseData<CutInDeclareInfo>) => {
      if (!data.data!.url) return "-";
      if (data.data!.start && data.data!.end)
        return `${data.data!.start}〜${data.data!.end}`;
      if (data.data!.start) return `${data.data!.start}〜`;
      if (data.data!.end) return `〜${data.data!.end}`;
      return "All";
    },
    isLoop: (data: StoreUseData<CutInDeclareInfo>) =>
      data.data!.url && data.data!.isLoop ? "" : "-",
    volume: (data: StoreUseData<CutInDeclareInfo>) =>
      data.data!.url ? data.data!.volume : "-",
    fade: (data: StoreUseData<CutInDeclareInfo>) => {
      if (!data.data!.url) return "-";
      if (data.data!.fadeIn > 0 && data.data!.fadeOut > 0) return "in/out";
      if (data.data!.fadeIn > 0 && data.data!.fadeOut === 0) return "in";
      if (data.data!.fadeIn === 0 && data.data!.fadeOut > 0) return "out";
      return "-";
    }
  }
})
export default class CutInSettingWindow extends Mixins<
  WindowVue<number, never>
>(WindowVue) {
  private selectedCutInId: string | null = null;
  private cutInDataCC = SocketFacade.instance.cutInDataCC();
  private cutInList: StoreUseData<CutInDeclareInfo>[] = [];

  @LifeCycle
  public async mounted() {
    await this.init();
    this.cutInList = await this.cutInDataCC.getList(true);
  }

  @VueEvent
  private async play(cutInId?: string) {
    const useId = cutInId || this.selectedCutInId;
    if (!useId) return;

    await SocketFacade.instance.sendData<BgmPlayInfo>({
      dataType: "bgm-play",
      data: {
        id: useId
      }
    });
  }

  @Emit("adjustWidth")
  private adjustWidth(totalWidth: number) {
    if (this.windowInfo.declare.minSize)
      this.windowInfo.declare.minSize.widthPx = totalWidth;
    if (this.windowInfo.declare.maxSize)
      this.windowInfo.declare.maxSize.widthPx = totalWidth;
  }

  @VueEvent
  private preview() {
    window.console.log("preview");
  }

  @VueEvent
  private addMusic() {
    window.console.log("addMusic");
  }

  @VueEvent
  private editMusic() {
    window.console.log("editMusic");
  }

  @VueEvent
  private copyMusic() {
    window.console.log("copyMusic");
  }

  @VueEvent
  private deleteMusic() {
    window.console.log("deleteMusic");
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";
</style>
