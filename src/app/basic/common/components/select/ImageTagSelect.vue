<template>
  <ctrl-select
    :elmId="elmId"
    v-model="localValue"
    :optionInfoList="optionInfoList"
    ref="component"
  />
</template>

<script lang="ts">
import SelectMixin from "./base/SelectMixin";

import { Prop } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import LifeCycle from "../../../../core/decorator/LifeCycle";
import TaskProcessor from "../../../../core/task/TaskProcessor";
import CtrlSelect from "../../../../core/component/CtrlSelect.vue";
import ComponentVue from "../../../../core/window/ComponentVue";
import GameObjectManager from "../../../GameObjectManager";
import LanguageManager from "../../../../../LanguageManager";

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
    this.optionInfoList = GameObjectManager.instance.mediaList
      .map(image => image.data!.tag)
      .filter((tag, index, list) => list.indexOf(tag) === index)
      .map(tag => ({
        key: tag,
        value: tag,
        text: tag || this.$t("label.non-tag")!.toString(),
        disabled: false
      }));
    if (this.defaultLabel) {
      this.optionInfoList.unshift({
        key: null,
        value: null,
        text:
          this.defaultLabel === "label.image-tag"
            ? this.$t(this.defaultLabel)!.toString()
            : this.defaultLabel,
        disabled: true
      });
    }
  }
}
</script>
