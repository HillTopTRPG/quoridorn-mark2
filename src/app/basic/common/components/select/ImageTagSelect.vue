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

import { Prop } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";
import GameObjectManager from "@/app/basic/GameObjectManager";
import CtrlSelect from "@/app/core/component/CtrlSelect.vue";
import LanguageManager from "@/LanguageManager";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import ComponentVue from "@/app/core/window/ComponentVue";
import LifeCycle from "@/app/core/decorator/LifeCycle";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({ components: { CtrlSelect } })
export default class ImageTagSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  @Prop({ type: String, default: "label.image-tag" })
  protected defaultLabel!: string;

  private optionInfoList: any[] = [];

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
    this.optionInfoList = GameObjectManager.instance.imageTagList.map(
      tagObj => ({
        key: tagObj.id,
        value: tagObj.data,
        text: tagObj.data,
        disabled: false
      })
    );
    if (this.defaultLabel) {
      this.optionInfoList.unshift({
        key: null,
        value: "",
        text:
          this.defaultLabel === "label.image-tag"
            ? getText(this.defaultLabel)
            : this.defaultLabel,
        disabled: true
      });
    }
  }
}
</script>
