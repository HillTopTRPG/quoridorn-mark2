<template>
  <div class="container" ref="window-container">
    <public-memo-info-form
      :windowKey="windowKey"
      :isAdd="true"
      initTabTarget="basic"
      :name.sync="name"
      :otherTextList.sync="otherTextList"
      :imageDocId.sync="imageDocId"
      :imageTag.sync="imageTag"
      :direction.sync="direction"
    />

    <div class="button-area">
      <ctrl-button @click="commit()" :disabled="!imageDocId">
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
import { Direction } from "@/@types/room";
import { StoreUseData } from "@/@types/store";
import { MemoStore } from "@/@types/gameObject";
import { createEmptyStoreUseData } from "@/app/core/utility/Utility";
import PublicMemoInfoForm from "@/app/basic/public-memo/PublicMemoInfoForm.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import WindowVue from "@/app/core/window/WindowVue";
import LanguageManager from "@/LanguageManager";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import VueEvent from "@/app/core/decorator/VueEvent";

const uuid = require("uuid");

@Component({ components: { CtrlButton, PublicMemoInfoForm } })
export default class PublicMemoAddWindow extends Mixins<
  WindowVue<string, boolean>
>(WindowVue) {
  private name: string = LanguageManager.instance.getText("type.public-memo");
  private otherTextList: StoreUseData<MemoStore>[] = [
    createEmptyStoreUseData(uuid.v4(), {
      tab: "",
      text: ""
    })
  ];
  private imageDocId: string | null = null;
  private imageTag: string | null = null;
  private direction: Direction = "none";
  private isMounted: boolean = false;

  @LifeCycle
  public async mounted() {
    await this.init();
    this.imageTag = this.$t("type.public-memo")!.toString();
    this.isMounted = true;
  }

  @VueEvent
  private async commit() {
    const publicMemoId: string = (
      await SocketFacade.instance.publicMemoListCC().addDirect([
        {
          name: this.name,
          iconId: this.imageDocId!,
          imageTag: this.imageTag!,
          direction: this.direction
        }
      ])
    )[0];

    await SocketFacade.instance.memoCC().addDirect(
      this.otherTextList.map(ot => ot.data!),
      this.otherTextList.map(() => ({
        ownerType: "public-memo",
        owner: publicMemoId
      }))
    );
    await this.finally(true);
  }

  @Watch("imageDocId", { immediate: true })
  private onChangeImageDocId() {
    this.windowInfo.message = this.imageDocId
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
