<template>
  <div class="container" ref="window-container">
    <chat-tab-info-form
      :windowKey="windowKey"
      :isAdd="false"
      initTabTarget="basic"
      :tabName.sync="tabName"
      :useReadAloud.sync="useReadAloud"
      :readAloudVolume.sync="readAloudVolume"
    />

    <div class="button-area">
      <ctrl-button @click="commit()" :disabled="isDuplicate || !tabName">
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
import GameObjectManager from "../../GameObjectManager";
import WindowVue from "../../../core/window/WindowVue";
import LifeCycle from "../../../core/decorator/LifeCycle";
import SocketFacade, {
  permissionCheck
} from "../../../core/api/app-server/SocketFacade";
import LanguageManager from "../../../../LanguageManager";
import VueEvent from "../../../core/decorator/VueEvent";
import TaskProcessor from "../../../core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import CtrlButton from "../../../core/component/CtrlButton.vue";
import ChatTabInfoForm from "@/app/basic/chat/tab/ChatTabInfoForm.vue";

@Component({
  components: { ChatTabInfoForm, CtrlButton }
})
export default class ChatTabEditWindow extends Mixins<WindowVue<string, never>>(
  WindowVue
) {
  private docId: string | null = null;
  private chatTabList = GameObjectManager.instance.chatTabList;
  private isProcessed: boolean = false;
  private cc = SocketFacade.instance.chatTabListCC();

  private tabName: string = "";
  private useReadAloud: boolean = false;
  private readAloudVolume: number = 1;

  @LifeCycle
  public async mounted() {
    await this.init();
    this.inputEnter("input:not([type='button'])", this.commit);

    this.docId = this.windowInfo.args!;
    const data = this.chatTabList.filter(ct => ct.id === this.docId)[0];

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

    this.tabName = data.data!.name;
    this.useReadAloud = data.data!.useReadAloud;
    this.readAloudVolume = data.data!.readAloudVolume;

    if (this.windowInfo.status === "window") {
      try {
        await this.cc.touchModify([this.docId]);
      } catch (err) {
        console.warn(err);
        this.isProcessed = true;
        await this.close();
      }
    }
  }

  private get isDuplicate(): boolean {
    if (this.tabName === null) return false;
    return (
      this.chatTabList.filter(
        ct => ct.data!.name === this.tabName && ct.id !== this.docId
      ).length > 0
    );
  }

  @Watch("isDuplicate")
  private onChangeIsDuplicate() {
    if (this.docId === null) return;
    const tab = this.chatTabList.filter(ct => ct.id === this.docId)[0];
    console.log(tab, this.chatTabList.concat());
    this.windowInfo.message = this.isDuplicate
      ? ChatTabEditWindow.getDialogMessage("duplicate")
      : ChatTabEditWindow.getDialogMessage("default").replace(
          "$1",
          tab.data!.name
        );
  }

  private static getDialogMessage(target: string) {
    const msgTarget = "chat-tab-edit-window.message-list." + target;
    return LanguageManager.instance.getText(msgTarget);
  }

  @VueEvent
  private async commit() {
    if (!this.isDuplicate) {
      const data = this.chatTabList.filter(ct => ct.id === this.docId)[0];
      data.data!.name = this.tabName!;
      data.data!.useReadAloud = this.useReadAloud!;
      data.data!.readAloudVolume = this.readAloudVolume!;
      await this.cc!.update([this.docId!], [data.data!]);
    }
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
      await this.cc!.releaseTouch([this.docId!]);
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
  @include flex-box(column, flex-start, center);
  width: 100%;
  height: 100%;
}

.button-area {
  align-self: center;
}
</style>
