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
import { Task, TaskResult } from "task";
import LifeCycle from "../../../../core/decorator/LifeCycle";
import TaskProcessor from "../../../../core/task/TaskProcessor";
import CtrlSelect from "../../../../core/component/CtrlSelect.vue";
import ComponentVue from "../../../../core/window/ComponentVue";
import { HtmlOptionInfo } from "../../../../../@types/window";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({
  components: { CtrlSelect }
})
export default class ResourceTypeSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  private optionInfoList: HtmlOptionInfo[] = [
    { value: "", key: "", text: "", disabled: true },
    { value: "no-contents", key: "", text: "", disabled: false },
    { value: "ref-normal", key: "", text: "", disabled: false },
    { value: "ref-owner", key: "", text: "", disabled: false },
    { value: "text", key: "", text: "", disabled: false },
    { value: "input-text", key: "", text: "", disabled: false },
    { value: "number", key: "", text: "", disabled: false },
    { value: "check", key: "", text: "", disabled: false },
    { value: "select", key: "", text: "", disabled: false },
    { value: "combo", key: "", text: "", disabled: false },
    { value: "color", key: "", text: "", disabled: false }
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
      const suffix = o.value || "label";
      o.text = this.$t(`selection.resource-type.${suffix}`)!.toString();
      o.key = o.value;
    });
  }
}
</script>
