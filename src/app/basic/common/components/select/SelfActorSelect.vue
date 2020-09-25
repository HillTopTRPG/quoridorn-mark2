<template>
  <ctrl-select
    :elmId="elmId"
    v-model="localValue"
    :optionInfoList="optionInfoList"
    ref="component"
  />
</template>

<script lang="ts">
import SelectMixin from "./base/SelectMixin";
import { Component, Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import { Watch } from "vue-property-decorator";
import LifeCycle from "../../../../core/decorator/LifeCycle";
import TaskProcessor from "../../../../core/task/TaskProcessor";
import CtrlSelect from "../../../../core/component/CtrlSelect.vue";
import ComponentVue from "../../../../core/window/ComponentVue";
import { HtmlOptionInfo } from "@/@types/window";
import GameObjectManager from "../../../GameObjectManager";
import { findRequireByKey } from "@/app/core/utility/Utility";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({ components: { CtrlSelect } })
export default class SelfActorSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  private optionInfoList: HtmlOptionInfo[] = [];

  private actorList = GameObjectManager.instance.actorList;
  private userList = GameObjectManager.instance.userList;

  @LifeCycle
  private created() {
    this.createOptionInfoList();
  }

  @Watch("actorList", { deep: true })
  private onChangeActorList() {
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
    this.optionInfoList = this.actorList
      .filter(a => a.owner === GameObjectManager.instance.mySelfUserKey)
      .map(a => {
        let additionalText = "";
        if (a.data!.type === "user") {
          const user = findRequireByKey(this.userList, a.owner);
          additionalText +=
            "(" +
            this.$t(`selection.user-type.${user.data!.type}`)!.toString() +
            ")";
        }
        return {
          key: a.key,
          value: a.key,
          text: a.data!.name + additionalText,
          disabled: false
        };
      });
    this.optionInfoList.unshift({
      key: "",
      value: "",
      text: this.$t("type.actor")!.toString(),
      disabled: true
    });
  }
}
</script>
