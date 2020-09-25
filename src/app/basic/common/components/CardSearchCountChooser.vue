<template>
  <div class="card-search-count-chooser">
    <s-check
      v-for="option in optionInfoList"
      :key="option.key"
      :value="isChecked(option.value)"
      colorStyle="skyblue"
      c-icon="checkmark"
      :c-label="option.text"
      n-icon=""
      :n-label="option.text"
      @input="onInput(option.value)"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import { Prop } from "vue-property-decorator";
import LifeCycle from "../../../core/decorator/LifeCycle";
import TaskProcessor from "../../../core/task/TaskProcessor";
import ComponentVue from "../../../core/window/ComponentVue";
import { HtmlOptionInfo } from "@/@types/window";
import SCheck from "./SCheck.vue";
import VueEvent from "../../../core/decorator/VueEvent";

@Component({
  components: { SCheck }
})
export default class CardSearchCountChooser extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Array, required: true })
  public value!: string[];

  public input(value: string[]) {
    this.$emit("input", value);
  }

  private get localValue(): string[] {
    return this.value;
  }

  private set localValue(value: string[]) {
    this.input(value);
  }

  @VueEvent
  private isChecked(key: string): boolean {
    return this.localValue.some(l => l === key);
  }

  @VueEvent
  private onInput(key: string) {
    const index = this.localValue.findIndex(l => l === key);
    if (index === -1) this.localValue.push(key);
    else this.localValue.splice(index, 1);
    this.input(this.localValue);
  }

  private optionInfoList: HtmlOptionInfo[] = [
    { value: "0", key: "count-zero", text: "", disabled: false },
    { value: "1", key: "count-one", text: "", disabled: false },
    { value: "2", key: "count-two", text: "", disabled: false },
    { value: "3", key: "count-three", text: "", disabled: false },
    { value: "4", key: "count-four", text: "", disabled: false },
    { value: "more", key: "count-more", text: "", disabled: false }
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
      o.text = this.$t(`card-deck-builder.options.${o.key}`)!.toString();
    });
  }

  public focus() {
    /* Nothing. */
  }
}
</script>
