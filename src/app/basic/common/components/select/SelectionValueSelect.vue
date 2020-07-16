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
import { Prop, Watch } from "vue-property-decorator";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({
  components: { CtrlSelect }
})
export default class SelectionValueSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private selection!: string;

  private optionInfoList: HtmlOptionInfo[] = [];

  @Watch("selection", { immediate: true })
  private onChangeSelection() {
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
    this.optionInfoList = this.selection
      .split(",")
      .map(s => s.trim())
      .map(s => ({ value: s, key: s, text: s, disabled: false }));
    const getDisabledValue = (v: string): string => {
      const disabledOption = this.optionInfoList.filter(o => o.value === v)[0];
      return disabledOption ? getDisabledValue("#" + v) : v;
    };
    const disabledValue = getDisabledValue("");
    this.optionInfoList.unshift({
      value: disabledValue,
      key: disabledValue,
      text: LanguageManager.instance.getText("label.selection-value"),
      disabled: true
    });
    // setTimeout(() => {
    //   if (this.optionInfoList.length > 1) {
    //     this.localValue = this.optionInfoList[1].value;
    //   }
    // });
  }
}
</script>
