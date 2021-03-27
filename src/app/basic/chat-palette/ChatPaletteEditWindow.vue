<template>
  <div class="container" ref="window-container">
    <chat-palette-info-form
      v-if="isMounted"
      :windowKey="windowKey"
      :isAdd="false"
      :name.sync="name"
      :chatFontColorType.sync="chatFontColorType"
      :chatFontColor.sync="chatFontColor"
      :actorKey.sync="actorKey"
      :scene-object-key.sync="sceneObjectKey"
      :statusKey.sync="statusKey"
      :isSecret.sync="isSecret"
      :paletteText.sync="paletteText"
    />

    <button-area
      :is-commit-able="isCommitAble()"
      commit-text="modify"
      @commit="commit()"
      @rollback="rollback()"
    />
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import WindowVue from "@/app/core/window/WindowVue";
import ChatPaletteInfoForm from "@/app/basic/chat-palette/ChatPaletteInfoForm.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import EditWindowDelegator, {
  EditWindow
} from "@/app/core/window/EditWindowDelegator";
import { ChatPaletteStore } from "@/@types/store-data";

@Component({ components: { ButtonArea, ChatPaletteInfoForm } })
export default class ChatPaletteEditWindow
  extends Mixins<WindowVue<DataReference, never>>(WindowVue)
  implements EditWindow<ChatPaletteStore> {
  private editWindowDelegator = new EditWindowDelegator<ChatPaletteStore>(this);
  private isMounted = false;

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
    await this.editWindowDelegator.init();
    this.inputEnter("input:not([type='button'])", this.commit);
  }

  public isCommitAble(): boolean {
    return true;
  }

  @VueEvent
  private async commit() {
    await this.editWindowDelegator.commit();
  }

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing2(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    return await this.editWindowDelegator.windowCloseClosing(task);
  }

  @VueEvent
  private async rollback() {
    await this.editWindowDelegator.rollback();
  }

  public pullStoreData(data: StoreData<ChatPaletteStore>): void {
    this.name = data.data!.name;
    this.chatFontColorType = data.data!.chatFontColorType;
    this.chatFontColor = data.data!.chatFontColor;
    this.actorKey = data.data!.actorKey;
    this.sceneObjectKey = data.data!.sceneObjectKey;
    this.statusKey = data.data!.statusKey;
    this.isSecret = data.data!.isSecret;
    this.paletteText = data.data!.paletteText;
    this.isMounted = true;
  }

  public async pushStoreData(data: StoreData<ChatPaletteStore>): Promise<void> {
    data.data!.name = this.name;
    data.data!.chatFontColorType = this.chatFontColorType;
    data.data!.chatFontColor = this.chatFontColor;
    data.data!.actorKey = this.actorKey;
    data.data!.sceneObjectKey = this.sceneObjectKey;
    data.data!.statusKey = this.statusKey;
    data.data!.isSecret = this.isSecret;
    data.data!.paletteText = this.paletteText;
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
