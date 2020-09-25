<template>
  <ctrl-select
    :elmId="elmId"
    v-model="localValue"
    :optionInfoList="optionInfoList"
    :readonly="readonly"
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
import GameObjectManager from "@/app/basic/GameObjectManager";
import { Watch } from "vue-property-decorator";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({ components: { CtrlSelect } })
export default class ActorNumberResourceSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  private optionInfoList: HtmlOptionInfo[] = [];

  private resourceMasterList = GameObjectManager.instance.resourceMasterList;

  @LifeCycle
  private created() {
    this.createOptionInfoList();
  }

  @Watch("resourceMasterList", { deep: true })
  private onChangeResourceMasterListDeep() {
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
    this.optionInfoList = this.resourceMasterList
      .filter(rm => rm.data!.type === "number" && rm.data!.isAutoAddActor)
      .map(rm => ({
        key: rm.key,
        value: rm.key,
        text: rm.data!.label,
        disabled: false
      }));
    this.optionInfoList.unshift({
      key: null,
      value: null,
      text: this.$t("label.non-select")!.toString(),
      disabled: false
    });
    this.optionInfoList.unshift({
      key: "",
      value: "",
      text: this.$t("label.resource")!.toString(),
      disabled: true
    });
  }
}
</script>
