<template>
  <ctrl-radio
    :optionInfoList="optionInfoList"
    name="backgroundTypeRadio"
    v-model="localValue"
    :test="test"
    ref="component"
  />
</template>

<script lang="ts">
import { Component, Prop, Emit } from "vue-property-decorator";
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
export default class BackgroundTypeRadio extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, default: "image" })
  public value!: string;

  @Prop({ type: Boolean, default: false })
  private test!: boolean;

  @Emit("input")
  public input(value: string | null) {}

  private get localValue(): string | null {
    if (this.test)
      console.log("set '" + this.value + "'", this.constructor.name);
    return this.value || "";
  }

  private set localValue(value: string | null) {
    if (this.test) console.log("return '" + value + "'", this.constructor.name);
    this.input(value);
  }

  private optionInfoList: HtmlOptionInfo[] = [
    { value: "image", key: "", text: "", disabled: false },
    { value: "color", key: "", text: "", disabled: false }
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
      o.text = this.$t(`label.${o.value}`)!.toString();
      o.key = o.value || "";
    });
  }

  public focus() {
    const elm = this.$refs.component as CtrlRadio;
    elm.focus();
  }
}
</script>
