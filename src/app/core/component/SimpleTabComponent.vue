<template>
  <div class="simple-tab-component" ref="elm">
    <div class="tab-area">
      <div
        class="tab"
        v-for="(tab, index) in useTabList"
        :class="{ isActive: tab.key === localValue.key }"
        :style="{ '--over-color': tab.color }"
        :key="index"
        @click="onClickTab(tab)"
        tabindex="0"
        @keydown.space.prevent="localValue = tab"
      >
        <span>{{ tab.text }}</span>
      </div>
      <div class="tab setting" v-if="hasSetting" @click="$emit('settingOpen')">
        <span class="icon-cog"></span>
      </div>
    </div>
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import { Prop, Watch } from "vue-property-decorator";
import { TabMoveInfo } from "task-info";
import { Task, TaskResult } from "task";
import ComponentVue from "../window/ComponentVue";
import { TabInfo } from "@/@types/window";
import TaskProcessor from "../task/TaskProcessor";
import VueEvent from "@/app/core/decorator/VueEvent";

@Component
export default class SimpleTabComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Array, required: true })
  private tabList!: TabInfo[];

  private get useTabList() {
    return this.tabList.filter(tab => !tab.isDisabled);
  }

  @Prop({ type: Boolean, required: false, default: false })
  private selectLock!: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  private hasSetting!: boolean;

  @Prop({ type: Object, required: false, default: null })
  public value!: TabInfo | null;

  @Prop({ type: String, required: true })
  public windowKey!: string;

  public input(value: TabInfo | null) {
    this.$emit("input", value);
  }

  private get localValue(): TabInfo | null {
    return this.value;
  }

  private set localValue(value: TabInfo | null) {
    this.input(value);
  }

  @Watch("localValue")
  private onChangeLocalValue() {
    setTimeout(() => {
      const inputElmList = Array.prototype.slice.call(
        this.elm.getElementsByClassName("input")
      ) as HTMLInputElement[];
      const index = inputElmList.findIndex(elm => !elm.disabled);
      if (index >= 0) inputElmList[index].focus();
    });
  }

  @VueEvent
  private onClickTab(tab: TabInfo) {
    if (this.localValue !== tab) {
      this.localValue = tab;
      this.$emit("change");
    }
  }

  private get elm(): HTMLElement {
    return this.$refs.elm as HTMLElement;
  }

  @TaskProcessor("tab-move-finished")
  private async tabMoveFinished(
    task: Task<TabMoveInfo, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value!.windowKey !== this.windowKey) return;
    const addIndex = task.value!.addIndex;
    this.tabMove(addIndex);
  }

  private tabMove(addIndex: number) {
    let index = this.useTabList.findIndex(
      t => JSON.stringify(t) === JSON.stringify(this.localValue)
    );
    index += addIndex;
    if (index < 0) index = this.useTabList.length - 1;
    if (index >= this.useTabList.length) index = 0;
    this.localValue = this.useTabList[index];
  }
}
</script>

<style lang="scss">
@import "../../../assets/common";
.simple-tab-component {
  @include flex-box(column, stretch, flex-start);

  > :not(.tab-area) {
    z-index: 0;
  }
}
.tab-area {
  @include flex-box(row, flex-start, center);
  position: relative;
  z-index: 1;
  margin-bottom: -1px;
}

.tab {
  @include flex-box(row, center, center);
  position: relative;
  background: linear-gradient(
    to bottom,
    rgba(240, 240, 240, 1),
    rgba(200, 200, 200, 1)
  );
  border: 1px solid gray;
  box-sizing: border-box;
  cursor: pointer;
  border-bottom-width: 0;
  border-radius: 5px 5px 0 0;
  padding: 0 0.5em;
  height: var(--table-row-height);
  min-width: var(--table-row-height);
  font-weight: bold;

  &:before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    border-radius: 5px 5px 0 0;
    z-index: 0;
    background-color: var(--over-color);
  }

  span {
    z-index: 1;
  }

  &.isActive {
    background: white;
    border-color: var(--uni-color-blue);

    &:after {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      border-top: 3px solid var(--uni-color-blue);
    }
  }

  &.setting {
    position: absolute;
    right: 0;
  }
}
</style>
