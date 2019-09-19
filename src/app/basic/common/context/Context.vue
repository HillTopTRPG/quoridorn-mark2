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
import TaskManager from "@/app/core/TaskManager";
import {
  ContextDeclareInfo,
  ContextItemDeclareInfo,
  ContextTaskInfo
} from "@/@types/context";
import { Task } from "@/@types/task";
import Logging from "@/app/basic/common/decorator/Logging";
import { SimpleCompareInfo } from "@/@types/compare";
import { Getter } from "vuex-class";
import { judgeCompare } from "@/app/core/Compare";

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

  constructor() {
    super();

    TaskManager.instance.addTaskListener<ContextTaskInfo>(
      "open-context-finished",
      this.openContextFinished
    );
  }

  private get contextStyle() {
    return {
      top: (this.y || 0) - 5 + "px",
      left: (this.x || 0) - 5 + "px"
    };
  }

  private emitEvent(emitName: string) {
    window.console.log(emitName);
    this.$emit(emitName);
  }

  private hide() {
    this.type = null;
  }

  @Logging()
  private async openContextFinished(
    task: Task<ContextTaskInfo>
  ): Promise<string | void> {
    this.type = task.value!.type;
    this.target = task.value!.target;
    this.x = task.value!.x;
    this.y = task.value!.y;

    this.itemList.length = 0;

    const itemInfoList: ContextItemDeclareInfo[] = contextInfo[this.type];
    if (!itemInfoList) return;
    itemInfoList.forEach((item: ContextItemDeclareInfo | null) => {
      if (!item) {
        this.itemList.push({ type: "hr" });
        return;
      }
      if (!judgeCompare(item.isViewCompare, this.target, this.getObj)) return;
      if (!item.text) {
        this.itemList.push({
          type: "hr"
        });
        return;
      }
      this.itemList.push({
        type: "item",
        text: item.text || "default",
        emitName: item.emitName || "default"
      });
    });
  }
}
</script>

<style lang="scss">
.context {
  position: fixed;
  z-index: 90;
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

    &:not(.disabled):hover {
      background-color: lightblue;
    }

    &.disabled {
      background-color: lightgrey;
    }
  }
}
</style>
