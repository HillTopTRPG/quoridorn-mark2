<template>
  <div class="container" ref="window-container">
    <public-memo-info-form
      :windowKey="windowKey"
      :isAdd="true"
      initTabTarget="basic"
      :name.sync="name"
      :otherTextList.sync="otherTextList"
      :mediaKey.sync="mediaKey"
      :mediaTag.sync="mediaTag"
      :direction.sync="direction"
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
import { MemoStore, PublicMemoStore } from "@/@types/store-data";
import { createEmptyStoreUseData } from "@/app/core/utility/Utility";
import PublicMemoInfoForm from "@/app/basic/public-memo/PublicMemoInfoForm.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import WindowVue from "@/app/core/window/WindowVue";
import LanguageManager from "@/LanguageManager";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import VueEvent from "@/app/core/decorator/VueEvent";
import { Direction } from "@/@types/store-data-optional";
import GameObjectManager from "@/app/basic/GameObjectManager";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import AddWindowDelegator, {
  AddWindow
} from "@/app/core/window/AddWindowDelegator";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";

const uuid = require("uuid");

@Component({ components: { ButtonArea, PublicMemoInfoForm } })
export default class PublicMemoAddWindow
  extends Mixins<WindowVue<PublicMemoStore, boolean>>(WindowVue)
  implements AddWindow<PublicMemoStore> {
  private addWindowDelegator = new AddWindowDelegator<PublicMemoStore, "name">(
    this,
    SocketFacade.instance.publicMemoListCC().collectionNameSuffix,
    "name"
  );

  private name: string = LanguageManager.instance.getText(
    "type.public-memo-list"
  );
  private otherTextList: StoreData<MemoStore>[] = [
    createEmptyStoreUseData(uuid.v4(), {
      tab: "",
      type: "normal",
      text: ""
    })
  ];
  private mediaKey: string | null = null;
  private mediaTag: string = LanguageManager.instance.getText(
    "type.public-memo-list"
  );
  private direction: Direction = "none";

  @LifeCycle
  public async mounted() {
    await this.addWindowDelegator.init();
    const mediaList = GameObjectManager.instance.mediaList.filter(
      m => m.data!.urlType === "image"
    );
    const publicMemoMedia = mediaList.find(m => m.data!.tag === this.mediaTag);
    if (publicMemoMedia) {
      this.mediaKey = publicMemoMedia.key;
    } else {
      const media = mediaList[0]!;
      this.mediaKey = media.key;
      this.mediaTag = media.data!.tag;
    }
  }

  public isCommitAble(): boolean {
    return !!this.mediaKey && !this.isDuplicate();
  }

  public isDuplicate(): boolean {
    return false;
  }

  @VueEvent
  private async commit() {
    const commitResult = await this.addWindowDelegator.commit();
    if (commitResult) {
      const publicMemoKey = commitResult[0];
      await SocketFacade.instance.memoCC().addDirect(
        this.otherTextList.map(data => ({
          ownerType: "public-memo-list",
          owner: publicMemoKey,
          data: data.data!
        }))
      );
    }
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

  public setStoreData(data: PublicMemoStore): void {
    this.name = data.name;
    this.mediaKey = data.mediaKey;
    this.mediaTag = data.mediaTag;
    this.direction = data.direction;
  }

  public async getStoreDataList(): Promise<
    DelegateStoreData<PublicMemoStore>[]
  > {
    return [
      {
        collection: "public-memo-list",
        data: {
          name: this.name,
          mediaKey: this.mediaKey!,
          mediaTag: this.mediaTag!,
          direction: this.direction
        }
      }
    ];
  }

  @Watch("mediaKey", { immediate: true })
  private onChangeImageDocKey() {
    this.windowInfo.message = this.mediaKey
      ? ""
      : this.$t(`${this.windowInfo.type}.message-list.select-icon`).toString();
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

.public-memo-info-form {
  flex: 1;
}
</style>
