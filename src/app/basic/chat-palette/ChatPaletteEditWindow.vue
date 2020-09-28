<template>
  <div class="container" ref="window-container">
    <chat-palette-info-form
      :windowKey="windowKey"
      :isAdd="false"
      :name.sync="name"
      :chatFontColorType.sync="chatFontColorType"
      :chatFontColor.sync="chatFontColor"
      :actorKey.sync="actorKey"
      :sceneObjectKey.sync="sceneObjectKey"
      :statusKey.sync="statusKey"
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
import LifeCycle from "../../core/decorator/LifeCycle";
import SocketFacade, {
  permissionCheck
} from "../../core/api/app-server/SocketFacade";
import TaskProcessor from "../../core/task/TaskProcessor";
import WindowVue from "../../core/window/WindowVue";
import ChitInfoForm from "../object/chit/ChitInfoForm.vue";
import CtrlButton from "../../core/component/CtrlButton.vue";
import ChatPaletteInfoForm from "./ChatPaletteInfoForm.vue";
import VueEvent from "../../core/decorator/VueEvent";

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
  private docKey: string = "";
  private isMounted: boolean = false;
  private isProcessed: boolean = false;
  private chatPaletteListCC = SocketFacade.instance.chatPaletteListCC();

  private name: string = "new";
  private chatFontColorType: "owner" | "original" = "owner";
  private chatFontColor: string = "#000000";
  private actorKey: string | null = null;
  private sceneObjectKey: string | null = null;
  private statusKey: string | null = null;
  private isSecret: boolean = false;
  private paletteText: string = "";

  @LifeCycle
  public async mounted() {
    await this.init();
    this.docKey = this.windowInfo.args!.key;
    const data = (await this.chatPaletteListCC!.findSingle("key", this.docKey))!
      .data!;

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

    this.name = data.data!.name;
    this.chatFontColorType = data.data!.chatFontColorType;
    this.chatFontColor = data.data!.chatFontColor;
    this.actorKey = data.data!.actorKey;
    this.sceneObjectKey = data.data!.sceneObjectKey;
    this.statusKey = data.data!.statusKey;
    this.isSecret = data.data!.isSecret;
    this.paletteText = data.data!.paletteText;

    if (this.windowInfo.status === "window") {
      try {
        await this.chatPaletteListCC.touchModify([this.docKey]);
      } catch (err) {
        console.warn(err);
        this.isProcessed = true;
        await this.close();
      }
    }
    this.isMounted = true;
  }

  @VueEvent
  private async commit() {
    const data = (await this.chatPaletteListCC!.findSingle("key", this.docKey))!
      .data!;
    data.data!.name = this.name;
    data.data!.chatFontColorType = this.chatFontColorType;
    data.data!.chatFontColor = this.chatFontColor;
    data.data!.actorKey = this.actorKey;
    data.data!.sceneObjectKey = this.sceneObjectKey;
    data.data!.statusKey = this.statusKey;
    data.data!.isSecret = this.isSecret;
    data.data!.paletteText = this.paletteText;
    await this.chatPaletteListCC!.update([
      {
        key: this.docKey,
        data: data.data!
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
      await this.chatPaletteListCC!.releaseTouch([this.docKey]);
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
