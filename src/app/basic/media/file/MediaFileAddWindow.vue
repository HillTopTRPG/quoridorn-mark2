<template>
  <div class="container" ref="window-container">
    <media-file-info-form
      :windowKey="windowKey"
      :name.sync="name"
      :tag.sync="tag"
      :url.sync="url"
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
import { Task, TaskResult } from "task";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import WindowVue from "@/app/core/window/WindowVue";
import VueEvent from "@/app/core/decorator/VueEvent";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import MediaFileInfoForm from "@/app/basic/media/file/MediaFileInfoForm.vue";
import { exchangeMediaInfo, mediaUpload } from "@/app/core/utility/FileUtility";
const uuid = require("uuid");

@Component({ components: { MediaFileInfoForm, ButtonArea } })
export default class MediaFileAddWindow extends Mixins<
  WindowVue<never, boolean>
>(WindowVue) {
  private name: string = "";
  private tag: string = "";
  private url: string = "";

  private isProcessed: boolean = false;

  @LifeCycle
  public async mounted() {
    await this.init();
  }

  @VueEvent
  private get isCommitAble(): boolean {
    return !!this.name && !!this.url;
  }

  @VueEvent
  private async commit() {
    if (!this.isCommitAble) return;

    await mediaUpload({
      uploadMediaInfoList: await exchangeMediaInfo(
        this.url,
        this.tag,
        this.name
      ),
      option: {}
    });

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
      await this.finally(false);
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
}
</style>
