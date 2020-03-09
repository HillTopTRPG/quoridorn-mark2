<template>
  <ctrl-select
    v-model="localValue"
    :optionInfoList="optionInfoList"
    :test="test"
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
export default class PermissionTypeSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  private optionInfoList: HtmlOptionInfo[] = [
    { value: "", key: "", text: "", disabled: true },
    { value: "none", key: "", text: "", disabled: false },
    { value: "allow", key: "", text: "", disabled: false },
    { value: "deny", key: "", text: "", disabled: false }
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
    const getText = LanguageManager.instance.getText.bind(
      LanguageManager.instance
    );
    this.optionInfoList.forEach(o => {
      if (o.value) o.text = getText(`label.${o.value}`);
      o.key = o.value;
    });
    this.optionInfoList[0].text = getText("label.permission-type");
  }
}
</script>
