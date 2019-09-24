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
import { Point } from "@/@types/address";

@Component({
  components: { TestWindow }
})
export default class WindowArea extends Vue {
  private windowInfoContainer: WindowInfo[] = [];
  private key: number = 0;

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
    const arrangeDistance = 24;
    const windowSize = windowTaskInfo.declare.size;
    const position = windowTaskInfo.declare.position;
    const point = calcWindowPosition(position, windowSize, menuHeight);

    const arrangePoint = () => {
      this.windowInfoContainer.forEach(info => {
        if (info.x !== point.x || info.y !== point.y) return;
        const arrange: Point = createPoint(arrangeDistance, arrangeDistance);
        if (typeof position === "string") {
          if (position.toString().indexOf("right") > -1) arrange.x *= -1;
          if (position.toString().indexOf("bottom") > -1) arrange.y *= -1;
        }
        point.x += arrange.x;
        point.y += arrange.y;
        arrangePoint();
      });
    };
    arrangePoint();

    this.windowInfoContainer.push({
      key: this.key,
      title: windowTaskInfo.declare.title,
      message: windowTaskInfo.declare.message,
      ...windowTaskInfo,
      ...point,
      ...windowSize,
      order: 0,
      isLocked: false,
      isMinimized: false,
      tableInfoList
    });
    this.key++;

    // 登録したタスクに完了通知
    if (task.resolve) task.resolve(task);
  }

  @TaskProcessor("close-window-finished")
  private async closeWindow(task: Task<string>): Promise<string | void> {
    const index = this.getWindowInfoIndex(task.value);
    this.windowInfoContainer.splice(index, 1);

    // 登録したタスクに完了通知
    if (task.resolve) task.resolve(task);
  }

  @TaskProcessor("minimize-window-finished")
  private async minimizeWindow(task: Task<string>): Promise<string | void> {
    const index = this.getWindowInfoIndex(task.value);
    const windowInfo = this.windowInfoContainer[index];
    windowInfo.isMinimized = true;

    // 登録したタスクに完了通知
    if (task.resolve) task.resolve(task);
  }

  @TaskProcessor("normalize-window-finished")
  private async normalizeWindow(task: Task<string>): Promise<string | void> {
    const index = this.getWindowInfoIndex(task.value);
    const windowInfo = this.windowInfoContainer[index];
    windowInfo.isMinimized = false;

    // 登録したタスクに完了通知
    if (task.resolve) task.resolve(task);
  }

  @TaskProcessor("active-window-finished")
  private async activeWindow(task: Task<string>): Promise<string | void> {
    const index = this.getWindowInfoIndex(task.value);
    const windowInfo = this.windowInfoContainer[index];
    windowInfo.order = this.windowInfoContainer.length;

    this.windowInfoContainer.forEach((info, i) => {
      if (i === index) return;
      info.order = i;
    });
  }

  private getWindowInfoIndex(windowKey: string): number {
    if (!windowKey) return -1;
    const key: number = parseInt(windowKey.split("-")[1], 10);
    return this.windowInfoContainer.findIndex(info => info.key === key);
  }
}
</script>

<style scoped lang="scss">
#window-area {
  position: relative;
}
</style>
