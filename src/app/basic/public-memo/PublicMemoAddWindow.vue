<template>
  <div class="container" ref="window-container">
    <public-memo-info-form
      :windowKey="windowKey"
      :isAdd="true"
      initTabTarget="basic"
      :name.sync="name"
      :otherTextList.sync="otherTextList"
      :mediaKey.sync="mediaKey"
      :mediaTag.sync="mediaTag"
      :direction.sync="direction"
    />

    <div class="button-area">
      <ctrl-button @click="commit()" :disabled="!mediaKey">
        <span v-t="'button.modify'"></span>
      </ctrl-button>
      <ctrl-button @click="rollback()">
        <span v-t="'button.reject'"></span>
      </ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { MemoStore } from "@/@types/store-data";
import { createEmptyStoreUseData } from "@/app/core/utility/Utility";
import PublicMemoInfoForm from "@/app/basic/public-memo/PublicMemoInfoForm.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import WindowVue from "@/app/core/window/WindowVue";
import LanguageManager from "@/LanguageManager";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import { Direction } from "@/@types/store-data-optional";
import GameObjectManager from "@/app/basic/GameObjectManager";

const uuid = require("uuid");

@Component({ components: { CtrlButton, PublicMemoInfoForm } })
export default class PublicMemoAddWindow extends Mixins<
  WindowVue<string, boolean>
>(WindowVue) {
  private name: string = LanguageManager.instance.getText("type.public-memo");
  private otherTextList: StoreData<MemoStore>[] = [
    createEmptyStoreUseData(uuid.v4(), {
      tab: "",
      type: "normal",
      text: ""
    })
  ];
  private mediaKey: string | null = null;
  private mediaTag: string | null = null;
  private direction: Direction = "none";
  private isMounted: boolean = false;
  private mediaList = GameObjectManager.instance.mediaList;

  @LifeCycle
  public async mounted() {
    await this.init();
    this.mediaTag = this.$t("type.public-memo")!.toString();
    this.isMounted = true;
    const media = this.mediaList[this.mediaList.length > 1 ? 1 : 0];
    this.mediaKey = media.key;
    this.mediaTag = media.data!.tag;
  }

  @VueEvent
  private async commit() {
    const publicMemoKey: string = (
      await SocketFacade.instance.publicMemoListCC().addDirect([
        {
          data: {
            name: this.name,
            mediaKey: this.mediaKey!,
            mediaTag: this.mediaTag!,
            direction: this.direction
          }
        }
      ])
    )[0];

    await SocketFacade.instance.memoCC().addDirect(
      this.otherTextList.map(data => ({
        ownerType: "public-memo-list",
        owner: publicMemoKey,
        data: data.data!
      }))
    );
    await this.finally(true);
  }

  @Watch("mediaKey", { immediate: true })
  private onChangeImageDocKey() {
    this.windowInfo.message = this.mediaKey
      ? ""
      : this.$t(`${this.windowInfo.type}.message-list.select-icon`).toString();
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
  @include flex-box(column, stretch, flex-start);
  width: 100%;
  height: 100%;
}

.public-memo-info-form {
  flex: 1;
}
</style>
