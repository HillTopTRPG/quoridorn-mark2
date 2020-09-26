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
import LifeCycle from "../../../../core/decorator/LifeCycle";
import TaskProcessor from "../../../../core/task/TaskProcessor";
import CtrlSelect from "../../../../core/component/CtrlSelect.vue";
import ComponentVue from "../../../../core/window/ComponentVue";
import { HtmlOptionInfo } from "@/@types/window";
import GameObjectManager from "../../../GameObjectManager";
import { Place } from "@/@types/store-data-optional";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({ components: { CtrlSelect } })
export default class CharacterSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  @Prop({ type: Array, default: () => [] })
  private placeList!: Place[];

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
    this.optionInfoList = GameObjectManager.instance.sceneObjectList
      .filter(mo => {
        if (!(mo.data!.type === "character")) return false;
        return (
          this.placeList.length === 0 ||
          this.placeList.findIndex(p => p === mo.data!.place) > -1
        );
      })
      .map(c => ({
        key: c.key,
        value: c.key,
        text: c.data!.name,
        disabled: false
      }));
    this.optionInfoList.unshift({
      key: "",
      value: "",
      text: this.$t("type.character")!.toString(),
      disabled: true
    });
  }
}
</script>
