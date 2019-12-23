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
import VueEvent from "@/app/core/decorator/VueEvent";
import CtrlSelect from "@/app/core/component/CtrlSelect.vue";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "@/@types/task";
import LanguageManager from "@/LanguageManager";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Direction } from "@/@types/room";

type Item = {
  val: Direction;
  text: string;
};

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({
  components: { CtrlSelect }
})
export default class DirectionTypeSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  private optionInfoList: any[] = [];

  @VueEvent
  private mounted() {
    const getText = LanguageManager.instance.getText.bind(
      LanguageManager.instance
    );
    const choice: Item[] = [
      { val: "none", text: getText("label.direction-none") },
      { val: "horizontal", text: getText("label.direction-horizontal") },
      { val: "vertical", text: getText("label.direction-vertical") },
      { val: "180", text: getText("label.direction-180") }
    ];
    this.optionInfoList = choice.map((c: Item) => ({
      key: c.val,
      value: c.val,
      text: c.text,
      disabled: false
    }));
    this.optionInfoList.unshift({
      key: null,
      value: "",
      text: LanguageManager.instance.getText("label.direction"),
      disabled: true
    });
  }

  public focus() {
    const elm = this.$refs.component as CtrlSelect;
    elm.focus();
  }

  @TaskProcessor("language-change-finished")
  private async languageChangeFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    const getText = LanguageManager.instance.getText.bind(
      LanguageManager.instance
    );
    this.optionInfoList[0].text = getText("label.direction");
    this.optionInfoList[1].text = getText("label.direction-none");
    this.optionInfoList[2].text = getText("label.direction-horizontal");
    this.optionInfoList[3].text = getText("label.direction-vertical");
    this.optionInfoList[4].text = getText("label.direction-180");
    task.resolve();
  }
}
</script>
