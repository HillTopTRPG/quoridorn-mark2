<template>
  <ctrl-select
    v-model="localValue"
    :optionInfoList="optionInfoList"
    :id="id"
    :readonly="readonly"
    ref="component"
  />
</template>

<script lang="ts">
import SelectMixin from "./base/SelectMixin";

import { Component, Mixins } from "vue-mixin-decorator";
import { Prop } from "vue-property-decorator";
import LifeCycle from "../../../../core/decorator/LifeCycle";
import TaskProcessor from "../../../../core/task/TaskProcessor";
import CtrlSelect from "../../../../core/component/CtrlSelect.vue";
import ComponentVue from "../../../../core/window/ComponentVue";
import { HtmlOptionInfo } from "../../../../../@types/window";
import { Task, TaskResult } from "task";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({
  components: { CtrlSelect }
})
export default class GeneralTypeSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private type!: string;

  @Prop({ type: Array, required: true })
  private valueList!: string[];

  private optionInfoList: HtmlOptionInfo[] = [];

  @LifeCycle
  private created() {
    this.createOptionInfoList();
  }

  @TaskProcessor("language-change-finished")
  private async languageChangeFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    this.createOptionInfoList();
    task.resolve();
  }

  private createOptionInfoList() {
    this.optionInfoList = this.valueList.map(v => ({
      value: v,
      key: v,
      text: this.$t(`label.${this.type}-${v}`)!.toString(),
      disabled: false
    }));
    this.optionInfoList.unshift({
      value: "",
      key: "",
      text: this.$t(`label.${this.type}`)!.toString(),
      disabled: true
    });
  }
}
</script>
