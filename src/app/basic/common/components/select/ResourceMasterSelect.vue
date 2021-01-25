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
import { Component, Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import { Prop } from "vue-property-decorator";
import { HtmlOptionInfo } from "@/@types/window";
import { ResourceType } from "@/@types/store-data-optional";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import CtrlSelect from "@/app/core/component/CtrlSelect.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import SelectMixin from "@/app/basic/common/components/select/base/SelectMixin";
import ComponentVue from "@/app/core/window/ComponentVue";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({ components: { CtrlSelect } })
export default class ResourceMasterSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  @Prop({ type: Array, default: [] })
  private filter!: ResourceType[];

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
    this.optionInfoList = GameObjectManager.instance.resourceMasterList
      .filter(r => {
        if (!this.filter.length) return true;
        return this.filter.some(f => f === r.data!.type);
      })
      .map(c => ({
        key: c.key,
        value: c.key,
        text: c.data!.label,
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
      text: this.$t("label.resource")!.toString(),
      disabled: true
    });
  }
}
</script>
