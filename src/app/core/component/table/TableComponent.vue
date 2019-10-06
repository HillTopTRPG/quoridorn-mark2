<template>
  <div class="table-container">
    <table
      ref="table"
      :class="{
        isStretchRight:
          windowInfo.status === 'right-pane' &&
          tableDeclareInfo.type.startsWith('free'),
        isStretchLeft:
          windowInfo.status !== 'right-pane' &&
          tableDeclareInfo.type.startsWith('free')
      }"
    >
      <thead>
        <tr>
          <template v-for="(colDec, index) in tableDeclareInfo.columnList">
            <!-- 区切り線 -->
            <divider
              :key="`header-div-${index}`"
              :index="index"
              @moveStart="divMoveStart"
              @doubleClick="adjustWidth"
              v-if="
                index !== 0 ||
                  (windowInfo.status === 'right-pane' &&
                    tableDeclareInfo.type.startsWith('free'))
              "
            />
            <!-- セル -->
            <th
              :key="`header-${index}`"
              :title="colDec.title"
              :style="colStyle(index)"
              :class="colDec | align"
              ref="column"
            >
              <slot name="header" :colDec="colDec">
                {{ colDec.title }}
              </slot>
            </th>
          </template>

          <!-- 区切り線 -->
          <divider
            :key="`header-div-${tableDeclareInfo.columnList.length}`"
            :index="tableDeclareInfo.columnList.length"
            @moveStart="divMoveStart"
            @doubleClick="adjustWidth"
            v-if="
              windowInfo.status !== 'right-pane' &&
                tableDeclareInfo.type.startsWith('free')
            "
          />
        </tr>
      </thead>
      <tbody>
        <!-- コンテンツ -->
        <tr
          v-for="data in dataList"
          :key="data.key"
          :class="{
            isSelected: selectLineKey === data.key,
            isHovered: hoverLineKey === data.key,
            doubleClicked: doubleClickKey === data.key
          }"
          @mouseenter="hoverTr(data.key)"
          @mouseleave="hoverTr(null)"
          @mousedown.left="selectTr(data.key)"
          @touchstart="selectTr(data.key)"
          @dblclick="doubleClick(data.key)"
        >
          <template v-for="(colDec, index) in tableDeclareInfo.columnList">
            <!-- 区切り線 -->
            <divider
              :key="`body-div-${index}`"
              :index="index"
              @moveStart="divMoveStart"
              @doubleClick="adjustWidth"
              v-if="
                index !== 0 ||
                  (windowInfo.status === 'right-pane' &&
                    tableDeclareInfo.type.startsWith('free'))
              "
            />

            <!-- セル -->
            <td
              :style="colStyle(index)"
              :key="`body-${index}`"
              class="selectable"
              :class="colDec | align"
            >
              <slot
                name="contents"
                :colDec="colDec"
                :data="data"
                :index="index"
              >
                <span>{{ data[colDec.target] }}</span>
              </slot>
            </td>
          </template>

          <!-- 区切り線 -->
          <divider
            :key="`header-div-${tableDeclareInfo.columnList.length}`"
            :index="tableDeclareInfo.columnList.length"
            @moveStart="divMoveStart"
            @doubleClick="adjustWidth"
            v-if="
              windowInfo.status !== 'right-pane' &&
                tableDeclareInfo.type.startsWith('free')
            "
          />
        </tr>
        <!-- 余白 -->
        <tr
          class="space"
          :class="{
            odd: dataList.length % 2 !== 0,
            even: dataList.length % 2 === 0
          }"
        >
          <template v-for="(colDec, index) in tableDeclareInfo.columnList">
            <!-- 区切り線 -->
            <divider
              :key="`margin-div-${index}`"
              :index="index"
              @moveStart="divMoveStart"
              @doubleClick="adjustWidth"
              v-if="
                index !== 0 ||
                  (windowInfo.status === 'right-pane' &&
                    tableDeclareInfo.type.startsWith('free'))
              "
            />

            <!-- 余白 -->
            <td :style="colStyle(index)" :key="`margin-${index}`"></td>
          </template>

          <!-- 区切り線 -->
          <divider
            :key="`header-div-${tableDeclareInfo.columnList.length}`"
            :index="tableDeclareInfo.columnList.length"
            @moveStart="divMoveStart"
            @doubleClick="adjustWidth"
            v-if="
              windowInfo.status !== 'right-pane' &&
                tableDeclareInfo.type.startsWith('free')
            "
          />
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-mixin-decorator";
import { Emit, Prop, Vue } from "vue-property-decorator";
import Divider from "@/app/core/component/table/Divider.vue";
import {
  WindowInfo,
  WindowTableColumn,
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
  components: { Divider },
  filters: {
    align: (data: WindowTableColumn) => {
      if (data.align === "left") return "align-left";
      if (data.align === "right") return "align-right";
      return "align-center";
    }
  }
})
export default class TableComponent extends Vue {
  @Prop({ type: Number, required: true })
  private tableIndex!: number;
  @Prop({ type: String, required: true })
  private status!: string;
  @Prop({ type: Object, required: true })
  private windowInfo!: WindowInfo<unknown>;
  @Prop({ type: Array, required: true })
  private dataList!: any[];

  private dragFrom: Point = createPoint(0, 0);
  private fromLeftWidth: number = 0;
  private fromRightWidth: number = 0;
  private fromLastWidth: number = 0;
  private selectLineKey: string | null = null;
  private hoverLineKey: string | null = null;
  private doubleClickKey: string | null = null;

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

    const leftIndex = parseInt(param.type!.replace("div-", ""), 10) - 1;
    const point = task.value!;
    const diffX = point.x - this.dragFrom.x;

    this.adjust(
      leftIndex + (this.status !== "right-pane" ? 0 : 1),
      leftIndex + (this.status !== "right-pane" ? 1 : 0),
      this.fromLeftWidth + diffX * (this.status !== "right-pane" ? 1 : -1),
      this.fromRightWidth,
      this.fromLastWidth,
      diffX
    );
  }

  private adjustWidth(index: number) {
    const leftIndex = index - 1 + (this.status !== "right-pane" ? 0 : 1);
    const columns = this.$refs.column as HTMLTableRowElement[];
    const element = columns[leftIndex];
    const text = element.innerText;
    let newLeftWidth = calcStrWidth(element, text);

    this.adjust(
      leftIndex,
      index - 1 + (this.status !== "right-pane" ? 1 : 0),
      newLeftWidth,
      this.fromRightWidth,
      this.fromLastWidth,
      this.fromLeftWidth - newLeftWidth
    );
  }

  private adjust(
    leftIndex: number,
    rightIndex: number,
    newLeftWidth: number,
    newRightWidth: number,
    newLastWidth: number,
    diffX: number
  ) {
    if (this.tableDeclareInfo.type === "free" && newLeftWidth < 20) {
      newLeftWidth = 20;
    }
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
    if (0 <= rightIndex && rightIndex < list.length) {
      list.splice(rightIndex, 1, newRightWidth);
      if (leftIndex < list.length - 1) {
        list.splice(list.length - 1, 1, newLastWidth);
      }
    }

    if (this.tableDeclareInfo.type === "free") {
      const totalWidth: number = list.reduce(
        (accumulator: number, currentValue: number) => {
          return accumulator + currentValue + 1;
        },
        1
      );
      this.adjustEmit(totalWidth);
    }
  }

  @Emit("adjustWidth")
  private adjustEmit(totalWidth: number) {}

  private get colStyle() {
    return (index: number) => ({
      width: `${this.tableInfo.columnWidthList[index]}px`
    });
  }

  private hoverTr(key: string) {
    this.hoverLineKey = key;
  }

  @Emit("selectLine")
  private selectTr(key: string) {
    this.selectLineKey = key;
  }

  private doubleClickTimeoutId: number | null = null;
  @Emit("doubleClick")
  private doubleClick(key: string) {
    this.doubleClickKey = key;
    if (this.doubleClickTimeoutId !== null) {
      clearTimeout(this.doubleClickTimeoutId);
    }
    this.doubleClickTimeoutId = window.setTimeout(() => {
      this.doubleClickKey = null;
      this.doubleClickTimeoutId = null;
    }, 100);
  }

  private divMoveStart(event: MouseEvent | TouchEvent, index: number) {
    this.dragFrom = getEventPoint(event);
    const leftIndex = index - 1 + (this.status !== "right-pane" ? 0 : 1);
    const rightIndex = index - 1 + (this.status !== "right-pane" ? 1 : 0);

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
}
</script>

<style lang="scss">
@import "../../../../assets/common";

$lineHeight: 2em;

.table-container {
  overflow: auto;
  width: 100%;

  table {
    table-layout: fixed;
    border-collapse: collapse;
    border-spacing: 0;
    border: 1px solid gray;

    &.isStretchRight {
      border-left: none;
    }

    &.isStretchLeft {
      border-right: none;
    }

    tr {
      height: $lineHeight;

      &.isSelected {
        background-color: rgba(77, 196, 255, 1) !important;
      }

      &:not(.isSelected).isHovered {
        background-color: rgba(191, 228, 255, 1) !important;
      }

      &.doubleClicked {
        outline: 2px solid rgb(255, 75, 0);
        outline-offset: -2px;
      }

      &.space {
        height: auto;
        background-size: calc(#{$lineHeight} * 2) calc(#{$lineHeight} * 2);

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
      overflow: hidden;
      height: $lineHeight;
      padding: 0;
      box-sizing: border-box;

      &.align-left {
        @include flex-box(row, flex-start, center);
        padding-left: var(--cell-padding);
      }

      &.align-center {
        @include flex-box(row, center, center);
      }

      &.align-right {
        @include flex-box(row, flex-end, center);
        padding-right: var(--cell-padding);
      }
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
