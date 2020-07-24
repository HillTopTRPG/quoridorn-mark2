<template>
  <div class="container" ref="window-container">
    <actor-info-form
      v-if="isMounted"
      :name.sync="name"
      :tag.sync="tag"
      :chatFontColorType.sync="chatFontColorType"
      :chatFontColor.sync="chatFontColor"
      :standImagePosition.sync="standImagePosition"
    />

    <div class="button-area">
      <ctrl-button @click="commit()" :disabled="!isCommitAble">
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
import { Task, TaskResult } from "task";
import LifeCycle from "../../../core/decorator/LifeCycle";
import TaskProcessor from "../../../core/task/TaskProcessor";
import { ActorStore } from "../../../../@types/gameObject";
import SocketFacade, {
  permissionCheck
} from "../../../core/api/app-server/SocketFacade";
import NekostoreCollectionController from "../../../core/api/app-server/NekostoreCollectionController";
import VueEvent from "../../../core/decorator/VueEvent";
import WindowVue from "../../../core/window/WindowVue";
import CtrlButton from "../../../core/component/CtrlButton.vue";
import GameObjectManager from "../../GameObjectManager";
import LanguageManager from "../../../../LanguageManager";
import ActorInfoForm from "./ActorInfoForm.vue";
import { DataReference } from "../../../../@types/data";
import { findRequireById } from "../../../core/utility/Utility";

@Component({
  components: { ActorInfoForm, CtrlButton }
})
export default class ActorEditWindow extends Mixins<
  WindowVue<DataReference, never>
>(WindowVue) {
  private docId: string = "";
  private cc: NekostoreCollectionController<
    ActorStore
  > = SocketFacade.instance.actorCC();

  private actorList = GameObjectManager.instance.actorList;
  private isProcessed: boolean = false;
  private isMounted: boolean = false;

  private name: string = "";
  private tag: string = "";
  private chatFontColorType: "owner" | "original" = "owner";
  private chatFontColor: string = "#000000";
  private standImagePosition: number = 1;

  @LifeCycle
  public async mounted() {
    await this.init();
    this.docId = this.windowInfo.args!.docId;
    const data = (await this.cc!.getData(this.docId))!;

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
    this.tag = data.data!.tag;
    this.chatFontColorType = data.data!.chatFontColorType;
    this.chatFontColor = data.data!.chatFontColor;
    this.standImagePosition = data.data!.standImagePosition;

    if (this.windowInfo.status === "window") {
      try {
        await this.cc.touchModify([this.docId]);
      } catch (err) {
        window.console.warn(err);
        this.isProcessed = true;
        await this.close();
      }
    }
    this.isMounted = true;
  }

  private get isDuplicate(): boolean {
    return (
      this.actorList.filter(
        ct => ct.data!.name === this.name && ct.id !== this.docId
      ).length > 0
    );
  }

  @VueEvent
  private get isCommitAble(): boolean {
    return !!this.name && !this.isDuplicate;
  }

  @Watch("isDuplicate")
  private onChangeIsDuplicate() {
    this.windowInfo.message = this.isDuplicate
      ? ActorEditWindow.getDialogMessage("duplicate")
      : ActorEditWindow.getDialogMessage("default");
  }

  private static getDialogMessage(target: string) {
    const msgTarget = "chat-tab-add-window.message-list." + target;
    return LanguageManager.instance.getText(msgTarget);
  }

  @VueEvent
  private async commit() {
    const data = findRequireById(this.actorList, this.docId).data!;
    data.name = this.name;
    data.tag = this.tag;
    data.chatFontColorType = this.chatFontColorType;
    data.chatFontColor = this.chatFontColor;
    data.standImagePosition = this.standImagePosition;
    await this.cc!.update([this.docId], [data]);
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
      await this.cc!.releaseTouch([this.docId]);
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
  @include flex-box(column, stretch, flex-start);
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
