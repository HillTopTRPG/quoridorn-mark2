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
import { HtmlOptionInfo } from "@/@types/window";
import { Prop, Watch } from "vue-property-decorator";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import CtrlSelect from "@/app/core/component/CtrlSelect.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import ComponentVue from "@/app/core/window/ComponentVue";
import SelectMixin from "@/app/basic/common/components/select/base/SelectMixin";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({ components: { CtrlSelect } })
export default class StoreKeySelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private type!: string;

  @Prop({ type: String, required: true })
  private labelProperty!: string;

  @Prop({ type: Boolean, default: false })
  private nullable!: boolean;

  private optionInfoList: HtmlOptionInfo[] = [];
  private list: StoreData<any>[] = [];

  @LifeCycle
  private async created() {
    this.list = GameObjectManager.instance.getList(this.type) || [];
    this.createOptionInfoList();
  }

  @TaskProcessor("language-change-finished")
  private async languageChangeFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    this.createOptionInfoList();
    task.resolve();
  }

  @Watch("list", { deep: true })
  private onChangeList() {
    this.createOptionInfoList();
  }

  private createOptionInfoList() {
    this.optionInfoList = this.list.map(item => {
      let text = item.data![this.labelProperty];
      return {
        key: item.key,
        value: item.key,
        text,
        disabled: false
      };
    });
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
      text: this.$t(`type.${this.type}`)!.toString(),
      disabled: true
    });
  }
}
</script>
