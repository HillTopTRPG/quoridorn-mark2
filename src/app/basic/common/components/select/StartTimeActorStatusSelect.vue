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
import GameObjectManager from "@/app/basic/GameObjectManager";
import { HtmlOptionInfo } from "@/@types/window";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import { Prop, Watch } from "vue-property-decorator";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({
  components: { CtrlSelect }
})
export default class StartTimeActorStatusSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private parentId!: string;

  private optionInfoList: HtmlOptionInfo[] = [];

  private actorStatusList = GameObjectManager.instance.actorStatusList;

  private get optionInfoContents(): HtmlOptionInfo[] {
    return this.actorStatusList
      .filter(s => s.owner === this.parentId)
      .map(s => ({
        key: s.id!,
        value: s.id!,
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
