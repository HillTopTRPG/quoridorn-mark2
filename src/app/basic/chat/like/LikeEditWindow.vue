<template>
  <div class="container" ref="window-container">
    <like-info-form
      :windowKey="windowKey"
      :isAdd="false"
      initTabTarget="basic"
      :char.sync="char"
      :isThrowLinkage.sync="isThrowLinkage"
      :linkageResourceId.sync="linkageResourceId"
    />

    <div class="button-area">
      <ctrl-button @click="commit()" :disabled="isDuplicate || !char">
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
import LikeInfoForm from "@/app/basic/chat/like/LikeInfoForm.vue";

@Component({
  components: { LikeInfoForm, CtrlButton }
})
export default class LikeEditWindow extends Mixins<WindowVue<string, never>>(
  WindowVue
) {
  private docId: string | null = null;
  private likeList = GameObjectManager.instance.likeList;
  private isProcessed: boolean = false;
  private cc = SocketFacade.instance.likeListCC();

  private char: string = "";
  private isThrowLinkage: boolean = false;
  private linkageResourceId: string | null = null;

  @LifeCycle
  public async mounted() {
    await this.init();
    this.inputEnter("input:not([type='button'])", this.commit);

    this.docId = this.windowInfo.args!;
    const data = this.likeList.filter(ct => ct.id === this.docId)[0];

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

    this.char = data.data!.char;
    this.isThrowLinkage = data.data!.isThrowLinkage;
    this.linkageResourceId = data.data!.linkageResourceId;

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
    if (this.char === null) return false;
    return !!this.likeList.find(
      ct => ct.data!.char === this.char && ct.id !== this.docId
    );
  }

  @Watch("isDuplicate")
  private onChangeIsDuplicate() {
    if (this.docId === null) return;
    const tab = this.likeList.filter(ct => ct.id === this.docId)[0];
    this.windowInfo.message = this.isDuplicate
      ? this.$t("message.tab-duplicate")!.toString()
      : this.$t("message.original")!
          .toString()
          .replace("$1", tab.data!.char);
  }

  private static getDialogMessage(target: string) {
    const msgTarget = "chat-tab-edit-window.message-list." + target;
    return LanguageManager.instance.getText(msgTarget);
  }

  @VueEvent
  private async commit() {
    if (!this.isDuplicate) {
      const data = this.likeList.filter(ct => ct.id === this.docId)[0];
      data.data!.char = this.char;
      data.data!.isThrowLinkage = this.isThrowLinkage;
      data.data!.linkageResourceId = this.linkageResourceId;
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
