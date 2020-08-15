<template>
  <ctrl-select
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
import { Prop, Watch } from "vue-property-decorator";
import GameObjectManager from "@/app/basic/GameObjectManager";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({
  components: { CtrlSelect }
})
export default class PipsSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  private diceAndPipsList = GameObjectManager.instance.diceAndPipsList;

  @Prop({ type: String, required: true })
  private diceTypeId!: string;

  private optionInfoList: HtmlOptionInfo[] = [];

  @LifeCycle
  private created() {
    this.createOptionInfoList();
  }

  @Watch("diceTypeId")
  private onChangeDiceTypeId() {
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
    const pipsList = this.diceAndPipsList
      .filter(dap => dap.data!.diceTypeId === this.diceTypeId)!
      .map(dap => dap.data!.pips);
    const optionInfoList: HtmlOptionInfo[] = pipsList.map(p => ({
      key: p,
      value: p,
      text: p,
      disabled: false
    }));

    if (!optionInfoList.some(o => o.value === this.localValue)) {
      this.localValue = optionInfoList[0].value;
    }

    optionInfoList.unshift({
      key: "",
      value: "",
      text: this.$t("label.pips")!.toString(),
      disabled: true
    });

    this.optionInfoList = optionInfoList;
  }
}
</script>
