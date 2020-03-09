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
import ComponentVue from "@/app/core/window/ComponentVue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { HtmlOptionInfo } from "@/@types/window";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import LanguageManager from "@/LanguageManager";
import { Task, TaskResult } from "task";
import CtrlSelect from "@/app/core/component/CtrlSelect.vue";
import { Watch } from "vue-property-decorator";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({
  components: { CtrlSelect }
})
export default class SelfActorSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  private optionInfoList: HtmlOptionInfo[] = [];

  private actorList = GameObjectManager.instance.actorList;

  @LifeCycle
  @Watch("actorList", { deep: true })
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

    this.optionInfoList = GameObjectManager.instance.selfActors.map(a => {
      const type = a.data!.type;
      let additionalText = "";
      if (a.data!.type === "user") {
        const user = GameObjectManager.instance.userList.filter(
          u => u.id === a.owner
        )[0];
        additionalText +=
          "(" +
          LanguageManager.instance.getText(`label.${user.data!.type}`) +
          ")";
      }
      return {
        key: a.id!,
        value: a.id!,
        text: a.data!.name + additionalText,
        disabled: false
      };
    });
    this.optionInfoList.unshift({
      key: "",
      value: "",
      text: getText("type.actor"),
      disabled: true
    });
  }
}
</script>
