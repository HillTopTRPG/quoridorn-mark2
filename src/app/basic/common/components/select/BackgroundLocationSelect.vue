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
import ComponentVue from "../../../../core/window/ComponentVue";
import LifeCycle from "../../../../core/decorator/LifeCycle";
import TaskProcessor from "../../../../core/task/TaskProcessor";
import CtrlSelect from "../../../../core/component/CtrlSelect.vue";
import { HtmlOptionInfo } from "@/@types/window";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({
  components: { CtrlSelect }
})
export default class BackgroundLocationSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  private optionInfoList: HtmlOptionInfo[] = [
    { value: "", key: "", text: "", disabled: true },
    { value: "contain", key: "contain", text: "", disabled: false },
    { value: "100%", key: "100per", text: "", disabled: false },
    { value: "cover-start", key: "cover-start", text: "", disabled: false },
    { value: "cover-center", key: "cover-center", text: "", disabled: false },
    { value: "cover-end", key: "cover-end", text: "", disabled: false }
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
      o.text = this.$t(`selection.background-location.${suffix}`)!.toString();
    });
  }
}
</script>
