<template>
  <ctrl-select
    v-model="localValue"
    :optionInfoList="optionInfoList"
    :isPending="isPending"
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
import { Prop } from "vue-property-decorator";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({
  components: { CtrlSelect }
})
export default class UserTypeSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  @Prop({ type: Boolean, required: true })
  private visitable!: boolean;

  private optionInfoList: HtmlOptionInfo[] = [
    { value: "", key: "user-type", text: "", disabled: true },
    { value: "PL", key: "player", text: "", disabled: false },
    { value: "GM", key: "gameMaster", text: "", disabled: false },
    { value: "VISITOR", key: "visitor", text: "", disabled: false }
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
      o.text = getText(`label.${o.key}`);
      if (o.value === "VISITOR" && !this.visitable) o.disabled = true;
    });
  }
}
</script>
