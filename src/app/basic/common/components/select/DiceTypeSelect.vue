<template>
  <ctrl-select
    :elmId="elmId"
    v-model="localValue"
    :optionInfoList="optionInfoList"
    :multiple="multiple"
    :disabled="disabled"
    ref="component"
  />
</template>

<script lang="ts">
import SelectMixin from "./base/SelectMixin";
import { Component, Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import ComponentVue from "../../../../core/window/ComponentVue";
import LifeCycle from "../../../../core/decorator/LifeCycle";
import TaskProcessor from "../../../../core/task/TaskProcessor";
import CtrlSelect from "../../../../core/component/CtrlSelect.vue";
import { HtmlOptionInfo } from "@/@types/window";
import GameObjectManager from "@/app/basic/GameObjectManager";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({
  components: { CtrlSelect }
})
export default class PipsSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  private diceTypeList = GameObjectManager.instance.diceTypeList;
  private optionInfoList: HtmlOptionInfo[] = [];

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
    const optionInfoList: HtmlOptionInfo[] = this.diceTypeList.map(dt => ({
      key: dt.key,
      value: dt.key,
      text: `D${dt.data!.faceNum}-${dt.data!.label}`,
      disabled: false
    }));

    if (!optionInfoList.some(o => o.value === this.localValue)) {
      this.localValue = optionInfoList[0].value;
    }

    optionInfoList.unshift({
      key: "",
      value: "",
      text: this.$t("label.dice-type")!.toString(),
      disabled: true
    });

    this.optionInfoList = optionInfoList;
  }
}
</script>
