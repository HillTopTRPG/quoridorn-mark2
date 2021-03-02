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
import { Prop } from "vue-property-decorator";
import { Task, TaskResult } from "task";
import { HtmlOptionInfo } from "@/@types/window";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import CtrlSelect from "@/app/core/component/CtrlSelect.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import ComponentVue from "@/app/core/window/ComponentVue";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({ components: { CtrlSelect } })
export default class UserSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  @Prop({ type: Boolean, default: false })
  private isUseAll!: boolean;

  private optionInfoList: HtmlOptionInfo[] = [];

  @LifeCycle
  private async created() {
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
    let userList = GameObjectManager.instance.userList;
    this.optionInfoList = userList.map(u => {
      const userTypeStr = this.$t(
        `selection.user-type.${u.data!.type}`.toLowerCase()
      )!.toString();
      const text = `${u.data!.name}(${userTypeStr})`;
      return {
        key: u.key,
        value: u.key,
        text,
        disabled: false
      };
    });
    if (this.isUseAll) {
      this.optionInfoList.unshift({
        key: "",
        value: "",
        text: this.$t("label.all")!.toString(),
        disabled: false
      });
    }
    this.optionInfoList.unshift({
      key: "label",
      value: "label",
      text: this.$t("type.user")!.toString(),
      disabled: true
    });
  }
}
</script>
