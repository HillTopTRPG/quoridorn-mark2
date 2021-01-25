<template>
  <div id="context" v-if="type" @mouseleave.prevent="hide" @contextmenu.prevent>
    <div
      v-for="level in levelList"
      :key="level"
      :style="getLevelStyle(level)"
      class="level-box"
      :class="`level-${level}`"
    >
      <div class="title" v-if="level === 0">{{ title }}</div>
      <template v-for="(item, index) in getLevelItemList(level)">
        <hr
          :key="`${level}-${index}`"
          :style="getItemStyle(item)"
          v-if="item.type === 'hr'"
          @mouseenter="onHoverItem(level, index)"
        />
        <div
          :key="`${level}-${index}`"
          :style="getItemStyle(item)"
          v-if="item.type !== 'hr'"
          class="item"
          :class="[
            item.disabled ? 'disabled' : undefined,
            `level-${item.level}`,
            item.hasChild ? 'has-child' : undefined,
            hoverIndexList[level] === index ? 'selected' : undefined
          ]"
          @click.left.stop="emitEvent(item)"
          @mouseenter="onHoverItem(level, index)"
        >
          {{ item.isRawText ? item.text : $t(item.text) }}
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-mixin-decorator";
import { Vue } from "vue-property-decorator";
import {
  ContextDeclare,
  ContextDeclareInfo,
  ContextItemDeclare,
  ContextItemDeclareBlock,
  ContextItemDeclareInfo,
  ContextTaskInfo
} from "context";
import { Task, TaskResult } from "task";
import { judgeCompare } from "../utility/CompareUtility";
import TaskProcessor from "../task/TaskProcessor";
import TaskManager from "../task/TaskManager";
import VueEvent from "../decorator/VueEvent";
import { createPoint } from "../utility/CoordinateUtility";
import GameObjectManager from "../../basic/GameObjectManager";
import {
  clone,
  convertNumberZero,
  listToEmpty
} from "../utility/PrimaryDataUtility";
import LifeCycle from "../decorator/LifeCycle";
import { findByKey, findRequireByKey } from "../utility/Utility";
import {
  CounterRemoconModifyType,
  SceneObjectStore
} from "@/@types/store-data";
import { UpdateResourceInfo } from "task-info";

const contextInfo: ContextDeclare = require("../context.yaml");
const contextItemInfo: ContextItemDeclareBlock = require("../context-item.yaml");

type Item = {
  type: string;
  index: number;
  text?: string;
  isRawText?: boolean;
  taskName?: string;
  arg?: any;
  disabled?: boolean;
  level: number; // 階層
  parentIndex: string; // 親が上から何番目だったか
  hasChild: boolean; // 子要素があるか
};

@Component
export default class Context extends Vue {
  private type: string | null = null;
  private target: string | null = null;
  private pieceKey: string | undefined = undefined;
  private x: number | null = null;
  private y: number | null = null;
  private title: string = "";

  private itemList: Item[] = [];
  private itemListVolatile: Item[] = [];
  private hoverIndexList: number[] = [0];
  private hoverLevel: number = -1;
  private hoverIndex: number = -1;

  /**
   * 表示イベント
   * @param task
   */
  @TaskProcessor("context-open-finished")
  private async openContextFinished(
    task: Task<ContextTaskInfo, never>
  ): Promise<TaskResult<never> | void> {
    const type = task.value!.type;
    this.target = task.value!.target;
    this.pieceKey = task.value!.pieceKey;
    this.x = task.value!.x - 10;
    this.y = task.value!.y - 10;
    this.hoverIndexList = [0];

    // 表示項目をリセット
    this.hoverLevel = -1;
    this.hoverIndex = -1;
    listToEmpty(this.itemList);
    listToEmpty(this.itemListVolatile);
    listToEmpty(this.hoverIndexList);

    console.log(`【CONTEXT OPEN】 type: ${type} target: ${this.target}`);

    let itemInfo: ContextItemDeclare[] | null;
    if (type === "counter-remocon-item-open") {
      itemInfo = await this.structItemsForCounterRemocon();
    } else {
      itemInfo = await this.structItemsForNormal(type);
    }

    if (itemInfo) {
      // 直列の非同期で全部実行する
      const indexArg = [["-1", "-1"]];
      await itemInfo
        .map((item: ContextItemDeclare | null) => () =>
          this.addItem(item, 0, indexArg, type)
        )
        .reduce((prev, curr) => prev.then(curr), Promise.resolve());
      this.itemList.push(...this.itemListVolatile);
      this.type = type;
    } else {
      this.type = null;
    }

    task.resolve();
  }

  /**
   * 非表示処理
   */
  @VueEvent
  private hide() {
    this.type = null;
  }

  @VueEvent
  private getElm(): HTMLElement {
    return document.getElementById("context") as HTMLElement;
  }

  @VueEvent
  private onHoverItem(level: number, index: number) {
    this.hoverLevel = level;
    this.hoverIndex = index;
    this.hoverIndexList.splice(
      level,
      this.hoverIndexList.length - level,
      index
    );
  }

  @VueEvent
  private get levelList(): number[] {
    let level = this.hoverLevel;
    const hoverItem = this.itemList.find(
      item => item.level === level && item.index === this.hoverIndex
    );
    if (!hoverItem) level = 1;
    else {
      level++;
      if (hoverItem.hasChild) {
        level++;
      }
    }
    return Array(level)
      .fill(null)
      .map((_, i) => i);
  }

  @VueEvent
  private getLevelStyle(level: number) {
    const elm = this.getElm();
    const point = createPoint(0, 28);
    if (elm) {
      const cRect: any = elm.getBoundingClientRect();
      if (level > 0) {
        const hoverIndex =
          this.hoverIndexList[level - 1] + (level === 1 ? 1 : 0);
        const parentLevelElm = elm.getElementsByClassName(
          `level-${level - 1}`
        )[0];
        const parentItemElm = parentLevelElm.children[hoverIndex];
        const currentItemNum = this.getLevelItemList(level).length;
        if (parentItemElm) {
          const parentRect: any = parentItemElm.getBoundingClientRect();
          point.x = parentRect.x + parentRect.width - 7 - cRect.x;
          point.y =
            parentRect.y -
            cRect.y -
            ((currentItemNum - 1) * parentRect.height) / 2;
        }
      }
    }
    return { left: `${point.x}px`, top: `${point.y}px` };
  }

  private getParentIndex(level: number): string {
    let parentIndex: string;
    if (level === 0) {
      parentIndex = "-1";
    } else if (level === 1) {
      parentIndex = this.hoverIndexList[0].toString();
    } else {
      parentIndex = this.hoverIndexList.slice(0, level).join("-");
    }
    return parentIndex;
  }

  @VueEvent
  private getLevelItemList(level: number): Item[] {
    const parentIndex = this.getParentIndex(level);
    return this.itemList.filter(
      item => item.level === level && item.parentIndex === parentIndex
    );
  }

  private async structItemsForCounterRemocon(): Promise<ContextItemDeclare[]> {
    const counterRemocon = findRequireByKey(
      GameObjectManager.instance.counterRemoconList,
      this.target
    );

    const resourceMaster = findByKey(
      GameObjectManager.instance.resourceMasterList,
      counterRemocon.data!.resourceMasterKey
    );

    this.title = `${counterRemocon.data!.name} ${
      resourceMaster ? resourceMaster.data!.label : "{?}"
    }${this.$t(
      "selection.counter-remocon-modify-type." +
        counterRemocon.data!.modifyType.toString()
    )}${counterRemocon.data!.value || "?"}　`;

    const isFixResourceMaster = !!counterRemocon.data!.resourceMasterKey;
    const isFixValue = !!counterRemocon.data!.value;
    const result: ContextItemDeclare[] = [];

    const createValueMiddleItem = (
      modifyType: CounterRemoconModifyType,
      currentValue: number,
      resourceInterval: number,
      resourceMin: number,
      resourceMax: number
    ): ContextItemDeclare[] => {
      const interval = resourceInterval;
      let max: number;
      if (modifyType === "substitute") {
        max = resourceMax;
        max = Math.floor(max / interval) * interval;
      } else {
        max = resourceMax - currentValue;
        max = Math.floor(max / interval) * interval;
        max += currentValue;
        if (modifyType === "minus") max = 0;
      }

      let min: number;
      if (modifyType === "substitute") {
        min = resourceMin;
        min = Math.ceil(min / interval) * interval;
      } else {
        min = resourceMin - currentValue;
        min = Math.ceil(min / interval) * interval;
        min += currentValue;
        if (modifyType === "plus") min = 0;
      }

      const plusMin =
        modifyType === "substitute" ? Math.max(0, min) : currentValue;
      let plusList: number[] = [];
      const plusStep = Math.floor((max - plusMin) / interval);
      if (plusStep > 0) {
        plusList = Array(plusStep)
          .fill(null)
          .map(
            (_, i) =>
              (i + 1) * interval + (modifyType === "substitute" ? plusMin : 0)
          )
          .reverse();
      }
      if (max <= 0 && modifyType === "substitute") {
        plusList = [];
      }

      const minusMax =
        modifyType === "substitute" ? Math.min(max, 0) : currentValue;
      let minusList: number[] = [];
      const minusStep = Math.floor((minusMax - min) / interval);
      if (minusStep > 0) {
        minusList = Array(minusStep)
          .fill(null)
          .map(
            (_, i) =>
              -(i + 1) * interval + (modifyType === "substitute" ? minusMax : 0)
          );
      }
      if (min >= 0 && modifyType === "substitute") {
        minusList = [];
      }

      const sliceByNumber = (
        array: any[],
        slice: number,
        isPlus: boolean
      ): any[] => {
        const length = Math.ceil(array.length / slice);
        const remainder = array.length % slice;
        return new Array(length).fill(null).map((_, i) => {
          const start = isPlus
            ? i === 0
              ? 0
              : (i - (remainder ? 1 : 0)) * slice + remainder
            : i * slice;
          const end = isPlus
            ? (i + (remainder ? 0 : 1)) * slice + remainder
            : (i + 1) * slice;
          return array.slice(start, end);
        });
      };

      let slicePlusList = sliceByNumber(plusList, 10, true);
      if (slicePlusList.length > 10) {
        slicePlusList = sliceByNumber(slicePlusList, 10, true);
      }
      let sliceMinusList = sliceByNumber(minusList, 10, false);
      if (sliceMinusList.length > 10) {
        sliceMinusList = sliceByNumber(sliceMinusList, 10, true);
      }

      const createSimpleNumberList = (list: number[]): ContextItemDeclare => {
        const sign = list[0] > 0 && modifyType !== "substitute" ? "+" : "";
        if (list.length === 1) {
          return {
            text: `${sign}${list[0]}${
              modifyType !== "substitute"
                ? " (=" + (currentValue + list[0]) + ")"
                : ""
            }`,
            isRawText: true,
            taskName: "counter-remocon-click",
            taskArg: { value: list[0] }
          };
        }
        return {
          text: `${sign}${list[0]} 〜 ${sign}${list[list.length - 1]}`,
          isRawText: true,
          taskArg: null,
          children: list.map(v => ({
            text: `${sign}${v}${
              modifyType !== "substitute"
                ? " (=" + (currentValue + v) + ")"
                : ""
            }`,
            isRawText: true,
            taskName: "counter-remocon-click",
            taskArg: { value: v }
          }))
        };
      };

      const numberListMap = (list: any[]): ContextItemDeclare => {
        if (typeof list[0] === "number") {
          return createSimpleNumberList(list);
        } else {
          const listList = list as number[][];
          const flatList = listList.flatMap(l => l);
          const sign =
            flatList[0] > 0 && modifyType !== "substitute" ? "+" : "";
          const suffix =
            modifyType !== "substitute"
              ? ` (=${currentValue + flatList[0]})`
              : "";
          if (flatList.length === 1) {
            return {
              text: `${sign}${flatList[0]}${suffix}`,
              isRawText: true,
              taskName: "counter-remocon-click",
              taskArg: { value: flatList[0] }
            };
          }
          return {
            text: `${sign}${flatList[0]} 〜 ${sign}${
              flatList[flatList.length - 1]
            }`,
            isRawText: true,
            taskArg: null,
            children: listList.map(createSimpleNumberList)
          };
        }
      };

      const result: ContextItemDeclare[] = [];
      result.push(...slicePlusList.map(numberListMap));
      if (modifyType === "substitute") {
        result.push({
          text: "0",
          isRawText: true,
          taskName: "counter-remocon-click",
          taskArg: { value: 0 }
        });
      }
      result.push(...sliceMinusList.map(numberListMap));
      return result;
    };

    const createValuePlusMinusItem = (
      value: number,
      currentValue: number
    ): ContextItemDeclare[] => {
      const result: ContextItemDeclare[] = [];
      result.push({
        text: `+${value} => ${currentValue + value}`,
        isRawText: true,
        taskName: "counter-remocon-click",
        taskArg: { value: value }
      });
      result.push({
        text: `-${value} => ${currentValue - value}`,
        isRawText: true,
        taskName: "counter-remocon-click",
        taskArg: { value: -value }
      });
      return result;
    };

    const createTargetDeclare = (
      resourceMasterKey: string
    ): ContextItemDeclare[] => {
      const resourceMaster = findRequireByKey(
        GameObjectManager.instance.resourceMasterList,
        resourceMasterKey
      );
      const resourceList = GameObjectManager.instance.resourceList.filter(
        r => r.data!.resourceMasterKey === resourceMasterKey
      );

      return resourceList.map(resource => {
        const target = findRequireByKey<any>(
          GameObjectManager.instance.getList(resource.ownerType!)!,
          resource.owner
        );
        const result: ContextItemDeclare = {
          text: (target.data! as any).name,
          isRawText: true,
          taskArg: {
            type: resource.ownerType,
            key: resource.owner
          }
        };
        if (isFixValue) {
          if (counterRemocon.data!.modifyType !== "plus-minus") {
            result.taskArg.value = convertNumberZero(
              counterRemocon.data!.value
            );
            result.taskName = "counter-remocon-click";
          } else {
            result.children = createValuePlusMinusItem(
              convertNumberZero(counterRemocon.data!.value),
              convertNumberZero(resource.data!.value)
            );
          }
        } else {
          result.children = createValueMiddleItem(
            counterRemocon.data!.modifyType,
            convertNumberZero(resource.data!.value),
            resourceMaster.data!.interval!,
            resourceMaster.data!.min!,
            resourceMaster.data!.max!
          );
        }
        return result;
      });
    };

    if (!isFixResourceMaster) {
      const resourceMasterList = GameObjectManager.instance.resourceMasterList.filter(
        rm => rm.data!.type === "number"
      );
      result.push(
        ...resourceMasterList.map(resourceMaster => {
          const result: ContextItemDeclare = {
            text: resourceMaster.data!.label,
            isRawText: true,
            taskArg: {
              resourceMasterKey: resourceMaster.key
            },
            children: createTargetDeclare(resourceMaster.key)
          };

          return result;
        })
      );
    } else {
      result.push(
        ...createTargetDeclare(counterRemocon.data!.resourceMasterKey!)
      );
    }
    return result;
  }

  @TaskProcessor("counter-remocon-click-finished")
  private async counterRemoconClickFinished(
    task: Task<UpdateResourceInfo, never>
  ): Promise<TaskResult<never> | void> {
    const counterRemocon = findRequireByKey(
      GameObjectManager.instance.counterRemoconList,
      this.target
    );

    let resourceMasterKey: string =
      counterRemocon.data!.resourceMasterKey || "";
    let targetKey: string = "";
    let targetType: string = "";

    for (let i = 0; i <= this.hoverLevel; i++) {
      const parentIndex = this.getParentIndex(i);
      const item = this.itemList.find(
        item =>
          item.level === i &&
          item.parentIndex === parentIndex &&
          item.index === this.hoverIndexList[i]
      );
      const taskArg = item!.arg;
      if ("resourceMasterKey" in taskArg) {
        resourceMasterKey = taskArg.resourceMasterKey;
      }
      if ("key" in taskArg) {
        targetKey = taskArg.key;
      }
      if ("type" in taskArg) {
        targetType = taskArg.type;
      }
    }

    await TaskManager.instance.ignition<any, never>({
      type: "counter-remocon-execute",
      owner: "Quoridorn",
      value: {
        counterRemoconKey: this.target,
        resourceMasterKey,
        targetKey,
        targetType,
        value: task.value?.value
      }
    });
  }

  private getTitle(type: string): string {
    const list = GameObjectManager.instance.getList<any>(type)!;
    const obj: any = list ? findByKey(list, this.target) : null;
    const name =
      obj && obj.data && "name" in obj.data
        ? " " + obj.data.name.toString()
        : "";
    return `(${this.$t(`type.${type}`)!.toString()})${name}`;
  }

  private async structItemsForNormal(
    type: string
  ): Promise<ContextItemDeclare[] | null> {
    this.title = this.getTitle(type);

    // 定義を元に要素を構築していく
    let itemInfo: ContextDeclareInfo = contextInfo[type];
    if (!itemInfo) return null;

    const getRef = (itemInfo: ContextDeclareInfo): ContextItemDeclare[] => {
      if ("ref" in itemInfo) return getRef(contextInfo[itemInfo.ref]);
      return itemInfo;
    };
    itemInfo = getRef(itemInfo);

    return itemInfo;
  }

  /**
   * 項目追加
   * @param item
   * @param level
   * @param indexArg
   * @param type
   */
  private async addItem(
    item: ContextItemDeclare | null,
    level: number,
    indexArg: string[][],
    type: string
  ) {
    const contextItem: ContextItemDeclareInfo = clone<ContextItemDeclareInfo>(
      item && "ref" in item ? contextItemInfo![item!.ref] : item
    );

    const levelIndexList = indexArg[level];

    // 要素がnullだったら区切り線
    if (!contextItem) {
      levelIndexList[1] = (convertNumberZero(levelIndexList[1]) + 1).toString();
      this.itemListVolatile.push({
        type: "hr",
        level,
        parentIndex: levelIndexList[0],
        index: convertNumberZero(levelIndexList[1]),
        hasChild: false
      });
      return;
    }

    const target = this.target!;
    const pieceKey = this.pieceKey;
    const isViewCompare = contextItem.isViewCompare;

    // 項目を表示するかどうかの判定
    if (!(await judgeCompare(isViewCompare, type, target))) return;

    // テキスト項目の追加
    if ("text" in contextItem) {
      const isDisabledCompare = contextItem.isDisabledCompare;

      // 非活性の判定
      const disabled = !(await judgeCompare(isDisabledCompare, type, target));

      const argObj: DataReference & { pieceKey?: string } = {
        type,
        key: target,
        pieceKey
      };
      if (!contextItem.taskArg) {
        contextItem.taskArg = {
          args: argObj
        };
      }
      if (!contextItem.taskArg.arg) {
        contextItem.taskArg.args = argObj;
      }

      if (contextItem.argRef === "dice-pips-select") {
        const list = GameObjectManager.instance.getList<SceneObjectStore>(
          type
        )!;
        const obj: StoreData<SceneObjectStore> | null = findByKey(list, target);
        const diceTypeKey = obj!.data!.subTypeKey;
        const diceAndPipsList = GameObjectManager.instance.diceAndPipsList;
        const pipsList = diceAndPipsList
          .filter(dap => dap.data!.diceTypeKey === diceTypeKey)
          .map(dap => dap.data!.pips);
        contextItem.children = pipsList.map(pips => ({
          text: pips,
          isRawText: true,
          taskName: "dice-pips-change",
          taskArg: { value: pips }
        }));
      }

      levelIndexList[1] = (convertNumberZero(levelIndexList[1]) + 1).toString();
      this.itemListVolatile.push({
        type: "item",
        level,
        parentIndex: levelIndexList[0],
        index: convertNumberZero(levelIndexList[1]),
        taskName: contextItem.taskName || "default",
        text: contextItem.text || "default",
        isRawText: contextItem.isRawText,
        arg: contextItem.taskArg,
        disabled,
        hasChild: !!contextItem.children
      });

      if (contextItem.children) {
        const parentIndex = `${
          levelIndexList[0] === "-1" ? "" : levelIndexList[0] + "-"
        }${levelIndexList[1]}`;
        indexArg.splice(level + 1, 1, [parentIndex, "-1"]);

        const getRef = (itemInfo: ContextDeclareInfo): ContextItemDeclare[] => {
          if ("ref" in itemInfo) return getRef(contextInfo[itemInfo.ref]);
          return itemInfo;
        };
        contextItem.children = getRef(contextItem.children);

        await contextItem.children
          .map((item: ContextItemDeclare | null) => () =>
            this.addItem(item, level + 1, indexArg, type)
          )
          .reduce((prev, curr) => prev.then(curr), Promise.resolve());
      }
      return;
    }

    // 区切り線を追加
    levelIndexList[1] = (convertNumberZero(levelIndexList[1]) + 1).toString();
    this.itemListVolatile.push({
      type: "hr",
      level,
      parentIndex: levelIndexList[0],
      index: convertNumberZero(levelIndexList[1]),
      hasChild: false
    });
  }

  /**
   * 項目選択
   * @param item
   */
  @VueEvent
  private async emitEvent(item: Item) {
    if (item.disabled || item.hasChild) return;
    this.hide();
    await TaskManager.instance.ignition<any, never>({
      type: item.taskName!,
      owner: "Quoridorn",
      value: item.arg
    });
  }

  /**
   * 表示座標制御
   */
  @LifeCycle
  private updated() {
    const elm = this.getElm();
    if (!elm) return;
    elm.style.setProperty("--x", `${this.x}px`);
    elm.style.setProperty("--y", `${this.y}px`);
  }

  @VueEvent
  private getItemStyle(item: Item) {
    const elm = this.getElm();
    if (!elm) return {};
    const level = item.level;
    const point = createPoint(0, 0);
    // const fontSize = getCssPxNum("font-size", this.elm);
    const fontSize = 14;
    if (level > 1) {
      const parentIndexSplit = item.parentIndex.toString().split("-");
      const parentIndex = parentIndexSplit.pop()!;
      const parentElmList = elm.getElementsByClassName(`level-${level - 1}`);
      const parentElm = parentElmList[convertNumberZero(parentIndex)];
      const parentRect: any = parentElm.getBoundingClientRect();
      point.x = parentRect.x + parentRect.width - fontSize;
      point.y = parentRect.y;
    }
    point.y += item.index * fontSize * 2;
    return {
      left: point.x + "px",
      top: point.y + "px"
    };
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

#context {
  position: fixed;
  left: 0;
  top: 0;
  transform: translate(var(--x), calc(var(--y) - 4em));
  font-size: 14px;
}

.level-box {
  @include inline-flex-box(column, stretch, flex-start);
  position: absolute;
  background-color: white;
  border: solid gray 1px;
  box-sizing: content-box;
}

.title {
  background-color: var(--uni-color-blue);
  color: var(--uni-color-white);
  font-weight: bold;
  display: block;
  min-width: 50px;
  padding: 0 5px;
  line-height: 1.8em;
  height: 2em;
  cursor: default;
}

hr {
  cursor: default;
}

.item {
  @include inline-flex-box(row, space-between, center);
  min-width: 5em;
  padding: 0 5px;
  height: 2em;
  cursor: pointer;

  &.has-child {
    cursor: default;

    &:after {
      content: ">";
      font-weight: bold;
    }
  }

  &.selected {
    background-color: lightblue;
  }

  &:not(.title):not(.disabled):hover {
    background-color: lightblue;
  }

  &.disabled {
    background-color: lightgrey;
    cursor: default;
  }
}
</style>
