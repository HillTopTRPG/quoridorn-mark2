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
import LanguageManager from "@/LanguageManager";
import { HtmlOptionInfo } from "@/@types/window";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import CtrlRadio from "@/app/core/component/CtrlRadio.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import { Mixins } from "vue-mixin-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";

@Component({
  components: { CtrlRadio }
})
export default class ChatColorTypeRadio extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, default: "owner" })
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
    const getText = LanguageManager.instance.getText.bind(
      LanguageManager.instance
    );
    this.optionInfoList.forEach(o => {
      o.text = getText(`label.${o.value}`);
      o.key = o.value || "";
    });
  }

  public focus() {
    const elm = this.$refs.component as CtrlRadio;
    elm.focus();
  }
}
</script>
