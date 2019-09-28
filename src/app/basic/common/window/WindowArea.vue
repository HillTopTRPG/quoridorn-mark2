<template>
  <div id="window-area">
    <window-frame
      v-for="(windowInfo, key) in windowInfoList"
      :key="key"
      v-show="windowInfo.status.indexOf('window') > -1"
      :windowInfo="windowInfo"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import TestWindow from "@/app/basic/common/window/TestWindow.vue";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task } from "@/@types/task";
import { WindowInfo } from "@/@types/window";
import WindowFrame from "@/app/basic/common/window/WindowFrame.vue";
import WindowManager from "@/app/basic/common/window/WindowManager";
import Logging from "@/app/core/logger/Logging";

@Component({
  components: { WindowFrame, TestWindow }
})
export default class WindowArea extends Vue {
  private windowInfoList: WindowInfo[] = WindowManager.instance.windowInfoList;

  @TaskProcessor("window-close-finished")
  private async closeWindow(task: Task<string>): Promise<string | void> {
    const index = this.getWindowInfoIndex(task.value);
    this.windowInfoList.splice(index, 1);

    this.arrangeOrder();
    this.arrangeMinimizeIndex();

    // 登録したタスクに完了通知
    if (task.resolve) task.resolve(task);
  }

  @TaskProcessor("window-minimize-finished")
  @Logging
  private async minimizeWindow(task: Task<string>): Promise<string | void> {
    const index = this.getWindowInfoIndex(task.value);
    const windowInfo = this.windowInfoList[index];
    windowInfo.isMinimized = true;
    windowInfo.isMinimizeAnimationEnd = false;
    window.setTimeout(() => {
      windowInfo.isMinimizeAnimationEnd = true;
    }, 200);

    this.arrangeMinimizeIndex();

    // 登録したタスクに完了通知
    if (task.resolve) task.resolve(task);
  }

  @TaskProcessor("window-normalize-finished")
  @Logging
  private async normalizeWindow(task: Task<string>): Promise<string | void> {
    const index = this.getWindowInfoIndex(task.value);
    const windowInfo = this.windowInfoList[index];
    windowInfo.isMinimized = false;
    windowInfo.isMinimizeAnimationEnd = false;

    this.arrangeMinimizeIndex();

    // 登録したタスクに完了通知
    if (task.resolve) task.resolve(task);
  }

  @TaskProcessor("window-active-finished")
  private async activeWindow(task: Task<string>): Promise<string | void> {
    const index = this.getWindowInfoIndex(task.value);
    const windowInfo = this.windowInfoList[index];
    windowInfo.order = this.windowInfoList.length;

    this.arrangeOrder();
    WindowManager.instance.arrangePoint(windowInfo.key);

    // 登録したタスクに完了通知
    if (task.resolve) task.resolve(task);
  }

  private arrangeOrder() {
    this.windowInfoList
      .concat()
      .sort((w1, w2) => {
        if (w1.order < w2.order) return -1;
        if (w1.order > w2.order) return 1;
        return 0;
      })
      .forEach((info, i) => {
        info.order = i + (info.isMinimized ? 1000 : 0);
      });
  }

  private arrangeMinimizeIndex() {
    this.windowInfoList
      .filter(info => info.isMinimized)
      .sort((w1, w2) => {
        if (w1.order < w2.order) return -1;
        if (w1.order > w2.order) return 1;
        return 0;
      })
      .forEach((info, i, list) => {
        info.minimizeIndex = list.length - i - 1;
      });

    document.documentElement.style.setProperty(
      "--windowMinimizeLength",
      this.windowInfoList.filter(info => info.isMinimized).length.toString()
    );
  }

  private getWindowInfoIndex(windowKey: string | null): number {
    if (!windowKey) return -1;
    return this.windowInfoList.findIndex(info => info.key === windowKey);
  }
}
</script>

<style scoped lang="scss">
#window-area {
  position: relative;
  z-index: 10;
}
</style>
