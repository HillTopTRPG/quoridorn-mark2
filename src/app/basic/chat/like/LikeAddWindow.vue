<template>
  <div class="container" ref="window-container">
    <like-info-form
      :windowKey="windowKey"
      :isAdd="true"
      initTabTarget="basic"
      :char.sync="char"
      :isThrowLinkage.sync="isThrowLinkage"
      :linkageResourceId.sync="linkageResourceId"
    />

    <div class="button-area">
      <ctrl-button @click="commit()" :disabled="isDuplicate || !char">
        <span v-t="'button.add'"></span>
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
import SocketFacade from "../../../core/api/app-server/SocketFacade";
import LanguageManager from "../../../../LanguageManager";
import VueEvent from "../../../core/decorator/VueEvent";
import TaskProcessor from "../../../core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import CtrlButton from "../../../core/component/CtrlButton.vue";
import LikeInfoForm from "@/app/basic/chat/like/LikeInfoForm.vue";

@Component({ components: { LikeInfoForm, CtrlButton } })
export default class LikeAddWindow extends Mixins<WindowVue<string, boolean>>(
  WindowVue
) {
  private likeList = GameObjectManager.instance.likeList;
  private isProcessed: boolean = false;
  private cc = SocketFacade.instance.likeListCC();

  private char: string = "";
  private isThrowLinkage: boolean = true;
  private linkageResourceId: string | null = null;

  @LifeCycle
  public async mounted() {
    await this.init();
    this.inputEnter("input:not([type='button'])", this.commit);
  }

  private get isDuplicate(): boolean {
    if (this.char === null) return false;
    return !!this.likeList.find(ct => ct.data!.char === this.char);
  }

  @Watch("isDuplicate")
  private onChangeIsDuplicate() {
    this.windowInfo.message = this.isDuplicate
      ? this.$t("message.tab-duplicate")!.toString()
      : "";
  }

  private static getDialogMessage(target: string) {
    const msgTarget = "chat-tab-add-window.message-list." + target;
    return LanguageManager.instance.getText(msgTarget);
  }

  @VueEvent
  private async commit() {
    if (this.isDuplicate) return;
    await this.cc!.addDirect(
      [
        {
          char: this.char,
          isThrowLinkage: this.isThrowLinkage,
          linkageResourceId: this.linkageResourceId
        }
      ],
      [
        {
          permission: {
            view: { type: "none", list: [] },
            edit: { type: "none", list: [] },
            chmod: { type: "none", list: [] }
          }
        }
      ]
    );
    this.isProcessed = true;
    await this.finally(true);
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
    if (!this.isProcessed) {
      this.isProcessed = true;
      await this.finally();
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
