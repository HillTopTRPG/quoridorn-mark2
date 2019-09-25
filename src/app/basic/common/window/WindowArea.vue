<template>
  <div id="window-area">
    <component
      v-for="(windowInfo, key) in windowInfoContainer"
      :key="key"
      :is="windowInfo.type"
      :windowInfo="windowInfo"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import TestWindow from "@/app/basic/common/window/TestWindow.vue";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task } from "@/@types/task";
import { WindowInfo, WindowTableInfo, WindowTaskInfo } from "@/@types/window";
import { calcWindowPosition, createPoint } from "@/app/core/Coordinate";
import { Anchor, Point } from "@/@types/address";

@Component({
  components: { TestWindow }
})
export default class WindowArea extends Vue {
  private windowInfoContainer: WindowInfo[] = [];
  private key: number = 0;
  private readonly arrangeDistance = 24;

  @TaskProcessor("open-window-finished")
  private async openWindow(task: Task<WindowTaskInfo>): Promise<string | void> {
    if (!task.value) return;
    const windowTaskInfo: WindowTaskInfo = task.value;

    const tableInfoList: WindowTableInfo[] = windowTaskInfo.declare.tableInfoList.map(
      tableInfo => ({
        selectLineKey: null,
        hoverLineIndex: null,
        operateDividerIndex: null,
        columnWidthList: tableInfo.initColumnWidthList.concat()
      })
    );

    const menuHeight = 30;
    const windowSize = windowTaskInfo.declare.size;
    const position = windowTaskInfo.declare.position;
    const point = calcWindowPosition(position, windowSize, menuHeight);

    this.arrangePoint(point, position);

    this.windowInfoContainer.push({
      key: this.key,
      title: windowTaskInfo.declare.title,
      message: windowTaskInfo.declare.message,
      ...windowTaskInfo,
      ...point,
      ...windowSize,
      order: this.windowInfoContainer.length,
      isLocked: false,
      isMinimized: false,
      minimizeIndex: 0,
      isMinimizeAnimationEnd: false,
      tableInfoList
    });
    this.key++;

    // 登録したタスクに完了通知
    if (task.resolve) task.resolve(task);
  }

  private arrangePoint(
    point: Point,
    position: Point | Anchor,
    uncheckKey?: number
  ) {
    this.windowInfoContainer.forEach(info => {
      if (uncheckKey !== undefined && info.key === uncheckKey) return;
      if (info.isMinimized) return;
      if (info.x !== point.x || info.y !== point.y) return;
      const arrange: Point = createPoint(
        this.arrangeDistance,
        this.arrangeDistance
      );
      if (typeof position === "string") {
        if (position.toString().indexOf("right") > -1) arrange.x *= -1;
        if (position.toString().indexOf("bottom") > -1) arrange.y *= -1;
      }
      point.x += arrange.x;
      point.y += arrange.y;
      this.arrangePoint(point, position, uncheckKey);
    });
  }

  @TaskProcessor("close-window-finished")
  private async closeWindow(task: Task<string>): Promise<string | void> {
    const index = this.getWindowInfoIndex(task.value);
    this.windowInfoContainer.splice(index, 1);

    this.arrangeOrder();
    this.arrangeMinimizeIndex();

    // 登録したタスクに完了通知
    if (task.resolve) task.resolve(task);
  }

  @TaskProcessor("minimize-window-finished")
  private async minimizeWindow(task: Task<string>): Promise<string | void> {
    const index = this.getWindowInfoIndex(task.value);
    const windowInfo = this.windowInfoContainer[index];
    windowInfo.isMinimized = true;
    windowInfo.isMinimizeAnimationEnd = false;
    window.setTimeout(() => {
      windowInfo.isMinimizeAnimationEnd = true;
    }, 200);

    this.arrangeMinimizeIndex();

    // 登録したタスクに完了通知
    if (task.resolve) task.resolve(task);
  }

  @TaskProcessor("normalize-window-finished")
  private async normalizeWindow(task: Task<string>): Promise<string | void> {
    const index = this.getWindowInfoIndex(task.value);
    const windowInfo = this.windowInfoContainer[index];
    windowInfo.isMinimized = false;
    windowInfo.isMinimizeAnimationEnd = false;

    this.arrangeMinimizeIndex();

    // 登録したタスクに完了通知
    if (task.resolve) task.resolve(task);
  }

  @TaskProcessor("active-window-finished")
  private async activeWindow(task: Task<string>): Promise<string | void> {
    const index = this.getWindowInfoIndex(task.value);
    const windowInfo = this.windowInfoContainer[index];
    windowInfo.order = this.windowInfoContainer.length;

    this.arrangeOrder();

    const point = createPoint(windowInfo.x, windowInfo.y);
    this.arrangePoint(point, windowInfo.declare.position, windowInfo.key);
    windowInfo.x = point.x;
    windowInfo.y = point.y;

    // 登録したタスクに完了通知
    if (task.resolve) task.resolve(task);
  }

  private arrangeOrder() {
    this.windowInfoContainer
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
    this.windowInfoContainer
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
      this.windowInfoContainer
        .filter(info => info.isMinimized)
        .length.toString()
    );
  }

  private getWindowInfoIndex(windowKey: string | null): number {
    if (!windowKey) return -1;
    const key: number = parseInt(windowKey.split("-")[1], 10);
    return this.windowInfoContainer.findIndex(info => info.key === key);
  }
}
</script>

<style scoped lang="scss">
#window-area {
  position: relative;
  z-index: 10;
}
</style>
