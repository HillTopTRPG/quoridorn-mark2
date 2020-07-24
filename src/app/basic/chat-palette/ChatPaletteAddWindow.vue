<template>
  <div class="container" ref="window-container">
    <chat-palette-info-form
      :windowKey="windowKey"
      :isAdd="true"
      :name.sync="name"
      :chatFontColorType.sync="chatFontColorType"
      :chatFontColor.sync="chatFontColor"
      :actorId.sync="actorId"
      :sceneObjectId.sync="sceneObjectId"
      :statusId.sync="statusId"
      :isSecret.sync="isSecret"
      :paletteText.sync="paletteText"
    />

    <div class="button-area">
      <ctrl-button @click="commit()" :disabled="!name">
        <span v-t="'button.add'"></span>
      </ctrl-button>
      <ctrl-button @click="rollback()">
        <span v-t="'button.reject'"></span>
      </ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import LifeCycle from "../../core/decorator/LifeCycle";
import WindowVue from "../../core/window/WindowVue";
import CtrlButton from "../../core/component/CtrlButton.vue";
import SocketFacade from "../../core/api/app-server/SocketFacade";
import ChatPaletteInfoForm from "./ChatPaletteInfoForm.vue";
import VueEvent from "../../core/decorator/VueEvent";

@Component({ components: { CtrlButton, ChatPaletteInfoForm } })
export default class ChatPaletteAddWindow extends Mixins<
  WindowVue<string, never>
>(WindowVue) {
  private isMounted: boolean = false;
  private chatPaletteListCC = SocketFacade.instance.chatPaletteListCC();

  private name: string = "new";
  private chatFontColorType: "owner" | "original" = "owner";
  private chatFontColor: string = "#000000";
  private actorId: string | null = null;
  private sceneObjectId: string | null = null;
  private statusId: string | null = null;
  private isSecret: boolean = false;
  private paletteText: string = "";

  @LifeCycle
  public async mounted() {
    await this.init();
    this.isMounted = true;
  }

  @VueEvent
  private async commit() {
    await this.chatPaletteListCC!.addDirect([
      {
        name: this.name,
        chatFontColorType: this.chatFontColorType,
        chatFontColor: this.chatFontColor,
        actorId: this.actorId,
        sceneObjectId: this.sceneObjectId,
        targetId: null, // TODO 入力項目を作成
        outputTabId: null, // TODO 入力項目を作成
        statusId: this.statusId,
        system: null, // TODO 入力項目を作成
        isSecret: this.isSecret,
        paletteText: this.paletteText
      }
    ]);
    await this.close();
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
  @include flex-box(column, stretch, flex-start);
  width: 100%;
  height: 100%;
}
</style>
