<template>
  <ctrl-select
    :elmId="elmId"
    :optionInfoList="optionInfoList"
    :disabled="disabled"
    :readonly="readonly"
    :name="`chat-color-type-select-${key}`"
    v-model="localValue"
    ref="component"
  />
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { Task, TaskResult } from "task";
import { Mixins } from "vue-mixin-decorator";
import CtrlSelect from "../../../../core/component/CtrlSelect.vue";
import LifeCycle from "../../../../core/decorator/LifeCycle";
import TaskProcessor from "../../../../core/task/TaskProcessor";
import ComponentVue from "../../../../core/window/ComponentVue";
import { HtmlOptionInfo } from "@/@types/window";
import SelectMixin from "@/app/basic/common/components/select/base/SelectMixin";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({ components: { CtrlSelect } })
export default class ChatColorTypeSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  @Prop({ type: String, default: "owner" })
  public value!: string;

  private optionInfoList: HtmlOptionInfo[] = [
    { value: "", key: "", text: "", disabled: true },
    { value: "owner", key: "", text: "", disabled: false },
    { value: "original", key: "", text: "", disabled: false }
  ];

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
    this.optionInfoList.forEach(o => {
      o.text = this.$t(
        `selection.chat-color-type.${o.value || "label"}`
      )!.toString();
      o.key = o.value;
    });
  }

  public focus() {
    const elm = this.$refs.component as CtrlSelect;
    elm.focus();
  }
}
</script>
