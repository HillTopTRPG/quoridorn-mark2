<template>
  <table>
    <thead @contextmenu.prevent>
      <tr>
        <template v-for="(colDef, index) in tableDeclareInfo.columnList">
          <th
            :key="`header-${index}`"
            :title="colDef.title"
            :style="colStyle(0)"
          >
            <slot name="header" :columnDeclareInfo="colDef">
              {{ colDef.title }}
            </slot>
          </th>

          <divider
            :key="`header-div-${index}`"
            :index="index"
            :tableKey="tableKey"
            @hover="divHover"
            @moveStart="divMoveStart"
            @doubleClick="doubleClick"
            v-if="index < tableDeclareInfo.columnList.length - 1"
          />
        </template>
      </tr>
    </thead>
    <tbody>
      <!-- コンテンツ -->
      <tr
        v-for="data in dataList"
        :key="data.key"
        @click="selectLine(data.key)"
        :class="{ isActive: selectLineKey === data.key }"
      >
        <template v-for="(colDef, index) in tableDeclareInfo.columnList">
          <td :style="colStyle(index)" :key="`body-${index}`">
            <slot
              name="header"
              :columnDeclareInfo="colDef"
              :data="data"
              :index="index"
            >
              <span>{{ data[colDef.target] }}</span>
            </slot>
          </td>

          <divider
            :key="`body-div-${index}`"
            :index="index"
            :tableKey="tableKey"
            @hover="divHover"
            @moveStart="divMoveStart"
            @doubleClick="doubleClick"
            v-if="index < tableDeclareInfo.columnList.length - 1"
          />
        </template>
      </tr>
      <!-- 余白 -->
      <tr class="space">
        <template v-for="(colDef, index) in tableDeclareInfo.columnList">
          <td :style="colStyle(index)" :key="`margin-${index}`"></td>

          <divider
            :key="`margin-div-${index}`"
            :index="index"
            :tableKey="tableKey"
            @hover="divHover"
            @moveStart="divMoveStart"
            @doubleClick="doubleClick"
            v-if="index < tableDeclareInfo.columnList.length - 1"
          />
        </template>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts">
import { Component } from "vue-mixin-decorator";
import { Prop, Vue } from "vue-property-decorator";
import Divider from "@/app/core/component/table/Divider.vue";
import {
  WindowInfo,
  WindowTableDeclareInfo,
  WindowTableInfo
} from "@/@types/window";
import TaskManager, { MouseMoveParam } from "@/app/core/task/TaskManager";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task } from "@/@types/task";
import { Point } from "@/@types/address";
import { createPoint, format, getEventPoint } from "@/app/core/Coordinate";

@Component({
  components: { Divider }
})
export default class TableComponent extends Vue {
  @Prop({ type: Number, required: true })
  private tableIndex!: number;
  @Prop({ type: String, required: true })
  private status!: string;
  @Prop({ type: Object, required: true })
  private windowInfo!: WindowInfo;
  @Prop({ type: Array, required: true })
  private dataList!: any[];

  private dragFrom: Point = createPoint(0, 0);
  private fromLeftWidth: number = 0;
  private fromRightWidth: number = 0;
  private selectLineKey: string | null = null;

  private get tableInfo(): WindowTableInfo {
    return this.windowInfo.tableInfoList[this.tableIndex];
  }

  private get tableDeclareInfo(): WindowTableDeclareInfo {
    return this.windowInfo.declare.tableInfoList[this.tableIndex];
  }

  private get tableKey(): string {
    return `${this.windowInfo.key}-${this.status}-table-${this.tableIndex}`;
  }

  private leftDown(event: MouseEvent | TouchEvent, divIndex: number): void {
    TaskManager.instance.setTaskParam<MouseMoveParam>("mouse-moving-finished", {
      key: this.tableKey,
      type: `div-${divIndex}`
    });
    TaskManager.instance.setTaskParam<MouseMoveParam>(
      "mouse-move-end-left-finished",
      {
        key: this.tableKey,
        type: `div-${divIndex}`
      }
    );
  }

  @TaskProcessor("mouse-move-end-left-finished")
  private async mouseLeftUpFinished(
    task: Task<Point>,
    param: MouseMoveParam
  ): Promise<string | void> {
    if (!param || param.key !== this.tableKey) return;

    TaskManager.instance.setTaskParam("mouse-moving-finished", null);
    TaskManager.instance.setTaskParam("mouse-move-end-left-finished", null);
  }

  @TaskProcessor("mouse-moving-finished")
  private async mouseMoveFinished(
    task: Task<Point>,
    param: MouseMoveParam
  ): Promise<string | void> {
    if (!param || param.key !== this.tableKey) return;
    window.console.log(
      this.tableKey,
      format(task.value),
      this.fromLeftWidth,
      ",",
      this.fromRightWidth
    );
    const leftIndex = parseInt(param.type.replace("div-", ""), 10);
    const rightIndex = leftIndex + 1;
    const point = task.value!;
    const diffX = point.x - this.dragFrom.x;
    window.console.log(
      `left: ${this.tableInfo.columnWidthList[leftIndex]} -> ${this
        .fromLeftWidth + diffX}`
    );
    window.console.log(
      `right: ${this.tableInfo.columnWidthList[rightIndex]} -> ${this
        .fromRightWidth - diffX}`
    );
    this.tableInfo.columnWidthList[leftIndex] = this.fromLeftWidth + diffX;
    this.tableInfo.columnWidthList[rightIndex] = this.fromRightWidth - diffX;
  }

  private get colStyle() {
    return (index: number) => ({
      width: `${this.tableInfo.columnWidthList[index]}px`
    });
  }

  private divHover() {
    window.console.log("divHover");
  }

  private divMoveStart(event: MouseEvent | TouchEvent, index: number) {
    this.dragFrom = getEventPoint(event);
    window.console.log("divMoveStart", format(this.dragFrom));
    const leftIndex = index;
    const rightIndex = leftIndex + 1;

    this.fromLeftWidth = this.tableInfo.columnWidthList[leftIndex];
    this.fromRightWidth = this.tableInfo.columnWidthList[rightIndex];
  }

  private doubleClick() {
    window.console.log("doubleClick");
  }
}
</script>

<style lang="scss">
table {
  table-layout: fixed;

  td:not(.divider),
  th {
    overflow: hidden;
    display: block;
  }
}
</style>
