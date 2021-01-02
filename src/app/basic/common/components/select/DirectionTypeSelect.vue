<template>
  <ctrl-select
    :elmId="elmId"
    v-model="localValue"
    :optionInfoList="optionInfoList"
    ref="component"
  />
</template>

<script lang="ts">
import SelectMixin from "./base/SelectMixin";

import { Component, Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import LifeCycle from "../../../../core/decorator/LifeCycle";
import TaskProcessor from "../../../../core/task/TaskProcessor";
import CtrlSelect from "../../../../core/component/CtrlSelect.vue";
import ComponentVue from "../../../../core/window/ComponentVue";
import { HtmlOptionInfo } from "@/@types/window";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({
  components: { CtrlSelect }
})
export default class DirectionTypeSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  private optionInfoList: HtmlOptionInfo[] = [
    { value: "", key: "", text: "", disabled: true },
    { value: "none", key: "none", text: "", disabled: false },
    { value: "horizontal", key: "horizontal", text: "", disabled: false },
    { value: "vertical", key: "vertical", text: "", disabled: false },
    { value: "180", key: "180deg", text: "", disabled: false }
  ];

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
    this.optionInfoList.forEach(o => {
      const suffix = o.key || "label";
      o.text = this.$t(`selection.direction.${suffix}`)!.toString();
    });
  }
}
</script>
