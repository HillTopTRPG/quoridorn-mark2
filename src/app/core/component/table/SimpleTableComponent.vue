<template>
  <div class="table-container" ref="tableContainer">
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
              v-if="hasLeftDivider(index)"
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
            v-if="hasLastDivider()"
          />
        </tr>
      </thead>
      <tbody @scroll="onWheelBody()">
        <template v-if="!isColWidthMoving">
          <!-- 余白 -->
          <tr class="table-padding-top">
            <td
              v-for="(colDec, index) in tableDeclareInfo.columnList"
              :style="colStyle(index)"
              :key="`margin-${index}`"
              :colspan="getColspan(index)"
              :class="colClass(colDec, index)"
            ></td>
          </tr>
          <!-- コンテンツ -->
          <template v-for="row in rowList">
            <tr
              :key="row.data[keyProp]"
              :class="getRowClass(row)"
              @mousedown.left="selectTr(row.data[keyProp])"
              @touchstart="selectTr(row.data[keyProp])"
              @dblclick="doubleClick(row)"
            >
              <!-- セル -->
              <td
                v-for="(colDec, index) in tableDeclareInfo.columnList"
                :style="colStyle(index)"
                :key="`body-${index}`"
                class="selectable"
                :colspan="getColspan(index)"
                :class="colClass(colDec, index)"
              >
                <keep-alive>
                  <slot
                    name="contents"
                    :colDec="colDec"
                    :data="row.data"
                    :index="index"
                  >
                    <span>{{ row.data[colDec.target] }}</span>
                  </slot>
                </keep-alive>
              </td>
            </tr>
          </template>

          <!-- 余白 -->
          <tr
            class="table-padding-bottom"
            :class="{
              odd: (dataList.length - viewRowLastIndex + 1) % 2 !== 0,
              even: (dataList.length - viewRowLastIndex + 1) % 2 === 0
            }"
          >
            <td
              v-for="(colDec, index) in tableDeclareInfo.columnList"
              :style="colStyle(index)"
              :key="`margin-${index}`"
              :colspan="getColspan(index)"
              :class="colClass(colDec, index)"
            ></td>
          </tr>
        </template>
      </tbody>
      <tfoot>
        <!-- 余白 -->
        <tr>
          <td
            v-for="(colDec, index) in tableDeclareInfo.columnList"
            :style="colStyle(index)"
            :key="`margin-${index}`"
            :colspan="getColspan(index)"
            :class="colClass(colDec, index)"
          ></td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-mixin-decorator";
import { Emit, Prop, Vue, Watch } from "vue-property-decorator";
import Divider from "@/app/core/component/table/Divider.vue";
import {
  TableTabInfo,
  WindowInfo,
  WindowMoveInfo,
  WindowTableColumn,
  WindowTableDeclareInfo,
  WindowTableInfo
} from "@/@types/window";
import TaskManager, { MouseMoveParam } from "@/app/core/task/TaskManager";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "@/@types/task";
import { Point } from "@/@types/address";
import {
  calcStrWidth,
  createPoint,
  getEventPoint
} from "@/app/core/Coordinate";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import VueEvent from "@/app/core/decorator/VueEvent";
import { getCssPxNum } from "@/app/core/Css";

type RowInfo<T> = {
  isSelected: boolean;
  isDoubleClick: boolean;
  dataListIndex: number;
  data: T;
};

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
export default class SimpleTableComponent extends Vue {
  @Prop({ type: Number, required: true })
  private tableIndex!: number;
  @Prop({ type: String, required: true })
  private status!: string;
  @Prop({ type: Object, required: true })
  private windowInfo!: WindowInfo<any>;
  @Prop({ type: Object, required: false, default: null })
  private tableTabInfo!: TableTabInfo | null;
  @Prop({ type: Array, required: true })
  private dataList!: any[];
  @Prop({ type: String, required: false, default: "key" })
  private keyProp!: string;
  @Prop({ type: Function, required: false, default: () => [] })
  private rowClassGetter!: (data: any) => string[];
  @Prop({ type: Boolean, required: false, default: false })
  private selectLock!: boolean;

  private isMounted: boolean = false;
  private dragFrom: Point = createPoint(0, 0);
  private fromLeftWidth: number = 0;
  private fromRightWidth: number = 0;
  private fromLastWidth: number = 0;
  private rowList: RowInfo<any>[] = [];

  private doubleClickTimeoutId: number | null = null;

  private selectedKey: string | number | null = null;
  private doubleClickedKey: string | number | null = null;

  private isColWidthMoving: boolean = false;

  private viewRowFirstIndex: number = 0;
  private viewRowLastIndex: number = 0;
  private marginRowNum: number = 4;
  private saveScrollTop: number = 0;

  private saveTabInfo: TableTabInfo | null = null;

  @LifeCycle
  private mounted() {
    // this.viewRowFirstIndex = 0;
    // this.viewRowLastIndex =
    //   this.tableDeclareInfo.height - 1 + this.marginRowNum;
    this.isMounted = true;
  }

  @VueEvent
  private hasLeftDivider(index: number): boolean {
    return (
      index !== 0 ||
      (this.windowInfo.status === "right-pane" &&
        this.tableDeclareInfo.type.startsWith("free"))
    );
  }

  @VueEvent
  private getColspan(index: number): number {
    let colspan: number = 1;
    if (this.hasLeftDivider(index)) colspan++;
    if (this.hasLastDivider()) colspan++;
    return colspan;
  }

  @VueEvent
  private hasLastDivider(): boolean {
    return (
      this.windowInfo.status !== "right-pane" &&
      this.tableDeclareInfo.type.startsWith("free")
    );
  }

  @TaskProcessor("window-font-size-finished")
  private async windowFontSizeFinished(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value !== this.windowInfo.key) return;
    if (!this.isMounted) return;
    setTimeout(() => {
      this.arrangeViewRow();
    });
  }

  @TaskProcessor("window-move-end-finished")
  private async windowMoveEndFinished(
    task: Task<WindowMoveInfo, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value!.windowKey !== this.windowInfo.key) return;
    if (!this.isMounted) return;
    setTimeout(() => {
      this.elm.querySelector("tbody")!.scrollTop = this.saveScrollTop;
      this.arrangeViewRow();
    });
  }

  @Watch("tableTabInfo")
  private onChangeTableTabInfo() {
    if (!this.isMounted) return;
    if (
      !this.saveTabInfo ||
      !this.tableTabInfo ||
      this.saveTabInfo.text !== this.tableTabInfo.text ||
      typeof this.saveTabInfo.target !== typeof this.tableTabInfo.target ||
      (typeof this.saveTabInfo.target === "string" &&
        this.saveTabInfo.target !== this.tableTabInfo.target) ||
      (typeof this.saveTabInfo.target !== "string" &&
        typeof this.tableTabInfo.target !== "string" &&
        (this.saveTabInfo.target.from !== this.tableTabInfo.target.from ||
          this.saveTabInfo.target.to !== this.tableTabInfo.target.to))
    ) {
      setTimeout(() => {
        this.elm.querySelector("tbody")!.scrollTop = 0;
        this.arrangeViewRow();
      });
    }
    this.saveTabInfo = this.tableTabInfo;
  }

  @Watch("isMounted")
  @Watch("viewRowFirstIndex")
  @Watch("tableTabInfo")
  @Watch("viewRowLastIndex")
  @Watch("dataList", { deep: true })
  private onChangeDataList() {
    let rowList = this.dataList.map((data, index) => {
      return {
        isSelected: data[this.keyProp] === this.selectedKey,
        isDoubleClick: data[this.keyProp] === this.doubleClickedKey,
        dataListIndex: index,
        data
      };
    });
    if (this.tableTabInfo) {
      if (typeof this.tableTabInfo.target === "string") {
        const targetProp = this.tableDeclareInfo.classificationProp;
        const target = this.tableTabInfo.target;
        rowList = rowList.filter((row: any) => row[targetProp] === target);
      } else {
        const from = this.tableTabInfo.target.from;
        const to = this.tableTabInfo.target.to;
        rowList = rowList.filter((row, index) => from <= index && index <= to);
      }
    }
    if (this.isMounted) {
      // this.elm.style.setProperty(
      //   "--table-padding-bottom-rows",
      //   (rowList.length - this.viewRowLastIndex - 1).toString()
      // );
      // this.elm.style.setProperty(
      //   "--table-padding-top-rows",
      //   this.viewRowFirstIndex.toString()
      // );
      setTimeout(() => {
        this.elm.querySelector("tbody")!.scrollTop = this.saveScrollTop;
      });
    }
    this.rowList = rowList.filter(
      (row, index) =>
        index >= this.viewRowFirstIndex &&
        (!this.viewRowLastIndex || index <= this.viewRowLastIndex)
    );
  }

  private get tableInfo(): WindowTableInfo {
    return this.windowInfo.tableInfoList[this.tableIndex];
  }

  private get tableDeclareInfo(): WindowTableDeclareInfo {
    return this.windowInfo.declare.tableInfoList[this.tableIndex];
  }

  private get key(): string {
    let key: string =
      this.keyProp in this.windowInfo
        ? ((this.windowInfo as any)[this.keyProp] as string)
        : "";
    return `${key}-${this.status}-table-${this.tableIndex}`;
  }

  @TaskProcessor("mouse-move-end-left-finished")
  private async mouseLeftUpFinished(
    task: Task<Point, never>,
    param: MouseMoveParam
  ): Promise<TaskResult<never> | void> {
    if (!param || param.key !== this.key) return;

    if (this.isColWidthMoving) {
      setTimeout(() => {
        this.elm.querySelector("tbody")!.scrollTop = this.saveScrollTop;
        this.arrangeViewRow();
      });
      this.isColWidthMoving = false;
    }
    TaskManager.instance.setTaskParam("mouse-moving-finished", null);
    TaskManager.instance.setTaskParam("mouse-move-end-left-finished", null);

    task.resolve();
  }

  @TaskProcessor("mouse-moving-finished")
  private async mouseMoveFinished(
    task: Task<Point, never>,
    param: MouseMoveParam
  ): Promise<TaskResult<never> | void> {
    if (!param || param.key !== this.key) return;

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

    task.resolve();
  }

  private timerId: number | null = null;
  @VueEvent
  private onWheelBody() {
    if (this.timerId !== null) clearTimeout(this.timerId);
    this.timerId = window.setTimeout(this.arrangeViewRow.bind(this), 100);
  }

  private arrangeViewRow() {
    const target = this.elm.querySelector("tbody")!;
    const scrollTop = target.scrollTop;
    const tableHeight = target.getBoundingClientRect().height;
    const lineHeight = getCssPxNum("--table-row-height", this.elm);

    // 算出
    const newFirst = Math.floor(scrollTop / lineHeight) - this.marginRowNum;
    const newLast =
      Math.ceil((tableHeight + scrollTop) / lineHeight) - 1 + this.marginRowNum;

    // 設定
    if (!this.isColWidthMoving) this.saveScrollTop = scrollTop;
    // this.viewRowFirstIndex = Math.max(0, newFirst);
    // this.viewRowLastIndex = Math.min(this.dataList.length - 1, newLast);

    this.timerId = null;
  }

  @VueEvent
  private leftDown(event: MouseEvent | TouchEvent, divIndex: number): void {
    TaskManager.instance.setTaskParam<MouseMoveParam>("mouse-moving-finished", {
      key: this.key,
      type: `div-${divIndex}`
    });
    TaskManager.instance.setTaskParam<MouseMoveParam>(
      "mouse-move-end-left-finished",
      {
        key: this.key,
        type: `div-${divIndex}`
      }
    );
  }

  @VueEvent
  private getRowClass(row: RowInfo<any>): string[] {
    const rowClass = this.rowClassGetter(row.data);
    if (row.isSelected) rowClass.push("isSelected");
    if (row.isDoubleClick) rowClass.push("doubleClicked");
    rowClass.push(row.dataListIndex % 2 === 0 ? "even" : "odd");
    return rowClass;
  }

  @VueEvent
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

  @VueEvent
  private doubleClick(row: RowInfo<any>) {
    const key = row.data[this.keyProp];
    this.doubleClickedKey = key;
    row.isDoubleClick = true;
    if (this.doubleClickTimeoutId !== null) {
      clearTimeout(this.doubleClickTimeoutId);
    }
    this.doubleClickTimeoutId = window.setTimeout(() => {
      this.doubleClickedKey = null;
      row.isDoubleClick = false;
      this.doubleClickTimeoutId = null;
    }, 100);
    this.$emit("doubleClick", key);
  }

  @VueEvent
  private divMoveStart(event: MouseEvent | TouchEvent, index: number) {
    this.dragFrom = getEventPoint(event);
    const leftIndex = index - 1 + (this.status !== "right-pane" ? 0 : 1);
    const rightIndex = index - 1 + (this.status !== "right-pane" ? 1 : 0);

    const list = this.tableInfo.columnWidthList;
    this.fromLeftWidth = list[leftIndex];
    this.fromRightWidth = list[rightIndex];
    this.fromLastWidth = list[list.length - 1];

    this.isColWidthMoving = true;
    TaskManager.instance.setTaskParam<MouseMoveParam>("mouse-moving-finished", {
      key: this.key,
      type: `div-${index}`
    });
    TaskManager.instance.setTaskParam<MouseMoveParam>(
      "mouse-move-end-left-finished",
      {
        key: this.key,
        type: `div-${index}`
      }
    );
  }

  @VueEvent
  private colStyle(index: number) {
    return {
      width: `var(--col-${index}-width)`
    };
  }

  @VueEvent
  private colClass(colData: WindowTableColumn, index: number) {
    let align: string = "align-center";
    if (colData.align === "left") align = "align-left";
    if (colData.align === "right") align = "align-right";
    const result: string[] = [align];
    if (this.hasLeftDivider(index)) result.push("border-left");
    if (
      this.hasLastDivider() &&
      this.tableDeclareInfo.columnList.length - 1 === index
    )
      result.push("border-right");

    return result;
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

    this.elm.style.setProperty(`--col-${leftIndex}-width`, `${newLeftWidth}px`);
    list.splice(leftIndex, 1, newLeftWidth);
    if (0 <= rightIndex && rightIndex < list.length) {
      this.elm.style.setProperty(
        `--col-${rightIndex}-width`,
        `${newRightWidth}px`
      );
      list.splice(rightIndex, 1, newRightWidth);
      if (leftIndex < list.length - 1) {
        this.elm.style.setProperty(
          `--col-${list.length - 1}-width`,
          `${newLastWidth}px`
        );
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

  @VueEvent
  private selectTr(key: string | number) {
    if (this.selectLock) return;
    this.rowList.forEach(row => {
      row.isSelected = row.data[this.keyProp] === key;
    });
    this.selectedKey = key;
    this.$emit("selectLine", key);
  }

  private get elm() {
    return this.$refs.tableContainer as HTMLElement;
  }

  @Watch("isMounted")
  @Watch("tableDeclareInfo.columnList", { deep: true })
  private onChangeTableDeclareInfo() {
    this.tableDeclareInfo.columnList.forEach((col, index) => {
      this.elm.style.setProperty(`--col-${index}-width`, `${col.width}px`);
    });
  }

  @Watch("isMounted")
  @Watch("tableDeclareInfo.height")
  private onChangeHeight() {
    const height = this.tableDeclareInfo.height;
    this.elm.style.setProperty(
      "--tableHeight",
      height ? `calc(${height + 1} * var(--table-row-height))` : "auto"
    );
  }
}
</script>

<style lang="scss">
@import "../../../../assets/common";

.table-container {
  width: 100%;

  table {
    position: relative;
    table-layout: fixed;
    border-collapse: collapse;
    border-spacing: 0;
    border: 1px solid gray;
    width: 100%;
    height: calc(var(--tableHeight) + 3px);

    /*
    &.isStretchRight {
      border-left: none;
    }

    &.isStretchLeft {
      border-right: none;
    }
    */

    tr {
      height: var(--table-row-height);
      display: flex;
    }

    td:not(.divider),
    th {
      overflow: hidden;
      padding: 0;
      box-sizing: content-box;

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

      &.border-left {
        border-left: 1px solid #b7babc;
      }

      &.border-right {
        border-right: 1px solid #b7babc;
      }
    }

    thead {
      border-bottom: 1px solid gray;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      padding-right: var(--scroll-bar-width);
      background: linear-gradient(
        to bottom,
        rgba(255, 255, 255, 1) 0%,
        rgba(234, 234, 234, 1) 100%
      );
      box-sizing: border-box;
      border-bottom: 1px solid gray;
    }

    tbody {
      overflow-y: scroll;
      position: absolute;
      top: calc(var(--table-row-height) + 1px);
      left: 0;
      right: 0;
      height: calc(var(--tableHeight) - var(--table-row-height));
      /*scroll-snap-type: y mandatory;*/

      tr {
        /*scroll-snap-align: start;*/

        &.table-padding-top {
          height: calc(var(--table-padding-top-rows) * var(--table-row-height));

          background-size: calc(var(--table-row-height) * 2)
            calc(var(--table-row-height) * 2);
          background-image: linear-gradient(
            0deg,
            rgb(247, 247, 247) 50%,
            white 51%
          );
        }
        &.table-padding-bottom {
          height: calc(
            var(--table-padding-bottom-rows) * var(--table-row-height)
          );

          &.even {
            background-size: calc(var(--table-row-height) * 2)
              calc(var(--table-row-height) * 2);
            background-image: linear-gradient(
              0deg,
              rgb(247, 247, 247) 50%,
              white 51%
            );
          }
          &.odd {
            background-size: calc(var(--table-row-height) * 2)
              calc(var(--table-row-height) * 2);
            background-image: linear-gradient(
              0deg,
              white 50%,
              rgb(247, 247, 247) 51%
            );
          }
        }

        &.even {
          background-color: white;
        }
        &.odd {
          background-color: rgb(247, 247, 247);
        }

        &.isSelected {
          background-color: var(--uni-color-skyblue) !important;
        }

        &:not(.isSelected):hover {
          background-color: var(--uni-color-light-skyblue) !important;
        }

        &.doubleClicked {
          outline: 2px solid var(--uni-color-red);
          outline-offset: -2px;
        }
      }
    }

    tfoot {
      position: absolute;
      top: calc(var(--table-row-height) + 1px);
      left: 0;
      right: 0;
      bottom: 0;
      padding-right: var(--scroll-bar-width);
      z-index: -1;

      tr {
        height: 100%;
        background-size: calc(var(--table-row-height) * 2)
          calc(var(--table-row-height) * 2);
        background-image: linear-gradient(
          0deg,
          rgb(247, 247, 247) 50%,
          white 51%
        );
      }
    }
  }
}
</style>
