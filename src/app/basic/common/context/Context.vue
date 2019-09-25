<template>
  <div
    class="context"
    v-if="type"
    :style="contextStyle"
    @mouseleave.prevent="hide"
    @contextmenu.prevent
  >
    <template v-for="(item, index) in itemList">
      <hr :key="index" v-if="item.type === 'hr'" />
      <div
        :key="index"
        v-if="item.type !== 'hr'"
        class="item"
        @click.left.stop="emitEvent(item.emitName)"
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
  ContextTaskInfo,
  ContextTextItem
} from "@/@types/context";
import { Task } from "@/@types/task";
import Logging from "@/app/core/logger/Logging";
import { Getter } from "vuex-class";
import { judgeCompare } from "@/app/core/Compare";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import TaskManager from "@/app/core/task/TaskManager";

const contextInfo: ContextDeclareInfo = require("./context.yaml");

type Item = {
  type: string;
  text?: string;
  emitName?: string;
};

@Component
export default class Context extends Vue {
  @Getter("getObj") private getObj!: (key: string) => any;
  private type: string | null = null;
  private target: string | null | undefined = null;
  private x: number | null = null;
  private y: number | null = null;

  private itemList: Item[] = [];

  private get contextStyle() {
    return {
      top: (this.y || 0) - 5 + "px",
      left: (this.x || 0) - 5 + "px"
    };
  }

  // @Logging
  private async emitEvent(emitName: string) {
    this.hide();
    await TaskManager.instance.resistTask({
      type: emitName,
      owner: "Quoridorn",
      isPrivate: true,
      isExclusion: false,
      isIgniteWithParam: false,
      isLastValueCapture: false,
      value: null,
      statusList: ["finished"]
    });
  }

  private hide() {
    this.type = null;
  }

  @TaskProcessor("open-context-finished")
  @Logging
  private async openContextFinished(
    task: Task<ContextTaskInfo>
  ): Promise<string | void> {
    this.type = task.value!.type;
    this.target = task.value!.target;
    this.x = task.value!.x;
    this.y = task.value!.y;

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
      const contextTextItem: ContextTextItem = item as ContextTextItem;

      // テキスト項目の追加
      if (contextTextItem.emitName && contextTextItem.text) {
        this.itemList.push({
          type: "item",
          emitName: contextTextItem.emitName || "default",
          text: contextTextItem.text || "default"
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
