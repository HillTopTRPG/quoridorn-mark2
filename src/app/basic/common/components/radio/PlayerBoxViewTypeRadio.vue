<template>
  <ctrl-radio
    :optionInfoList="optionInfoList"
    name="backgroundTypeRadio"
    v-model="localValue"
    ref="component"
  />
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { Task, TaskResult } from "task";
import { Mixins } from "vue-mixin-decorator";
import CtrlRadio from "../../../../core/component/CtrlRadio.vue";
import LifeCycle from "../../../../core/decorator/LifeCycle";
import TaskProcessor from "../../../../core/task/TaskProcessor";
import ComponentVue from "../../../../core/window/ComponentVue";
import { HtmlOptionInfo } from "@/@types/window";

@Component({
  components: { CtrlRadio }
})
export default class PlayerBoxViewTypeRadio extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, default: "actor" })
  public value!: string;

  public input(value: string) {
    this.$emit("input", value);
  }

  private get localValue(): string {
    return this.value || "";
  }

  private set localValue(value: string) {
    this.input(value);
  }

  private optionInfoList: HtmlOptionInfo[] = [
    { value: "actor", key: "", text: "", disabled: false },
    { value: "piece", key: "", text: "", disabled: false }
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
      o.text = this.$t(`type.${o.value}`)!.toString();
      o.key = o.value;
    });
  }

  public focus() {
    const elm = this.$refs.component as CtrlRadio;
    elm.focus();
  }
}
</script>
