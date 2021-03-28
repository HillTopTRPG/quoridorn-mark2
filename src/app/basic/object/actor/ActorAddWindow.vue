<template>
  <div class="container" ref="window-container">
    <actor-info-form
      :name.sync="name"
      :tag.sync="tag"
      :actorType="'character'"
      :chatFontColorType.sync="chatFontColorType"
      :chatFontColor.sync="chatFontColor"
      :standImagePosition.sync="standImagePosition"
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
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import WindowVue from "@/app/core/window/WindowVue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import ActorInfoForm from "@/app/basic/object/actor/ActorInfoForm.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import { ActorStore } from "@/@types/store-data";
import AddWindowDelegator, {
  AddWindow
} from "@/app/core/window/AddWindowDelegator";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";

@Component({ components: { ButtonArea, ActorInfoForm } })
export default class ActorAddWindow
  extends Mixins<WindowVue<ActorStore, boolean>>(WindowVue)
  implements AddWindow<ActorStore> {
  private addWindowDelegator = new AddWindowDelegator<ActorStore, "name">(
    this,
    SocketFacade.instance.actorCC().collectionNameSuffix,
    "name"
  );

  private name: string = "";
  private tag: string = "";
  private chatFontColorType: "owner" | "original" = "owner";
  private chatFontColor: string = "#000000";
  private standImagePosition: number = 1;

  @LifeCycle
  public async mounted() {
    await this.addWindowDelegator.init();
    this.inputEnter("input:not([type='button'])", this.commit);
  }

  public isCommitAble(): boolean {
    return !!this.name && !this.isDuplicate;
  }

  public isDuplicate(): boolean {
    return this.addWindowDelegator.isDuplicateBasic(this.name);
  }

  @Watch("name")
  private onChangeIsDuplicate() {
    this.windowInfo.message = this.addWindowDelegator.onChangeIsDuplicateBasic();
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

  public setStoreData(data: ActorStore): void {
    this.name = data.name;
    this.tag = data.tag;
    this.chatFontColorType = data.chatFontColorType;
    this.chatFontColor = data.chatFontColor;
    this.standImagePosition = data.standImagePosition;
  }

  public async getStoreDataList(): Promise<DelegateStoreData<ActorStore>[]> {
    return [
      {
        collection: SocketFacade.instance.actorCC().collectionNameSuffix,
        permission: GameObjectManager.PERMISSION_OWNER_CHANGE,
        data: {
          name: this.name,
          tag: this.tag,
          type: "character" as "character",
          chatFontColorType: this.chatFontColorType,
          chatFontColor: this.chatFontColor,
          standImagePosition: this.standImagePosition,
          pieceKeyList: [],
          statusKey: "" // 自動的に付与される
        }
      }
    ];
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
