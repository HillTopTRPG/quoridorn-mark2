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
import { UserType } from "@/@types/socket";
import CtrlSelect from "@/app/core/component/CtrlSelect.vue";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "@/@types/task";
import LanguageManager from "@/LanguageManager";
import ComponentVue from "@/app/core/window/ComponentVue";
import { BackgroundSize, Reverse } from "@/@types/room";

type Item = {
  val: BackgroundSize;
  text: string;
};

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({
  components: { CtrlSelect }
})
export default class BackgroundLocationSelect extends Mixins<MultiMixin>(
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
      { val: "contain", text: getText("label.background-location-contain") },
      { val: "100%", text: getText("label.background-location-100%") },
      {
        val: "cover-start",
        text: getText("label.background-location-cover-start")
      },
      {
        val: "cover-center",
        text: getText("label.background-location-cover-center")
      },
      {
        val: "cover-end",
        text: getText("label.background-location-cover-end")
      }
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
      text: LanguageManager.instance.getText("label.background-location"),
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
    this.optionInfoList[0].text = getText("label.background-location");
    this.optionInfoList[1].text = getText("label.background-location-contain");
    this.optionInfoList[2].text = getText("label.background-location-100%");
    this.optionInfoList[3].text = getText(
      "label.background-location-cover-start"
    );
    this.optionInfoList[4].text = getText(
      "label.background-location-cover-center"
    );
    this.optionInfoList[5].text = getText(
      "label.background-location-cover-end"
    );
    task.resolve();
  }
}
</script>
