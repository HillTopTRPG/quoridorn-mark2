<template>
  <div id="window-area">
    <window-frame
      v-for="(windowInfo, key) in windowInfoList"
      :key="key"
      v-show="
        windowInfo.status === 'window' || windowInfo.status.endsWith('-window')
      "
      :windowInfo="windowInfo"
      :status="'window'"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import TaskProcessor from "../task/TaskProcessor";
import { Task } from "@/@types/task";
import { WindowInfo } from "@/@types/window";
import WindowFrame from "./WindowFrame.vue";
import WindowManager from "./WindowManager";
import Logging from "../logger/Logging";
import { calcWindowPosition, createSize } from "../Coordinate";
import { getCssPxNum } from "../Css";

@Component({
  components: { WindowFrame }
})
export default class WindowArea extends Vue {
  private windowInfoList: WindowInfo<unknown>[] =
    WindowManager.instance.windowInfoList;

  private key = "window-area";

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing(task: Task<string>): Promise<string | void> {
    const index = this.getWindowInfoIndex(task.value);
    this.windowInfoList.splice(index, 1);
  }

  @TaskProcessor("window-close-finished")
  private async windowCloseFinished(): Promise<string | void> {
    this.arrangeOrder();
    this.arrangeMinimizeIndex();
  }

  @TaskProcessor("window-minimize-finished")
  private async minimizeWindow(task: Task<string>): Promise<string | void> {
    const index = this.getWindowInfoIndex(task.value);
    const windowInfo = this.windowInfoList[index];

    const minimize = () => {
      windowInfo.isMinimized = true;
      windowInfo.isMinimizeAnimationEnd = false;
      window.setTimeout(() => {
        windowInfo.isMinimizeAnimationEnd = true;
      }, 200);

      this.arrangeMinimizeIndex();
    };

    if (windowInfo.status === "window") {
      minimize();
    } else {
      windowInfo.status = "window";
      setTimeout(minimize);
    }

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

    // 現在のサイズのまま、初期配置場所に設置しなおす
    const size = createSize(windowInfo.width, windowInfo.height);
    const point = calcWindowPosition(
      windowInfo.declare.position,
      size,
      getCssPxNum("--menu-bar-height")
    );
    windowInfo.x = point.x;
    windowInfo.y = point.y;

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
