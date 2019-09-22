<template>
  <div id="window-area">
    <component
      v-for="windowInfo in windowInfoContainer"
      :key="windowInfo.key"
      :is="windowInfo.type"
      :windowInfo="windowInfo"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import TestWindow from "@/app/basic/common/window/TestWindow.vue";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import Logging from "@/app/core/logger/Logging";
import { Task } from "@/@types/task";
import { WindowInfo, WindowTableInfo, WindowTaskInfo } from "@/@types/window";

@Component({
  components: { TestWindow }
})
export default class WindowArea extends Vue {
  private windowInfoContainer: {
    [key: number]: WindowInfo;
  } = {};
  private key: number = 0;

  @TaskProcessor("open-window-finished")
  @Logging
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

    this.windowInfoContainer[this.key] = {
      key: this.key,
      type: windowTaskInfo.type,
      declare: windowTaskInfo.declare,
      parentKey: windowTaskInfo.parentKey,
      title: windowTaskInfo.declare.title,
      message: windowTaskInfo.declare.message,
      x: 200,
      y: 200,
      width: 500,
      height: 300,
      order: 0,
      isLocked: false,
      isMinimized: false,
      tableInfoList
    };
    this.key++;
  }

  @TaskProcessor("close-window-finished")
  @Logging
  private async closeWindow(task: Task<WindowInfo>): Promise<string | void> {
    if (!task.value) return;
    const windowInfo: WindowInfo = task.value;
    delete this.windowInfoContainer[windowInfo.key];
  }
}
</script>

<style scoped lang="scss">
.window-area {
  position: relative;
}
</style>
