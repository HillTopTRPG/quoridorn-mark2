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
import LanguageManager from "../../../../../LanguageManager";

interface MultiMixin extends SelectMixin, ComponentVue {}

// TODO 墓場やキャラクター待合室の概念の実装
@Component({ components: { CtrlSelect } })
export default class StartTimePlaceSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  private optionInfoList: HtmlOptionInfo[] = [
    { value: "[title]", key: "", text: "", disabled: true },
    { value: "", key: "", text: "", disabled: false },
    { value: "field", key: "", text: "", disabled: false },
    { value: "graveyard", key: "", text: "", disabled: false },
    { value: "backstage", key: "", text: "", disabled: false }
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
      o.text = this.$t(`label.${o.value}`)!.toString();
    });
    this.optionInfoList[0].text = this.$t("label.place")!.toString();
    this.optionInfoList[1].text = this.$t("label.no-target")!.toString();
  }
}
</script>
