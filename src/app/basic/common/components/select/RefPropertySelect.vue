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
export default class RefPropertySelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  private optionInfoList: HtmlOptionInfo[] = [
    { value: "", key: "", text: "", disabled: true },
    { value: "name", key: "", text: "", disabled: false },
    { value: "type", key: "", text: "", disabled: false },
    { value: "tag", key: "", text: "", disabled: false },
    { value: "actor-name", key: "", text: "", disabled: false },
    { value: "actor-type", key: "", text: "", disabled: false },
    { value: "actor-tag", key: "", text: "", disabled: false },
    { value: "owner-name", key: "", text: "", disabled: false },
    { value: "owner-type", key: "", text: "", disabled: false },
    { value: "object-layer", key: "", text: "", disabled: false },
    { value: "actor-status-name", key: "", text: "", disabled: false },
    { value: "actor-chat-text-color", key: "", text: "", disabled: false },
    { value: "actor-stand-image-position", key: "", text: "", disabled: false }
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
      o.text = this.$t(`selection.ref-property.${suffix}`)!.toString();
      o.key = o.value;
    });
  }
}
</script>
