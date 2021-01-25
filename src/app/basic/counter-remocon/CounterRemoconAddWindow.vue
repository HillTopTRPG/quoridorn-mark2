<template>
  <div class="container" ref="window-container">
    <counter-remocon-info-form
      :windowKey="windowKey"
      :isAdd="false"
      :name.sync="name"
      :targetType.sync="targetType"
      :resourceMasterKey.sync="resourceMasterKey"
      :modifyType.sync="modifyType"
      :value.sync="value"
      :messageFormat.sync="messageFormat"
    />

    <button-area
      :is-commit-able="isCommitAble()"
      commit-text="add"
      @commit="commit()"
      @rollback="rollback()"
    />
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import WindowVue from "@/app/core/window/WindowVue";
import VueEvent from "@/app/core/decorator/VueEvent";
import {
  CounterRemoconModifyType,
  CounterRemoconTargetType,
  CounterRemoconStore
} from "@/@types/store-data";
import AddWindowDelegator, {
  AddWindow
} from "@/app/core/window/AddWindowDelegator";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import CounterRemoconInfoForm from "@/app/basic/counter-remocon/CounterRemoconInfoForm.vue";

@Component({ components: { CounterRemoconInfoForm, ButtonArea } })
export default class CounterRemoconAddWindow
  extends Mixins<WindowVue<CounterRemoconStore, boolean>>(WindowVue)
  implements AddWindow<CounterRemoconStore> {
  private addWindowDelegator = new AddWindowDelegator<CounterRemoconStore>(
    this
  );

  private name: string = "";
  private targetType: CounterRemoconTargetType = "every-one";
  private resourceMasterKey: string | null = null;
  private modifyType: CounterRemoconModifyType = "plus-minus";
  private value: string = "";
  private messageFormat: string = "{0}の{1}を{2}した({3})";

  @LifeCycle
  public async mounted() {
    await this.addWindowDelegator.init();
    this.inputEnter("input:not([type='button'])", this.commit);
  }

  public isCommitAble(): boolean {
    return !!this.name;
  }

  @VueEvent
  private async commit() {
    await this.addWindowDelegator.commit();
  }

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing2(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    return await this.addWindowDelegator.windowCloseClosing(task);
  }

  @VueEvent
  private async rollback() {
    await this.addWindowDelegator.rollback();
  }

  public setStoreData(data: CounterRemoconStore): void {
    this.name = data.name;
    this.targetType = data.targetType;
    this.resourceMasterKey = data.resourceMasterKey;
    this.modifyType = data.modifyType;
    this.value = data.value;
    this.messageFormat = data.messageFormat;
  }

  public async getStoreDataList(): Promise<
    DelegateStoreData<CounterRemoconStore>[]
  > {
    return [
      {
        collection: SocketFacade.instance.counterRemoconCC()
          .collectionNameSuffix,
        data: {
          name: this.name,
          targetType: this.targetType,
          resourceMasterKey: this.resourceMasterKey,
          modifyType: this.modifyType,
          value: this.value,
          messageFormat: this.messageFormat
        }
      }
    ];
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.container {
  @include flex-box(column, stretch, flex-start);
  width: 100%;
  height: 100%;
}
</style>
