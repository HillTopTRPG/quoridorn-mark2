<template>
  <div class="container" ref="window-container">
    <actor-info-form
      :name.sync="name"
      :chatFontColorType.sync="chatFontColorType"
      :chatFontColor.sync="chatFontColor"
      :standImagePosition.sync="standImagePosition"
      :isUseTableData.sync="isUseTableData"
    />

    <div class="button-area">
      <ctrl-button @click="commit()" :disabled="!isCommitAble">
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
import { Task, TaskResult } from "task";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import BaseInput from "@/app/core/component/BaseInput.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import WindowVue from "@/app/core/window/WindowVue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import LanguageManager from "@/LanguageManager";
import VueEvent from "@/app/core/decorator/VueEvent";
import ActorInfoForm from "@/app/basic/object/actor/ActorInfoForm.vue";

@Component({
  components: { ActorInfoForm, CtrlButton, BaseInput }
})
export default class ActorAddWindow extends Mixins<WindowVue<string, never>>(
  WindowVue
) {
  private actorList = GameObjectManager.instance.actorList;
  private isProcessed: boolean = false;

  private name: string = "";
  private chatFontColorType: "owner" | "original" = "owner";
  private chatFontColor: string = "#000000";
  private standImagePosition: number = 1;
  private isUseTableData: boolean = false;

  @LifeCycle
  public async mounted() {
    await this.init();
  }

  private get isDuplicate(): boolean {
    return this.actorList.filter(ct => ct.data!.name === this.name).length > 0;
  }

  private get isCommitAble(): boolean {
    return !!this.name && !this.isDuplicate;
  }

  @Watch("isDuplicate")
  private onChangeIsDuplicate() {
    this.windowInfo.message = this.isDuplicate
      ? ActorAddWindow.getDialogMessage("duplicate")
      : ActorAddWindow.getDialogMessage("default");
  }

  private static getDialogMessage(target: string) {
    const msgTarget = "chat-tab-add-window.message-list." + target;
    return LanguageManager.instance.getText(msgTarget);
  }

  @VueEvent
  private async commit() {
    if (this.isCommitAble) {
      await GameObjectManager.addActor({
        name: this.name,
        type: "character",
        chatFontColorType: this.chatFontColorType,
        chatFontColor: this.chatFontColor,
        standImagePosition: this.standImagePosition,
        isUseTableData: this.isUseTableData,
        pieceIdList: [],
        statusId: "" // 自動的に付与される
      });
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
  @include flex-box(column, stretch, flex-start);
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
