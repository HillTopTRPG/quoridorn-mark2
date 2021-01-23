<template>
  <div class="container" ref="window-container">
    <chat-palette-info-form
      :windowKey="windowKey"
      :isAdd="true"
      :name.sync="name"
      :chatFontColorType.sync="chatFontColorType"
      :chatFontColor.sync="chatFontColor"
      :actorKey.sync="actorKey"
      :sceneObjectKey.sync="sceneObjectKey"
      :statusKey.sync="statusKey"
      :isSecret.sync="isSecret"
      :paletteText.sync="paletteText"
    />

    <button-area
      :is-commit-able="isCommitAble()"
      commit-text="add"
      @commit="commit()"
      @rollback="rollback()"
    />
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import WindowVue from "@/app/core/window/WindowVue";
import ChatPaletteInfoForm from "@/app/basic/chat-palette/ChatPaletteInfoForm.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import { ChatPaletteStore } from "@/@types/store-data";
import AddWindowDelegator, {
  AddWindow
} from "@/app/core/window/AddWindowDelegator";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";

@Component({ components: { ButtonArea, ChatPaletteInfoForm } })
export default class ChatPaletteAddWindow
  extends Mixins<WindowVue<ChatPaletteStore, boolean>>(WindowVue)
  implements AddWindow<ChatPaletteStore> {
  private addWindowDelegator = new AddWindowDelegator<ChatPaletteStore>(this);

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
    await this.addWindowDelegator.init();
    this.inputEnter("input:not([type='button'])", this.commit);
  }

  public isCommitAble(): boolean {
    return !!this.name;
  }

  @VueEvent
  private async commit() {
    await this.addWindowDelegator.commit();
  }

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing2(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    return await this.addWindowDelegator.windowCloseClosing(task);
  }

  @VueEvent
  private async rollback() {
    await this.addWindowDelegator.rollback();
  }

  public setStoreData(data: ChatPaletteStore): void {
    this.name = data.name;
    this.chatFontColorType = data.chatFontColorType;
    this.chatFontColor = data.chatFontColor;
    this.actorKey = data.actorKey;
    this.sceneObjectKey = data.sceneObjectKey;
    this.statusKey = data.statusKey;
    this.isSecret = data.isSecret;
    this.paletteText = data.paletteText;
  }

  public async getStoreDataList(): Promise<
    DelegateStoreData<ChatPaletteStore>[]
  > {
    return [
      {
        collection: SocketFacade.instance.chatPaletteListCC()
          .collectionNameSuffix,
        data: {
          name: this.name,
          source: "normal",
          chatFontColorType: this.chatFontColorType,
          chatFontColor: this.chatFontColor,
          actorKey: this.actorKey,
          sceneObjectKey: this.sceneObjectKey,
          targetKey: null, // TODO 入力項目を作成
          outputTabKey: null, // TODO 入力項目を作成
          statusKey: this.statusKey,
          system: null, // TODO 入力項目を作成
          isSecret: this.isSecret,
          paletteText: this.paletteText
        }
      }
    ];
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
