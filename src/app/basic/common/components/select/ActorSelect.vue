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
import { Task, TaskResult } from "task";
import { Prop } from "vue-property-decorator";
import ComponentVue from "../../../../core/window/ComponentVue";
import LifeCycle from "../../../../core/decorator/LifeCycle";
import TaskProcessor from "../../../../core/task/TaskProcessor";
import { permissionCheck } from "@/app/core/api/app-server/SocketFacade";
import CtrlSelect from "../../../../core/component/CtrlSelect.vue";
import { HtmlOptionInfo } from "@/@types/window";
import GameObjectManager from "../../../GameObjectManager";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({
  components: { CtrlSelect }
})
export default class ActorSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  @Prop({ type: String, default: "" })
  private userKey!: string;

  @Prop({ type: Boolean, default: false })
  private nullable!: boolean;

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
    this.optionInfoList = GameObjectManager.instance.actorList
      .filter(a => {
        if (this.userKey && a.owner !== this.userKey) return false;
        return permissionCheck(a, "view");
      })
      .map(c => ({
        key: c.key,
        value: c.key,
        text: c.data!.name,
        disabled: false
      }));
    if (this.nullable) {
      this.optionInfoList.unshift({
        key: null,
        value: null,
        text: this.$t("label.non-select")!.toString(),
        disabled: false
      });
    }
    this.optionInfoList.unshift({
      key: "",
      value: "",
      text: this.$t("type.actor")!.toString(),
      disabled: true
    });
  }
}
</script>
