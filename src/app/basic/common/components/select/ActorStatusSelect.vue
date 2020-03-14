<template>
  <ctrl-select
    v-model="localValue"
    :optionInfoList="optionInfoList"
    :readonly="readonly"
    ref="component"
  />
</template>

<script lang="ts">
import SelectMixin from "./base/SelectMixin";
import { Component, Mixins } from "vue-mixin-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { HtmlOptionInfo } from "@/@types/window";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import LanguageManager from "@/LanguageManager";
import { Task, TaskResult } from "task";
import CtrlSelect from "@/app/core/component/CtrlSelect.vue";
import { Prop, Watch } from "vue-property-decorator";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({
  components: { CtrlSelect }
})
export default class ActorStatusSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private actorId!: string;

  private optionInfoList: HtmlOptionInfo[] = [];

  private statusList = GameObjectManager.instance.actorStatusList;

  @LifeCycle
  private created() {
    this.createOptionInfoList();
  }

  @Watch("actorId")
  private onChangeActorId() {
    this.createOptionInfoList();
  }

  @Watch("statusList", { deep: true })
  private onChangeStatusList() {
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

    this.optionInfoList = this.statusList
      .filter(s => s.owner === this.actorId)
      .map(s => {
        return {
          key: s.id!,
          value: s.id!,
          text: s.data!.name,
          disabled: false
        };
      });
    this.optionInfoList.unshift({
      key: "",
      value: "",
      text: getText("label.status"),
      disabled: true
    });
  }
}
</script>
