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
import ComponentVue from "@/app/core/window/ComponentVue";
import { HtmlOptionInfo } from "@/@types/window";
import { Prop } from "vue-property-decorator";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import CtrlSelect from "@/app/core/component/CtrlSelect.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({ components: { CtrlSelect } })
export default class SceneLayerSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  @Prop({ type: String, default: null })
  private sceneKey!: string | null;
  @Prop({ type: Boolean, default: false })
  private unUseDisabled!: boolean;

  private orderList: string[] = [];
  private optionInfoList: HtmlOptionInfo[] = [];

  @LifeCycle
  private async created() {
    const sceneKey =
      this.sceneKey || GameObjectManager.instance.roomData.sceneKey;
    // GameObjectManager.instance.sceneAndLayerList
    //   .filter(mal => mal.data!.sceneKey === sceneKey)
    //   .forEach(mal => {
    //     const layerKey = mal.data!.layerKey;
    //     const layer = findRequireByKey(
    //       GameObjectManager.instance.sceneLayerList,
    //       layerKey
    //     );
    //     // TODO やり残し？
    //   });
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
      .sort((sl1, sl2) => {
        const sl1Index = this.orderList.findIndex(o => o === sl1.key);
        const sl2Index = this.orderList.findIndex(o => o === sl2.key);
        if (sl1Index < sl2Index) return 1;
        if (sl1Index > sl2Index) return -1;
        return 0;
      })
      .map(sl => {
        const mlIndex = this.orderList.findIndex(o => o === sl.key);
        let text = sl.data!.name;
        if (sl.data!.type !== "other")
          text = this.$t(`type.${sl.data!.type}`)!.toString();

        let disabled = false;
        if (this.unUseDisabled) {
          const sceneKey =
            this.sceneKey || GameObjectManager.instance.roomData.sceneKey;
          const sceneAndLayer = GameObjectManager.instance.sceneAndLayerList.find(
            sal =>
              sal.data!.layerKey === sl.key && sal.data!.sceneKey === sceneKey
          );
          disabled = !sceneAndLayer!.data!.isUse;
        }
        return {
          key: sl.key,
          value: sl.key,
          text: `${mlIndex + 1}：${text}`,
          disabled
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
