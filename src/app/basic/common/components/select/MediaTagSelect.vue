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

import { Prop } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import CtrlSelect from "@/app/core/component/CtrlSelect.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { UrlType } from "@/@types/store-data-optional";
import ComponentVue from "@/app/core/window/ComponentVue";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({ components: { CtrlSelect } })
export default class MediaTagSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  @Prop({ type: String, required: true })
  protected label!: string;

  @Prop({ type: Array, required: true })
  private filterList!: UrlType[];

  private optionInfoList: any[] = [];

  @LifeCycle
  private created() {
    this.createOptionInfoList();
    if (this.localValue === null) {
      this.localValue = this.optionInfoList[1].value;
    }
  }

  @TaskProcessor("language-change-finished")
  private async languageChangeFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    this.createOptionInfoList();
    task.resolve();
  }

  private createOptionInfoList() {
    this.optionInfoList = GameObjectManager.instance.mediaList
      .map(media => media.data!.tag)
      .filter((tag, index, list) => list.indexOf(tag) === index)
      .filter(tag =>
        GameObjectManager.instance.mediaList.some(
          media =>
            media.data!.tag === tag &&
            this.filterList.some(t => t === media.data!.urlType)
        )
      )
      .map(tag => ({
        key: tag,
        value: tag,
        text: tag || this.$t("label.non-tag")!.toString(),
        disabled: false
      }));
    this.optionInfoList.unshift({
      key: null,
      value: null,
      text: this.$t(this.label)!.toString(),
      disabled: true
    });
  }
}
</script>
