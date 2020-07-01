<template>
  <ctrl-select
    v-model="localValue"
    :optionInfoList="optionInfoList"
    :id="id"
    ref="component"
  />
</template>

<script lang="ts">
import SelectMixin from "./base/SelectMixin";

import { Component, Mixins } from "vue-mixin-decorator";
import CtrlSelect from "@/app/core/component/CtrlSelect.vue";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import LanguageManager from "@/LanguageManager";
import ComponentVue from "@/app/core/window/ComponentVue";
import { HtmlOptionInfo } from "@/@types/window";
import LifeCycle from "@/app/core/decorator/LifeCycle";

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
    { value: "ref-actor", key: "", text: "", disabled: false },
    { value: "ref-map-object", key: "", text: "", disabled: false },
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
      const suffix = o.value ? `-${o.value}` : "";
      o.text = this.$t(`label.resource-type${suffix}`)!.toString();
      o.key = o.value;
    });
  }
}
</script>
