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
export default class ThrowCharSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  @Prop({ type: Array, required: true })
  private chars!: string[];

  private optionInfoList: HtmlOptionInfo[] = [];

  @LifeCycle
  private mounted() {
    window.console.log("mounted");
    this.createOptionInfoList();
  }

  @TaskProcessor("language-change-finished")
  private async languageChangeFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    window.console.log("languageChangeFinished");
    this.createOptionInfoList();
    task.resolve();
  }

  private createOptionInfoList() {
    window.console.log("createOptionInfoList");
    this.optionInfoList = this.chars.map((c: string, idx: number) => ({
      value: c,
      key: idx.toString(10),
      text: c,
      disabled: false
    }));
    this.optionInfoList.splice(0, 0, {
      value: "",
      key: "",
      text: LanguageManager.instance.getText("label.char"),
      disabled: true
    });
    window.console.log(JSON.stringify(this.optionInfoList, null, "  "));
  }

  public focus() {
    const elm = this.$refs.component as CtrlSelect;
    elm.focus();
  }
}
</script>
