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
import LifeCycle from "../../../../core/decorator/LifeCycle";
import TaskProcessor from "../../../../core/task/TaskProcessor";
import CtrlSelect from "../../../../core/component/CtrlSelect.vue";
import ComponentVue from "../../../../core/window/ComponentVue";
import { HtmlOptionInfo } from "@/@types/window";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({
  components: { CtrlSelect }
})
export default class ChatLinkageTypeSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  private optionInfoList: HtmlOptionInfo[] = [
    { value: "", key: "chat-linkage-type", text: "", disabled: true },
    { value: "none", key: "not-exist", text: "", disabled: false },
    { value: "last", key: "chat-linkage-type-last", text: "", disabled: false },
    {
      value: "regexp",
      key: "chat-linkage-type-regexp",
      text: "",
      disabled: false
    }
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
      o.text = this.$t(`label.${o.key}`)!.toString();
    });
  }
}
</script>
