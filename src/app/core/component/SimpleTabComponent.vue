<template>
  <div class="simple-tab-component" ref="elm">
    <div class="tab-area">
      <div
        class="tab index"
        v-for="(tab, index) in tabList"
        :class="{ isActive: tab.text === localValue.text }"
        :key="index"
        @click="localValue = tab"
        tabindex="0"
        @keydown.space.prevent="localValue = tab"
      >
        {{ tab.text }}
      </div>
    </div>
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import { Prop, Watch } from "vue-property-decorator";
import { TabInfo } from "@/@types/window";
import SimpleTableComponent from "@/app/core/component/table/SimpleTableComponent.vue";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { TabMoveInfo } from "task-info";
import { Task, TaskResult } from "task";
import ComponentVue from "@/app/core/window/ComponentVue";

@Component({
  components: { SimpleTableComponent }
})
export default class SimpleTabComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Array, required: true })
  private tabList!: TabInfo[];

  @Prop({ type: Boolean, required: false, default: false })
  private selectLock!: boolean;

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
      const idx = inputElmList.findIndex(elm => !elm.disabled);
      if (idx >= 0) inputElmList[idx].focus();
    });
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
    let idx = this.tabList.findIndex(
      t => JSON.stringify(t) === JSON.stringify(this.localValue)
    );
    idx += addIndex;
    if (idx < 0) idx = this.tabList.length - 1;
    if (idx >= this.tabList.length) idx = 0;
    this.localValue = this.tabList[idx];
  }
}
</script>

<style lang="scss">
@import "../../../assets/common";
.simple-tab-component {
  @include flex-box(column, flex-start, flex-start);
}
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
    box-sizing: border-box;
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
