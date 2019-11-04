<template>
  <ctrl-select v-model="localValue" :optionInfoList="optionInfoList" />
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

type Item = {
  val: UserType;
  text: string;
};

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({
  components: { CtrlSelect }
})
export default class UserTypeSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  private optionInfoList: any[] = [];

  @VueEvent
  private mounted() {
    const choice: Item[] = [
      { val: "PL", text: LanguageManager.instance.getText("label.player") },
      { val: "GM", text: LanguageManager.instance.getText("label.gameMaster") },
      {
        val: "VISITOR",
        text: LanguageManager.instance.getText("label.visitor")
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
      text: LanguageManager.instance.getText("label.authority"),
      disabled: true
    });
  }

  @TaskProcessor("language-change-finished")
  private async languageChangeFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    this.optionInfoList[0].text = LanguageManager.instance.getText(
      "label.authority"
    );
    this.optionInfoList[1].text = LanguageManager.instance.getText(
      "label.player"
    );
    this.optionInfoList[2].text = LanguageManager.instance.getText(
      "label.gameMaster"
    );
    this.optionInfoList[3].text = LanguageManager.instance.getText(
      "label.visitor"
    );
    task.resolve();
  }
}
</script>
