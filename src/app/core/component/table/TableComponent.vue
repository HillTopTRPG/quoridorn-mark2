<template>
  <simple-tab-component
    :windowKey="windowInfo.key"
    :tabList="tabList"
    v-model="currentTabInfo"
  >
    <simple-table-component
      :tableIndex="tableIndex"
      :status="status"
      :windowInfo="windowInfo"
      :dataList="viewDataList"
      :keyProp="keyProp"
      :tabInfo="currentTabInfo"
      :rowClassGetter="rowClassGetter"
      :selectLock="selectLock"
      :isUseHeaderI18n="isUseHeaderI18n"
      v-model="localValue"
      @doubleClick="doubleClick"
      @adjustWidth="adjustWidth"
      @enter="enter"
    >
      <template #header="{ colDec }">
        <slot name="header" :colDec="colDec" />
      </template>
      <template #contents="{ colDec, data, index }">
        <keep-alive>
          <slot name="contents" :colDec="colDec" :data="data" :index="index" />
        </keep-alive>
      </template>
    </simple-table-component>
  </simple-tab-component>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import { Prop, Watch } from "vue-property-decorator";
import SimpleTabComponent from "../SimpleTabComponent.vue";
import SimpleTableComponent from "./SimpleTableComponent.vue";
import { permissionCheck } from "../../api/app-server/SocketFacade";
import { TabInfo, WindowInfo, WindowTableDeclareInfo } from "@/@types/window";
import VueEvent from "../../decorator/VueEvent";
import ComponentVue from "@/app/core/window/ComponentVue";
import { convertNumberZero } from "@/app/core/utility/PrimaryDataUtility";

@Component({
  components: { SimpleTabComponent, SimpleTableComponent }
})
export default class TableComponent extends Mixins<ComponentVue>(ComponentVue) {
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
  @Prop({ type: Boolean, required: false, default: true })
  private isUseHeaderI18n!: boolean;
  @Prop({ required: true })
  private value!: string | number | null;

  public input(val: string | number | null) {
    this.$emit("input", val);
  }

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

  @Watch("value")
  private onChangeValue() {
    const num = convertNumberZero(this.value?.toString() || "");
    const tab = this.tabList.find(t =>
      typeof t.target === "string"
        ? t.target === this.value
        : t.target.from <= num && num <= t.target.to
    );
    if (tab) this.currentTabInfo = tab;
  }

  @VueEvent
  private adjustWidth(totalWidth: number) {
    this.$emit("adjustWidth", totalWidth);
  }

  @VueEvent
  private selectLine(key: string | number) {
    this.$emit("selectLine", key);
  }

  @VueEvent
  private doubleClick(key: string | number) {
    this.$emit("doubleClick", key);
  }

  @VueEvent
  private enter(key: string | number | null) {
    this.$emit("enter", key);
  }

  private get useDataList() {
    return this.dataList.filter(d => permissionCheck(d, "view"));
  }

  @VueEvent
  private get viewDataList() {
    if (this.currentTabInfo) {
      if (typeof this.currentTabInfo.target === "string") {
        const targetProp = this.tableDeclareInfo.classificationProp;
        const propList = targetProp.split(".");
        const getTargetValue = (data: any, propList: string[]): any => {
          const value: any = data[propList.shift()!];
          return propList.length ? getTargetValue(value, propList) : value;
        };
        const target = this.currentTabInfo.target;
        return this.dataList.filter(
          (row: any) =>
            getTargetValue(row, propList.concat()) === target &&
            permissionCheck(row, "view")
        );
      } else {
        const from = this.currentTabInfo.target.from;
        const to = this.currentTabInfo.target.to;
        return this.dataList.filter(
          (row, index) =>
            from <= index && index <= to && permissionCheck(row, "view")
        );
      }
    } else {
      return this.useDataList;
    }
  }

  @Watch("useDataList", { deep: true, immediate: true })
  private onChangeDataList() {
    try {
      const tabList: TabInfo[] = [];
      if (this.tableDeclareInfo.classificationType === "range") {
        const ordinal: number = this.tableDeclareInfo.classificationOrdinal!;
        let useChoice: number = this.useDataList.length;

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

          for (useChoice of choiceList) {
            if (this.useDataList.length / useChoice <= 10) break;
          }

          let current: number = 0;
          while (current < this.useDataList.length) {
            const tabInfo: TabInfo = {
              key: (current + ordinal).toString(),
              text: `${current + ordinal}-`,
              target: {
                from: current,
                to: Math.min(
                  current + useChoice - 1,
                  this.useDataList.length - 1
                )
              },
              isDisabled: false
            };
            if (!this.currentTabInfo) {
              this.currentTabInfo = tabInfo;
            }
            tabList.push(tabInfo);
            current += useChoice;
          }
        }
      } else if (this.tableDeclareInfo.classificationType === "string") {
        const prop: string = this.tableDeclareInfo.classificationProp;
        const propList = prop.split(".");
        const getTargetValue = (data: any, propList: string[]): any => {
          const value: any = data[propList.shift()!];
          return propList.length ? getTargetValue(value, propList) : value;
        };
        const targetValueList: any[] = [];
        this.useDataList.forEach(data => {
          const propValue = getTargetValue(data, propList.concat());
          if (targetValueList.indexOf(propValue) === -1)
            targetValueList.push(propValue);
        });
        targetValueList.forEach((val, index: number) => {
          const tabInfo: TabInfo = {
            key: val.toString(),
            text: val.toString(),
            target: val.toString(),
            isDisabled: false
          };
          if (!index && !this.currentTabInfo) this.currentTabInfo = tabInfo;
          tabList.push(tabInfo);
        });
      }
      this.tabList = tabList;
      this.onChangeValue();
    } catch (e) {
      console.error(e);
    }
  }
}
</script>

<style lang="scss">
@import "../../../../assets/common";
</style>
