<template>
  <div
    class="context"
    v-if="type"
    @mouseleave.prevent="hide"
    @contextmenu.prevent
    ref="context"
  >
    <div class="title">{{ title }}</div>
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
import { Vue } from "vue-property-decorator";
import {
  ContextDeclareInfo,
  ContextItemDeclareInfo,
  ContextTaskInfo
} from "@/@types/context";
import { Task, TaskResult } from "@/@types/task";
import { judgeCompare } from "../Compare";
import TaskProcessor from "../task/TaskProcessor";
import TaskManager from "../task/TaskManager";
import VueEvent from "@/app/core/decorator/VueEvent";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import { clone } from "@/app/core/Utility";
import LanguageManager from "@/LanguageManager";

const contextInfo: ContextDeclareInfo = require("../context.yaml");

type Item = {
  type: string;
  text?: string;
  taskName?: string;
  arg?: any;
};

@Component
export default class Context extends Vue {
  private type: string | null = null;
  private target: string | null = null;
  private x: number | null = null;
  private y: number | null = null;

  private key = "context";
  private title: string = "";

  private itemList: Item[] = [];

  private getContextElm(): HTMLDivElement {
    return this.$refs.context as HTMLDivElement;
  }

  /**
   * 表示イベント
   * @param task
   */
  @TaskProcessor("context-open-finished")
  private async openContextFinished(
    task: Task<ContextTaskInfo, never>
  ): Promise<TaskResult<never> | void> {
    this.type = task.value!.type;
    this.target = task.value!.target;
    this.x = task.value!.x - 5;
    this.y = task.value!.y - 5;

    this.title = LanguageManager.instance.getText(`type.${this.type}`);

    window.console.log(
      `【CONTEXT OPEN】 type: ${this.type} target: ${this.target}`
    );

    // 表示項目をリセット
    this.itemList.length = 0;

    // 定義を元に要素を構築していく
    const itemInfoList: ContextItemDeclareInfo[] = contextInfo[this.type!];
    if (!itemInfoList) return;

    // 直列の非同期で全部実行する
    await itemInfoList
      .map((item: ContextItemDeclareInfo | null) => () => this.addItem(item))
      .reduce((prev, curr) => prev.then(curr), Promise.resolve());

    task.resolve();
  }

  /**
   * 項目追加
   * @param item
   */
  private async addItem(item: ContextItemDeclareInfo | null) {
    const contextItem: ContextItemDeclareInfo = clone<ContextItemDeclareInfo>(
      item
    );

    // 要素がnullだったら区切り線
    if (!contextItem) {
      this.itemList.push({ type: "hr" });
      return;
    }

    // 項目を表示するかどうかの判定
    if (
      !(await judgeCompare(contextItem!.isViewCompare, this.type, this.target))
    )
      return;

    // テキスト項目の追加
    if ("text" in contextItem) {
      const argObj = {
        type: this.type,
        docId: this.target
      };
      if (!contextItem.taskArg) {
        contextItem.taskArg = {
          args: argObj
        };
      }
      if (!contextItem.taskArg.arg) {
        contextItem.taskArg.args = argObj;
      }
      this.itemList.push({
        type: "item",
        taskName: contextItem.taskName || "default",
        text: contextItem.text || "default",
        arg: contextItem.taskArg
      });
      return;
    }

    // 区切り線を追加
    this.itemList.push({
      type: "hr"
    });
  }

  /**
   * 項目選択
   * @param taskName
   * @param arg
   */
  @VueEvent
  private async emitEvent(taskName: string, arg: any) {
    this.hide();
    await TaskManager.instance.ignition<any, never>({
      type: taskName,
      owner: "Quoridorn",
      value: arg
    });
  }

  /**
   * 非表示処理
   */
  private hide() {
    this.type = null;
  }

  /**
   * 表示座標制御
   */
  @LifeCycle
  private updated() {
    const elm = this.getContextElm();
    if (!elm) return;
    elm.style.setProperty("--x", `${this.x}px`);
    elm.style.setProperty("--y", `${this.y}px`);
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
  top: calc(var(--y) - 1.8em);

  > * {
    display: block;
    min-width: 50px;
    font-size: 14px;
    padding: 0 5px;
    line-height: 1.8em;
    cursor: pointer;

    &.title {
      background-color: var(--uni-color-blue);
      color: var(--uni-color-white);
      font-weight: bold;
      cursor: default;
    }

    &:not(.title):not(.disabled):hover {
      background-color: lightblue;
    }

    &.disabled {
      background-color: lightgrey;
    }
  }
}
</style>
