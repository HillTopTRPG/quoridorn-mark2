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
import LifeCycle from "../../../../core/decorator/LifeCycle";
import TaskProcessor from "../../../../core/task/TaskProcessor";
import CtrlSelect from "../../../../core/component/CtrlSelect.vue";
import ComponentVue from "../../../../core/window/ComponentVue";
import { HtmlOptionInfo } from "@/@types/window";
import GameObjectManager from "../../../GameObjectManager";
import LanguageManager from "../../../../../LanguageManager";
import { findRequireByKey } from "@/app/core/utility/Utility";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({ components: { CtrlSelect } })
export default class SceneLayerSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  private orderList: string[] = [];
  private optionInfoList: HtmlOptionInfo[] = [];

  @LifeCycle
  private async created() {
    const roomData = GameObjectManager.instance.roomData;
    const sceneKey = roomData.sceneKey;
    GameObjectManager.instance.sceneAndLayerList
      .filter(mal => mal.data!.sceneKey === sceneKey)
      .forEach(mal => {
        const layerKey = mal.data!.layerKey;
        const layer = findRequireByKey(
          GameObjectManager.instance.sceneLayerList,
          layerKey
        );
        // TODO やり残し？
      });
    this.orderList = GameObjectManager.instance.sceneAndLayerList
      .filter(mal => mal.data!.sceneKey === sceneKey)
      .sort((mal1, mal2) => {
        if (mal1.order < mal2.order) return -1;
        if (mal1.order > mal2.order) return 1;
        return 0;
      })
      .map(mal => mal.data!.layerKey);
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
    this.optionInfoList = GameObjectManager.instance.sceneLayerList
      .sort((ml1, ml2) => {
        const ml1Index = this.orderList.findIndex(o => o === ml1.key);
        const ml2Index = this.orderList.findIndex(o => o === ml2.key);
        if (ml1Index < ml2Index) return 1;
        if (ml1Index > ml2Index) return -1;
        return 0;
      })
      .map(ml => {
        const mlIndex = this.orderList.findIndex(o => o === ml.key);
        let text = ml.data!.name;
        if (ml.data!.type !== "other")
          text = this.$t(`type.${ml.data!.type}`)!.toString();
        return {
          key: ml.key,
          value: ml.key,
          text: `${mlIndex + 1}：${text}`,
          disabled: false
        };
      });
    this.optionInfoList.unshift({
      key: "",
      value: "",
      text: this.$t("label.layer")!.toString(),
      disabled: true
    });
  }
}
</script>
