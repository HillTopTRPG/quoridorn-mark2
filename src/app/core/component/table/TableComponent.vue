<template>
  <div class="table-container">
    <table
      ref="table"
      :class="{ isFreeWidth: tableDeclareInfo.type === 'free' }"
    >
      <thead>
        <tr>
          <template v-for="(colDef, index) in tableDeclareInfo.columnList">
            <!-- セル -->
            <th
              class="selectable"
              :key="`header-${index}`"
              :title="colDef.title"
              :style="colStyle(index)"
              ref="column"
            >
              <slot name="header" :columnDeclareInfo="colDef">
                {{ colDef.title }}
              </slot>
            </th>

            <!-- 区切り線 -->
            <divider
              :key="`header-div-${index}`"
              :index="index"
              @hover="divHover"
              @moveStart="divMoveStart"
              @doubleClick="doubleClick"
              v-if="
                tableDeclareInfo.type === 'free' ||
                  index < tableDeclareInfo.columnList.length - 1
              "
            />
          </template>
        </tr>
      </thead>
      <tbody>
        <!-- コンテンツ -->
        <tr
          v-for="data in dataList"
          :key="data.key"
          :class="{ isActive: selectLineKey === data.key }"
        >
          <template v-for="(colDef, index) in tableDeclareInfo.columnList">
            <!-- セル -->
            <td
              :style="colStyle(index)"
              :key="`body-${index}`"
              class="selectable"
            >
              <slot
                name="header"
                :columnDeclareInfo="colDef"
                :data="data"
                :index="index"
              >
                <span>{{ data[colDef.target] }}</span>
              </slot>
            </td>

            <!-- 区切り線 -->
            <divider
              :key="`body-div-${index}`"
              :index="index"
              @hover="divHover"
              @moveStart="divMoveStart"
              @doubleClick="doubleClick"
              v-if="
                tableDeclareInfo.type === 'free' ||
                  index < tableDeclareInfo.columnList.length - 1
              "
            />
          </template>
        </tr>
        <!-- 余白 -->
        <tr
          class="space"
          :class="{
            odd: dataList.length % 2 !== 0,
            even: dataList.length % 2 === 0
          }"
        >
          <template v-for="(colDef, index) in tableDeclareInfo.columnList">
            <!-- 余白 -->
            <td :style="colStyle(index)" :key="`margin-${index}`"></td>

            <!-- 区切り線 -->
            <divider
              :key="`margin-div-${index}`"
              :index="index"
              @hover="divHover"
              @moveStart="divMoveStart"
              @doubleClick="doubleClick"
              v-if="
                tableDeclareInfo.type === 'free' ||
                  index < tableDeclareInfo.columnList.length - 1
              "
            />
          </template>
        </tr>
      </tbody>
    </table>
  </div>
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
import {
  calcStrWidth,
  createPoint,
  getEventPoint
} from "@/app/core/Coordinate";

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
  private fromLastWidth: number = 0;
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

    const leftIndex = parseInt(param.type.replace("div-", ""), 10);
    const rightIndex = leftIndex + 1;
    const point = task.value!;
    const diffX = point.x - this.dragFrom.x;

    let newLeftWidth = this.fromLeftWidth + diffX;
    let newRightWidth = this.fromRightWidth;
    let newLastWidth = this.fromLastWidth;

    if (this.tableDeclareInfo.type === "free" && newLeftWidth < 20)
      newLeftWidth = 20;
    if (this.tableDeclareInfo.type === "fix-on-side") {
      newRightWidth = this.fromRightWidth - diffX;
      if (newLeftWidth < 20) {
        newLeftWidth = 20;
        newRightWidth = this.fromRightWidth + this.fromLeftWidth - 20;
      }
      if (newRightWidth < 20) {
        newRightWidth = 20;
        newLeftWidth = this.fromRightWidth + this.fromLeftWidth - 20;
      }
    }
    if (this.tableDeclareInfo.type === "fix-on-right") {
      newLastWidth = this.fromLastWidth - diffX;
      if (newLeftWidth < 20) {
        newLeftWidth = 20;
        newLastWidth = this.fromLastWidth + this.fromLeftWidth - 20;
      }
      if (newLastWidth < 20) {
        newLastWidth = 20;
        newLeftWidth = this.fromLastWidth + this.fromLeftWidth - 20;
      }
    }

    const list = this.tableInfo.columnWidthList;
    list.splice(leftIndex, 1, newLeftWidth);
    list.splice(rightIndex, 1, newRightWidth);
    list.splice(list.length - 1, 1, newLastWidth);
  }

  private get colStyle() {
    return (index: number) => ({
      width: `${this.tableInfo.columnWidthList[index]}px`
    });
  }

  private divHover() {
    // window.console.log("divHover");
  }

  private divMoveStart(event: MouseEvent | TouchEvent, index: number) {
    this.dragFrom = getEventPoint(event);
    const leftIndex = index;
    const rightIndex = leftIndex + 1;

    const list = this.tableInfo.columnWidthList;
    this.fromLeftWidth = list[leftIndex];
    this.fromRightWidth = list[rightIndex];
    this.fromLastWidth = list[list.length - 1];

    TaskManager.instance.setTaskParam<MouseMoveParam>("mouse-moving-finished", {
      key: this.tableKey,
      type: `div-${index}`
    });
    TaskManager.instance.setTaskParam<MouseMoveParam>(
      "mouse-move-end-left-finished",
      {
        key: this.tableKey,
        type: `div-${index}`
      }
    );
  }

  private doubleClick(index: number) {
    const leftIndex = index;
    const rightIndex = leftIndex + 1;

    const columns = this.$refs.column;
    const element = columns[index];
    const text = element.innerText;

    let newLeftWidth = calcStrWidth(element, text);
    let newRightWidth = this.fromRightWidth;
    let newLastWidth = this.fromLastWidth;

    if (this.tableDeclareInfo.type === "free" && newLeftWidth < 20)
      newLeftWidth = 20;
    if (this.tableDeclareInfo.type === "fix-on-side") {
      newRightWidth = this.fromRightWidth + this.fromLeftWidth - newLeftWidth;
      if (newLeftWidth < 20) {
        newLeftWidth = 20;
        newRightWidth = this.fromRightWidth + this.fromLeftWidth - 20;
      }
      if (newRightWidth < 20) {
        newRightWidth = 20;
        newLeftWidth = this.fromRightWidth + this.fromLeftWidth - 20;
      }
    }
    if (this.tableDeclareInfo.type === "fix-on-right") {
      newLastWidth = this.fromLastWidth + this.fromLeftWidth - newLeftWidth;
      if (newLeftWidth < 20) {
        newLeftWidth = 20;
        newLastWidth = this.fromLastWidth + this.fromLeftWidth - 20;
      }
      if (newLastWidth < 20) {
        newLastWidth = 20;
        newLeftWidth = this.fromLastWidth + this.fromLeftWidth - 20;
      }
    }

    const list = this.tableInfo.columnWidthList;
    list.splice(leftIndex, 1, newLeftWidth);
    list.splice(rightIndex, 1, newRightWidth);
    list.splice(list.length - 1, 1, newLastWidth);
  }
}
</script>

<style lang="scss">
@import "../../../../assets/common";
.table-container {
  overflow: auto;
  width: 100%;

  table {
    table-layout: fixed;
    border-collapse: collapse;
    border-spacing: 0;
    border: 1px solid gray;
    height: 300px;

    &.isFreeWidth {
      border-right: none;
    }

    tr {
      height: 2em;

      &.space {
        height: auto;
        background-size: 4em 4em;

        &.odd {
          background-image: linear-gradient(
            0deg,
            white 0%,
            white 50%,
            rgb(247, 247, 247) 51%,
            rgb(247, 247, 247) 100%
          );
        }
        &.even {
          background-image: linear-gradient(
            0deg,
            rgb(247, 247, 247) 0%,
            rgb(247, 247, 247) 50%,
            white 51%,
            white 100%
          );
        }
      }
    }

    td:not(.divider),
    th {
      @include flex-box(row, center, center);
      overflow: hidden;
      height: 100%;
    }

    thead {
      border-bottom: 1px solid gray;

      tr {
        background: linear-gradient(
          to bottom,
          rgba(255, 255, 255, 1) 0%,
          rgba(234, 234, 234, 1) 100%
        );
      }
    }

    tbody {
      tr {
        &:nth-child(odd) {
          background-color: white;
        }
        &:nth-child(even) {
          background-color: rgb(247, 247, 247);
        }
      }
    }
  }
}
</style>
