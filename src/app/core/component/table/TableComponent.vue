<template>
  <div class="table-area" ref="tableArea">
    <div class="tab-area">
      <div
        class="tab"
        v-for="(tab, index) in tabList"
        :class="{ isActive: tab.text === currentTabInfo.text }"
        :key="index"
        @click="selectTab(tab)"
      >
        {{ tab.text }}
      </div>
    </div>
    <simple-table-component
      :tableIndex="tableIndex"
      :status="status"
      :windowInfo="windowInfo"
      :dataList="dataList"
      :keyProp="keyProp"
      :tableTabInfo="currentTabInfo"
      :rowClassGetter="rowClassGetter"
      @selectLine="selectLine"
      @doubleClick="doubleClick"
      @adjustWidth="adjustWidth"
    >
      <template #header="{ colDec }">
        <slot name="header" :colDec="colDec" />
      </template>
      <template #contents="{ colDec, data, index }">
        <slot name="contents" :colDec="colDec" :data="data" :index="index" />
      </template>
    </simple-table-component>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-mixin-decorator";
import { Emit, Prop, Vue, Watch } from "vue-property-decorator";
import {
  TableTabInfo,
  WindowInfo,
  WindowTableDeclareInfo
} from "@/@types/window";
import SimpleTableComponent from "@/app/core/component/table/SimpleTableComponent.vue";
import VueEvent from "@/app/core/decorator/VueEvent";

@Component({
  components: { SimpleTableComponent }
})
export default class TableComponent extends Vue {
  @Prop({ type: Number, required: true })
  private tableIndex!: number;
  @Prop({ type: String, required: true })
  private status!: string;
  @Prop({ type: Object, required: true })
  private windowInfo!: WindowInfo<any>;
  @Prop({ type: Array, required: true })
  private dataList!: any[];
  @Prop({ type: String, required: false, default: "key" })
  private keyProp!: string;
  @Prop({ type: Function, required: false, default: () => [] })
  private rowClassGetter!: (data: any) => string[];

  private tabList: TableTabInfo[] = [];
  private currentTabInfo: TableTabInfo | null = null;

  private get tableDeclareInfo(): WindowTableDeclareInfo {
    return this.windowInfo.declare.tableInfoList[this.tableIndex];
  }

  @Emit("adjustWidth")
  private adjustWidth(totalWidth: number) {}

  @Emit("selectLine")
  private selectLine(key: string | number) {}

  @Emit("doubleClick")
  private doubleClick(key: string | number) {}

  @Watch("dataList", { deep: true, immediate: true })
  private onChangeDataList() {
    const tabList: TableTabInfo[] = [];
    if (this.tableDeclareInfo.classificationType === "range") {
      const ordinal: number = this.tableDeclareInfo.classificationOrdinal!;
      let useChoice: number = this.dataList.length;

      if (useChoice > 50) {
        const choiceList = [];
        let choice: number = this.tableDeclareInfo.height;
        if (choice < 100) {
          do {
            choice += this.tableDeclareInfo.height;
            choiceList.push(choice);
          } while (choice < 100);
        }
        if (choice !== 100) choiceList.push(100);
        choiceList.push(...[150, 200, 250, 300, 350, 400, 450, 500]);

        for (useChoice of choiceList)
          if (this.dataList.length / useChoice <= 10) break;

        let current: number = 0;
        let isFirst = true;
        while (current < this.dataList.length) {
          const tabInfo: TableTabInfo = {
            text: `${current + ordinal}-`,
            target: {
              from: current,
              to: Math.min(current + useChoice - 1, this.dataList.length - 1)
            }
          };
          if (
            !this.currentTabInfo ||
            (isFirst &&
              (this.currentTabInfo.text !== tabInfo.text ||
                (typeof this.currentTabInfo.target !== "string" &&
                  typeof tabInfo.target !== "string" &&
                  this.currentTabInfo.target.from !== tabInfo.target.from) ||
                (typeof this.currentTabInfo.target !== "string" &&
                  typeof tabInfo.target !== "string" &&
                  this.currentTabInfo.target.to !== tabInfo.target.to)))
          ) {
            this.currentTabInfo = tabInfo;
          }
          tabList.push(tabInfo);
          current += useChoice;
          isFirst = false;
        }
      }
    } else if (this.tableDeclareInfo.classificationType === "string") {
      const prop: string = this.tableDeclareInfo.classificationProp;
      const targetValueList: any[] = [];
      this.dataList.forEach(data => {
        if (targetValueList.indexOf(data[prop]) === -1)
          targetValueList.push(data[prop]);
      });
      targetValueList.forEach(val => {
        tabList.push({
          text: val.toString(),
          target: val.toString()
        });
      });
    }
    this.tabList = tabList;
  }

  @VueEvent
  private selectTab(tab: TableTabInfo) {
    this.currentTabInfo = tab;
  }
}
</script>

<style lang="scss">
@import "../../../../assets/common";
.tab-area {
  @include flex-box(row, flex-start, center);

  .tab {
    @include flex-box(row, center, center);
    background: linear-gradient(
      to bottom,
      rgba(240, 240, 240, 1),
      rgba(200, 200, 200, 1)
    );
    border: 1px solid gray;
    box-sizing: content-box;
    cursor: pointer;
    border-bottom-width: 0;
    border-radius: 5px 5px 0 0;
    padding: 0 0.5em;
    height: var(--table-row-height);
    min-width: var(--table-row-height);
    font-weight: bold;

    &.isActive {
      background: white;
      border-color: #0092ed;
    }
  }
}
</style>
