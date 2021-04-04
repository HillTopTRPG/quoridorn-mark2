<template>
  <button
    type="button"
    class="counter-remocon-button-component"
    :title="title"
    @click.left.stop="onLeftClickButton"
    @click.right.stop="onRightClickButton"
    @mouseenter="onHoverButton(true)"
    @mouseleave="onHoverButton(false)"
    @contextmenu.prevent
  >
    {{ counterRemocon.data.name }}
  </button>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import VueEvent from "@/app/core/decorator/VueEvent";
import { CounterRemoconStore } from "@/@types/store-data";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskManager from "@/app/core/task/TaskManager";
import { ContextTaskInfo } from "context";
import { getEventPoint } from "@/app/core/utility/CoordinateUtility";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { findByKey } from "@/app/core/utility/Utility";

@Component
export default class CounterRemoconButtonComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private counterRemocon!: StoreData<CounterRemoconStore>;

  private isFixResource: boolean = false;
  private isFixValue: boolean = false;
  private resourceMasterKey: string | null = null;
  private value: string = "";

  private get title() {
    return `${this.counterRemocon.data!.messageFormat}`;
  }

  @LifeCycle
  private mounted() {
    this.isFixResource = !!this.counterRemocon.data!.resourceMasterKey;
    this.isFixValue = !!this.counterRemocon.data!.value;
    this.resourceMasterKey = this.counterRemocon.data!.resourceMasterKey;
    this.value = this.counterRemocon.data!.value;
  }

  @VueEvent
  private async onLeftClickButton(event: MouseEvent | TouchEvent) {
    const point = getEventPoint(event);
    await TaskManager.instance.ignition<ContextTaskInfo, never>({
      type: "context-open",
      owner: "Quoridorn",
      value: {
        type: "counter-remocon-item-open",
        target: this.counterRemocon.key,
        x: point.x,
        y: point.y
      }
    });
  }

  @VueEvent
  private async onRightClickButton(event: MouseEvent | TouchEvent) {
    const point = getEventPoint(event);
    await TaskManager.instance.ignition<ContextTaskInfo, never>({
      type: "context-open",
      owner: "Quoridorn",
      value: {
        type: "counter-remocon-list",
        target: this.counterRemocon.key,
        x: point.x,
        y: point.y
      }
    });
  }

  @VueEvent
  private onHoverButton(flg: boolean) {
    const counterRemocon = this.counterRemocon;

    const resourceMaster = findByKey(
      GameObjectManager.instance.resourceMasterList,
      counterRemocon.data!.resourceMasterKey
    );

    const message = `${
      resourceMaster ? resourceMaster.data!.name : "{?}"
    }${this.$t(
      "selection.counter-remocon-modify-type." +
        counterRemocon.data!.modifyType.toString()
    )}${counterRemocon.data!.value || "?"}`;
    this.$emit("changeMessage", flg ? message : "");
  }

  @VueEvent
  private execute() {
    this.$emit(
      "execute",
      this.counterRemocon,
      this.resourceMasterKey,
      this.value
    );
  }

  private isNotThisTask(task: Task<any, never>): boolean {
    const args = task.value.args;
    return (
      args.type !== this.counterRemocon.collection ||
      args.key !== this.counterRemocon.key
    );
  }

  @TaskProcessor("copy-object-finished")
  private async copyObjectFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (this.isNotThisTask(task)) return;
    await SocketFacade.instance
      .counterRemoconCC()
      .addDirect([{ data: { ...this.counterRemocon.data! } }]);
  }

  @TaskProcessor("delete-object-finished")
  private async deleteObjectFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (this.isNotThisTask(task)) return;
    await SocketFacade.instance
      .counterRemoconCC()
      .deletePackage([this.counterRemocon.key]);
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.counter-remocon-button-component {
  @include flex-box(column, center, center);
  height: 3em;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  box-sizing: border-box;
  font-size: inherit;
}
</style>
