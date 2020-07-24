<template>
  <div class="container" ref="window-container">
    <chat-palette-info-form
      :windowKey="windowKey"
      :isAdd="false"
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
      <ctrl-button @click="commit()">
        <span v-t="'button.modify'"></span>
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
import { Task, TaskResult } from "task";
import { DataReference } from "@/@types/data";
import { BackgroundSize, Direction } from "@/@types/room";
import GameObjectManager from "@/app/basic/GameObjectManager";
import SocketFacade, {
  permissionCheck
} from "@/app/core/api/app-server/SocketFacade";
import { SceneObject } from "@/@types/gameObject";
import NekostoreCollectionController from "@/app/core/api/app-server/NekostoreCollectionController";
import VueEvent from "@/app/core/decorator/VueEvent";
import ChitInfoForm from "@/app/basic/object/chit/ChitInfoForm.vue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import WindowVue from "@/app/core/window/WindowVue";
import ChatPaletteInfoForm from "@/app/basic/chat-palette/ChatPaletteInfoForm.vue";

@Component({
  components: {
    ChatPaletteInfoForm,
    ChitInfoForm,
    CtrlButton
  }
})
export default class ChatPaletteEditWindow extends Mixins<
  WindowVue<DataReference, never>
>(WindowVue) {
  private docId: string = "";
  private isMounted: boolean = false;
  private isProcessed: boolean = false;
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
    this.docId = this.windowInfo.args!.docId;
    const data = (await this.chatPaletteListCC!.getData(this.docId))!;

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

    window.console.log(JSON.stringify(data.data, null, " "));

    this.name = data.data!.name;
    this.chatFontColorType = data.data!.chatFontColorType;
    this.chatFontColor = data.data!.chatFontColor;
    this.actorId = data.data!.actorId;
    this.sceneObjectId = data.data!.sceneObjectId;
    this.statusId = data.data!.statusId;
    this.isSecret = data.data!.isSecret;
    this.paletteText = data.data!.paletteText;

    if (this.windowInfo.status === "window") {
      try {
        await this.chatPaletteListCC.touchModify([this.docId]);
      } catch (err) {
        window.console.warn(err);
        this.isProcessed = true;
        await this.close();
      }
    }
    this.isMounted = true;
  }

  @VueEvent
  private async commit() {
    const data = (await this.chatPaletteListCC!.getData(this.docId))!;
    data.data!.name = this.name;
    data.data!.chatFontColorType = this.chatFontColorType;
    data.data!.chatFontColor = this.chatFontColor;
    data.data!.actorId = this.actorId;
    data.data!.sceneObjectId = this.sceneObjectId;
    data.data!.statusId = this.statusId;
    data.data!.isSecret = this.isSecret;
    data.data!.paletteText = this.paletteText;
    await this.chatPaletteListCC!.update([this.docId], [data.data!]);
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
      await this.chatPaletteListCC!.releaseTouch([this.docId]);
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
  @include flex-box(column, stretch, flex-start);
  width: 100%;
  height: 100%;
}

.button-area {
}
</style>
