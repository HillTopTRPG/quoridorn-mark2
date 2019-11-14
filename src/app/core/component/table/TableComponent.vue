<template>
  <simple-tab-component :tabList="tabList" v-model="currentTabInfo">
    <simple-table-component
      :tableIndex="tableIndex"
      :status="status"
      :windowInfo="windowInfo"
      :dataList="dataList"
      :keyProp="keyProp"
      :tabInfo="currentTabInfo"
      :rowClassGetter="rowClassGetter"
      :selectLock="selectLock"
      v-model="localValue"
      @doubleClick="doubleClick"
      @adjustWidth="adjustWidth"
      @enter="enter"
    >
      <template #header="{ colDec }">
        <slot name="header" :colDec="colDec" />
      </template>
      <template #contents="{ colDec, data, index }">
        <slot name="contents" :colDec="colDec" :data="data" :index="index" />
      </template>
    </simple-table-component>
  </simple-tab-component>
</template>

<script lang="ts">
import { Component } from "vue-mixin-decorator";
import { Emit, Prop, Vue, Watch } from "vue-property-decorator";
import { TabInfo, WindowInfo, WindowTableDeclareInfo } from "@/@types/window";
import SimpleTableComponent from "@/app/core/component/table/SimpleTableComponent.vue";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";

@Component({
  components: { SimpleTabComponent, SimpleTableComponent }
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
  @Prop({ type: Boolean, required: false, default: false })
  private selectLock!: boolean;
  @Prop({ required: true })
  private value!: string | number | null;

  @Emit("input")
  public input(val: string | number | null) {}

  public get localValue(): string | number | null {
    return this.value;
  }

  public set localValue(val: string | number | null) {
    this.input(val);
  }

  private tabList: TabInfo[] = [];
  private currentTabInfo: TabInfo | null = null;

  private get tableDeclareInfo(): WindowTableDeclareInfo {
    return this.windowInfo.declare.tableInfoList[this.tableIndex];
  }

  @Emit("adjustWidth")
  private adjustWidth(totalWidth: number) {}

  @Emit("selectLine")
  private selectLine(key: string | number) {}

  @Emit("doubleClick")
  private doubleClick(key: string | number) {}

  @Emit("enter")
  private enter(key: string | number | null) {}

  @Watch("dataList", { deep: true, immediate: true })
  private onChangeDataList() {
    const tabList: TabInfo[] = [];
    if (this.tableDeclareInfo.classificationType === "range") {
      const ordinal: number = this.tableDeclareInfo.classificationOrdinal!;
      let useChoice: number = this.dataList.length;

      if (this.tableDeclareInfo.height !== undefined && useChoice > 50) {
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
          const tabInfo: TabInfo = {
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
}
</script>

<style lang="scss">
@import "../../../../assets/common";
</style>
