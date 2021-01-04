<template>
  <div
    class="public-memo-icon"
    :class="classList"
    :id="publicMemo.key"
    @mouseover="mouseover"
    @mouseout="mouseout"
    @mousedown.right.stop="rightDown"
    @contextmenu.prevent
  >
    <span>{{ publicMemo.data.name }}</span>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import GameObjectManager from "@/app/basic/GameObjectManager";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";
import { PublicMemoStore } from "@/@types/store-data";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import { findRequireByKey } from "@/app/core/utility/Utility";
import VueEvent from "@/app/core/decorator/VueEvent";
import {
  createRectangle,
  getEventPoint
} from "@/app/core/utility/CoordinateUtility";
import TaskManager from "@/app/core/task/TaskManager";
import { ContextTaskInfo } from "context";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import { Task, TaskResult } from "task";
import { OtherTextViewInfo } from "@/@types/store-data-optional";
const uuid = require("uuid");

@Component({})
export default class PublicMemoIcon extends Mixins<ComponentVue>(ComponentVue) {
  @Prop({ type: Object, required: true })
  private publicMemo!: StoreData<PublicMemoStore>;

  @Prop({ type: Number, required: true })
  private index!: number;

  private publicMemoListCC = SocketFacade.instance.publicMemoListCC();
  private memoListCC = SocketFacade.instance.memoCC();
  private mediaList = GameObjectManager.instance.mediaList;
  private memoList = GameObjectManager.instance.memoList;
  private isMounted: boolean = false;
  private isHover: boolean = false;
  private pieceKey = uuid.v4();

  @LifeCycle
  private mounted() {
    this.isMounted = true;
  }

  @Watch("isMounted")
  @Watch("publicMemo")
  private onChangePublicMemo() {
    const elm: HTMLDivElement = this.$el as HTMLDivElement;
    const media = findRequireByKey(
      this.mediaList,
      this.publicMemo.data!.mediaKey
    );
    elm.style.setProperty(`--image`, `url('${media.data!.url}')`);

    const leftEm = (Math.floor(this.index / 5) * 5 + 1).toString() + "em";
    const topEm = (Math.floor(this.index % 5) * 5 + 3).toString() + "em";
    elm.style.setProperty(`--x`, `${leftEm}`);
    elm.style.setProperty(`--y`, `${topEm}`);
  }

  @VueEvent
  private get classList(): string[] {
    const list: string[] = [];
    list.push(this.isHover ? "hover" : "non-hover");
    return list;
  }

  @VueEvent
  protected async mouseover(): Promise<void> {
    this.isHover = true;
    const elm: HTMLDivElement = this.$el as HTMLDivElement;
    const key = this.publicMemo.key;
    const rect = elm.getBoundingClientRect();
    await TaskManager.instance.ignition<OtherTextViewInfo, never>({
      type: "other-text-view",
      owner: "Quoridorn",
      value: {
        type: "public-memo",
        title: this.publicMemo.data!.name,
        key,
        dataList: this.memoList.filter(m => m.owner === key),
        rect: createRectangle(rect.x, rect.y, rect.width, rect.height),
        isFix: true
      }
    });
  }

  @VueEvent
  protected async mouseout(): Promise<void> {
    this.isHover = false;
    const key = this.publicMemo.key;
    await TaskManager.instance.ignition<string, never>({
      type: "other-text-hide",
      owner: "Quoridorn",
      value: key
    });
  }

  @VueEvent
  private async rightDown(event: MouseEvent | TouchEvent): Promise<void> {
    const point = getEventPoint(event);
    await TaskManager.instance.ignition<ContextTaskInfo, never>({
      type: "context-open",
      owner: "Quoridorn",
      value: {
        type: "public-memo",
        target: this.publicMemo.key,
        pieceKey: this.pieceKey,
        x: point.x,
        y: point.y
      }
    });
  }

  @TaskProcessor("copy-object-finished")
  private async copyObjectFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (this.isNotThisTask(task)) return;
    const publicMemoKey = (
      await this.publicMemoListCC.addDirect([
        {
          ownerType: this.publicMemo.ownerType,
          owner: this.publicMemo.owner,
          permission: this.publicMemo.permission,
          data: this.publicMemo.data!
        }
      ])
    )[0];
    const targetMemoList = this.memoList.filter(
      m => m.owner === this.publicMemo.key
    );
    await this.memoListCC.addDirect(
      targetMemoList.map(m => ({
        ownerType: "public-memo-list",
        owner: publicMemoKey,
        permission: m.permission,
        data: m.data!
      }))
    );
  }

  @TaskProcessor("delete-object-finished")
  private async deleteObjectFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (this.isNotThisTask(task)) return;
    await this.publicMemoListCC.deletePackage([this.publicMemo.key]);
  }

  private isNotThisTask(task: Task<any, never>): boolean {
    const args = task.value.args;
    return (
      args.type !== "public-memo" ||
      args.docKey !== this.publicMemo.key ||
      args.pieceKey !== this.pieceKey
    );
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.public-memo-icon {
  position: absolute;
  z-index: inherit;
  display: block;
  width: 4em;
  height: 4em;
  left: var(--x);
  top: var(--y);
  white-space: pre-wrap;
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
  border: 2px solid darkblue;
  background-color: rgba(255, 255, 255, 0.8);

  &:before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    right: 0;
    background-image: var(--image);
    background-size: cover;
    background-position: center center;
    z-index: 0;
    opacity: 0.3;
  }

  > span {
    position: relative;
    z-index: 1;
    pointer-events: none;
    font-weight: bold;
  }
}
</style>
