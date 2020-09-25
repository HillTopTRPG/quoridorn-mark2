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

import { Component, Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import { Prop, Watch } from "vue-property-decorator";
import LifeCycle from "../../../../core/decorator/LifeCycle";
import TaskProcessor from "../../../../core/task/TaskProcessor";
import CtrlSelect from "../../../../core/component/CtrlSelect.vue";
import ComponentVue from "../../../../core/window/ComponentVue";
import { HtmlOptionInfo } from "@/@types/window";
import GameObjectManager from "../../../GameObjectManager";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({ components: { CtrlSelect } })
export default class StartTimeActorStatusSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private parentKey!: string;

  private optionInfoList: HtmlOptionInfo[] = [];

  private actorStatusList = GameObjectManager.instance.actorStatusList;

  private get optionInfoContents(): HtmlOptionInfo[] {
    return this.actorStatusList
      .filter(s => s.owner === this.parentKey)
      .map(s => ({
        key: s.key,
        value: s.key,
        text: s.data!.name,
        disabled: false
      }));
  }

  @LifeCycle
  @Watch("optionInfoContents")
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
    this.optionInfoList = this.optionInfoContents.concat();
    this.optionInfoList.unshift({
      key: "",
      value: "",
      text: this.$t("label.actor-status")!.toString(),
      disabled: true
    });
  }
}
</script>
