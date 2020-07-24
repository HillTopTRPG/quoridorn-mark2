<template>
  <ctrl-select
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
import { HtmlOptionInfo } from "../../../../../@types/window";
import LanguageManager from "../../../../../LanguageManager";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({
  components: { CtrlSelect }
})
export default class BorderStyleSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  private optionInfoList: HtmlOptionInfo[] = [
    { value: "", key: "", text: "", disabled: true },
    { value: "solid", key: "", text: "", disabled: false },
    { value: "groove", key: "", text: "", disabled: false },
    { value: "ridge", key: "", text: "", disabled: false },
    { value: "inset", key: "", text: "", disabled: false },
    { value: "outset", key: "", text: "", disabled: false },
    { value: "double", key: "", text: "", disabled: false },
    { value: "dashed", key: "", text: "", disabled: false },
    { value: "dotted", key: "", text: "", disabled: false }
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
      o.key = o.value;
      o.text = o.value!;
    });
    this.optionInfoList[0].text = LanguageManager.instance.getText(
      "label.border-style"
    );
  }
}
</script>
