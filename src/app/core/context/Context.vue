<template>
  <div
    class="context"
    v-if="type"
    @mouseleave.prevent="hide"
    @contextmenu.prevent
    ref="context"
  >
    <template v-for="(item, index) in itemList">
      <hr :key="index" v-if="item.type === 'hr'" />
      <div
        :key="index"
        v-if="item.type !== 'hr'"
        class="item"
        @click.left.stop="emitEvent(item.taskName, item.arg)"
      >
        {{ item.text }}
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-mixin-decorator";
import { Vue, Watch } from "vue-property-decorator";
import {
  ContextDeclareInfo,
  ContextItemDeclareInfo,
  ContextTaskInfo,
  ContextTextItem
} from "@/@types/context";
import { Task } from "@/@types/task";
import Logging from "../logger/Logging";
import { Getter } from "vuex-class";
import { judgeCompare } from "../Compare";
import TaskProcessor from "../task/TaskProcessor";
import TaskManager from "../task/TaskManager";
import WindowManager from "@/app/core/window/WindowManager";

const contextInfo: ContextDeclareInfo = require("../context.yaml");

type Item = {
  type: string;
  text?: string;
  taskName?: string;
  arg?: any;
};

@Component
export default class Context extends Vue {
  @Getter("getObj") private getObj!: (key: string) => any;
  private type: string | null = null;
  private target: string | null | undefined = null;
  private x: number | null = null;
  private y: number | null = null;

  private key = "context";

  private itemList: Item[] = [];

  private getContextElm(): HTMLDivElement {
    return this.$refs.context as HTMLDivElement;
  }

  @Watch("x")
  @Watch("isMounted")
  private onChangeX() {
    if (this.x === null) return;
    this.getContextElm().style.setProperty("--x", `${this.x}px`);
  }

  @Watch("y")
  @Watch("isMounted")
  private onChangeY() {
    if (this.y === null) return;
    this.getContextElm().style.setProperty("--y", `${this.y}px`);
  }

  private async emitEvent(taskName: string, arg: any) {
    this.hide();
    await TaskManager.instance.ignition<any>({
      type: taskName,
      owner: "Quoridorn",
      value: arg
    });
  }

  private hide() {
    this.type = null;
  }

  @TaskProcessor("window-open-opening")
  private async windowOpenOpening(task: Task<string>): Promise<string | void> {
    WindowManager.instance.open(task.value!);
  }

  @TaskProcessor("context-open-finished")
  private async openContextFinished(
    task: Task<ContextTaskInfo>
  ): Promise<string | void> {
    this.type = task.value!.type;
    this.target = task.value!.target;
    setTimeout(() => {
      this.x = task.value!.x - 5;
      this.y = task.value!.y - 5;
    });

    // 表示項目をリセット
    this.itemList.length = 0;

    // 定義を元に要素を構築していく
    const itemInfoList: ContextItemDeclareInfo[] = contextInfo[this.type];
    if (!itemInfoList) return;
    itemInfoList.forEach((item: ContextItemDeclareInfo | null) => {
      // 要素がnullだったら区切り線
      if (!item) {
        this.itemList.push({ type: "hr" });
        return;
      }

      // 項目を表示するかどうかの判定
      if (!judgeCompare(item.isViewCompare, this.target, this.getObj)) return;

      // 項目の判定と追加
      const contextTextItem: ContextTextItem<unknown> = item as ContextTextItem<
        unknown
      >;

      // テキスト項目の追加
      if (contextTextItem.taskName && contextTextItem.text) {
        this.itemList.push({
          type: "item",
          taskName: contextTextItem.taskName || "default",
          text: contextTextItem.text || "default",
          arg: contextTextItem.taskArg
        });
        return;
      }

      // 区切り線を追加
      this.itemList.push({
        type: "hr"
      });
    });

    // 登録したタスクに完了通知
    if (task.resolve) task.resolve(task);
  }
}
</script>

<style lang="scss">
.context {
  position: fixed;
  z-index: 11;
  padding: 0;
  min-width: 50px;
  background-color: white;
  border: solid gray 1px;
  box-sizing: border-box;
  cursor: default;
  left: var(--x);
  top: var(--y);

  > * {
    display: block;
    min-width: 50px;
    font-size: 14px;
    padding: 0 5px;
    line-height: 1.8em;
    cursor: pointer;

    &:not(.disabled):hover {
      background-color: lightblue;
    }

    &.disabled {
      background-color: lightgrey;
    }
  }
}
</style>
