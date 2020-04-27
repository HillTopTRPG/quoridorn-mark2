<template>
  <ctrl-select
    :optionInfoList="optionInfoList"
    :disabled="disabled"
    :readonly="readonly"
    :name="`card-deck-layout-select-${key}`"
    v-model="localValue"
    ref="component"
  />
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { Task, TaskResult } from "task";
import { Mixins } from "vue-mixin-decorator";
import CtrlSelect from "@/app/core/component/CtrlSelect.vue";
import ComponentVue from "@/app/core/window/ComponentVue";
import { HtmlOptionInfo } from "@/@types/window";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import LanguageManager from "@/LanguageManager";

@Component({
  components: { CtrlSelect }
})
export default class CardDeckLayoutSelect extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, default: "pile-up" })
  public value!: string;

  @Prop({ type: Boolean, default: false })
  public disabled!: boolean;

  @Prop({ type: Boolean, default: false })
  public readonly!: boolean;

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
    { value: "", key: "", text: "", disabled: true },
    { value: "pile-up", key: "", text: "", disabled: false },
    { value: "spread-out", key: "", text: "", disabled: false },
    { value: "tile", key: "", text: "", disabled: false },
    { value: "line", key: "", text: "", disabled: false }
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
      if (!o.value) {
        o.text = this.$t("context.layout")!.toString();
        return;
      }
      o.text = this.$t(`context.layout-${o.value}`)!.toString();
      o.key = o.value;
    });
  }

  public focus() {
    const elm = this.$refs.component as CtrlSelect;
    elm.focus();
  }
}
</script>
