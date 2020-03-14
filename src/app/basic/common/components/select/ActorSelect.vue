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
import { HtmlOptionInfo } from "@/@types/window";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import GameObjectManager from "@/app/basic/GameObjectManager";
import LanguageManager from "@/LanguageManager";
import CtrlSelect from "@/app/core/component/CtrlSelect.vue";
import ComponentVue from "@/app/core/window/ComponentVue";
import { permissionCheck } from "@/app/core/api/app-server/SocketFacade";
import { Prop } from "vue-property-decorator";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({
  components: { CtrlSelect }
})
export default class ActorSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  @Prop({ type: String, default: "" })
  private userId!: string;

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
    const getText = LanguageManager.instance.getText.bind(
      LanguageManager.instance
    );

    this.optionInfoList = GameObjectManager.instance.actorList
      .filter(a => {
        if (this.userId && a.owner !== this.userId) return false;
        return permissionCheck(a, "view");
      })
      .map(c => ({
        key: c.id!,
        value: c.id!,
        text: c.data!.name,
        disabled: false
      }));
    this.optionInfoList.unshift({
      key: "",
      value: "",
      text: getText("type.actor"),
      disabled: true
    });
  }
}
</script>
