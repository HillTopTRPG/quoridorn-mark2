<template>
  <div class="container" ref="window-container">
    <actor-info-form
      :name.sync="name"
      :tag.sync="tag"
      :actorType="actorType"
      :chatFontColorType.sync="chatFontColorType"
      :chatFontColor.sync="chatFontColor"
      :standImagePosition.sync="standImagePosition"
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
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import { ActorStore } from "@/@types/store-data";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import WindowVue from "@/app/core/window/WindowVue";
import ActorInfoForm from "@/app/basic/object/actor/ActorInfoForm.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import EditWindowDelegator, {
  EditWindow
} from "@/app/core/window/EditWindowDelegator";

@Component({ components: { ButtonArea, ActorInfoForm } })
export default class ActorEditWindow
  extends Mixins<WindowVue<DataReference, never>>(WindowVue)
  implements EditWindow<ActorStore> {
  private editWindowDelegator = new EditWindowDelegator<ActorStore, "name">(
    this,
    "name"
  );

  private name: string = "";
  private tag: string = "";
  private chatFontColorType: "owner" | "original" = "owner";
  private chatFontColor: string = "#000000";
  private standImagePosition: number = 1;
  private actorType: "user" | "character" | "chat-only" = "user";

  @LifeCycle
  public async mounted() {
    await this.editWindowDelegator.init();
    this.inputEnter("input:not([type='button'])", this.commit);
  }

  public isCommitAble(): boolean {
    return !!this.name && !this.isDuplicate();
  }

  public isDuplicate(): boolean {
    return this.editWindowDelegator.isDuplicateBasic(this.name);
  }

  @Watch("name")
  private onChangeIsDuplicate() {
    this.windowInfo.message = this.editWindowDelegator.onChangeIsDuplicateBasic();
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

  public pullStoreData(data: StoreData<ActorStore>): void {
    this.name = data.data!.name;
    this.tag = data.data!.tag;
    this.chatFontColorType = data.data!.chatFontColorType;
    this.chatFontColor = data.data!.chatFontColor;
    this.standImagePosition = data.data!.standImagePosition;
    this.actorType = data.data!.type;
  }

  public async pushStoreData(data: StoreData<ActorStore>): Promise<void> {
    data.data!.name = this.name;
    data.data!.tag = this.tag;
    data.data!.chatFontColorType = this.chatFontColorType;
    data.data!.chatFontColor = this.chatFontColor;
    data.data!.standImagePosition = this.standImagePosition;
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
