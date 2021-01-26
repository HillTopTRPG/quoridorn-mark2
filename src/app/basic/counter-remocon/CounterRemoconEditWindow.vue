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
      commit-text="modify"
      @commit="commit()"
      @rollback="rollback()"
    />
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import WindowVue from "@/app/core/window/WindowVue";
import VueEvent from "@/app/core/decorator/VueEvent";
import EditWindowDelegator, {
  EditWindow
} from "@/app/core/window/EditWindowDelegator";
import {
  CounterRemoconModifyType,
  CounterRemoconTargetType,
  CounterRemoconStore
} from "@/@types/store-data";
import CounterRemoconInfoForm from "@/app/basic/counter-remocon/CounterRemoconInfoForm.vue";

@Component({ components: { CounterRemoconInfoForm, ButtonArea } })
export default class CounterRemoconEditWindow
  extends Mixins<WindowVue<DataReference, never>>(WindowVue)
  implements EditWindow<CounterRemoconStore> {
  private editWindowDelegator = new EditWindowDelegator<CounterRemoconStore>(
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
    await this.editWindowDelegator.init();
    this.inputEnter("input:not([type='button'])", this.commit);
  }

  public isCommitAble(): boolean {
    return !!this.name;
  }

  @VueEvent
  private async commit() {
    await this.editWindowDelegator.commit();
  }

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing2(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    return await this.editWindowDelegator.windowCloseClosing(task);
  }

  @VueEvent
  private async rollback() {
    await this.editWindowDelegator.rollback();
  }

  public pullStoreData(data: StoreData<CounterRemoconStore>): void {
    this.name = data.data!.name;
    this.targetType = data.data!.targetType;
    this.resourceMasterKey = data.data!.resourceMasterKey;
    this.modifyType = data.data!.modifyType;
    this.value = data.data!.value;
    this.messageFormat = data.data!.messageFormat;
  }

  public async pushStoreData(
    data: StoreData<CounterRemoconStore>
  ): Promise<void> {
    data.data!.name = this.name;
    data.data!.targetType = this.targetType;
    data.data!.resourceMasterKey = this.resourceMasterKey;
    data.data!.modifyType = this.modifyType;
    data.data!.value = this.value;
    data.data!.messageFormat = this.messageFormat;
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

.button-area {
}
</style>
