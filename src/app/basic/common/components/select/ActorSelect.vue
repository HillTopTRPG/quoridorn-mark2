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
import { permissionCheck } from "@/app/core/api/app-server/SocketFacade";
import { HtmlOptionInfo } from "@/@types/window";
import ComponentVue from "@/app/core/window/ComponentVue";
import VueEvent from "@/app/core/decorator/VueEvent";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import CtrlSelect from "@/app/core/component/CtrlSelect.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";

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

  @Prop({ type: Boolean, default: false })
  private viewUser!: boolean;

  private optionInfoList: HtmlOptionInfo[] = [];

  @LifeCycle
  private async created() {
    this.createOptionInfoList();
  }

  @VueEvent
  private getOwnerName(userKey: string): string {
    return GameObjectManager.instance.getUserName(userKey);
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
      .map(a => ({
        key: a.key,
        value: a.key,
        text:
          GameObjectManager.instance.getActorName(a.key) +
          (this.viewUser
            ? ` [user: ${GameObjectManager.instance.getUserName(
                a.owner || ""
              )}]`
            : ""),
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
