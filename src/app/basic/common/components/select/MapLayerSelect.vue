<template>
  <ctrl-select
    v-model="localValue"
    :optionInfoList="optionInfoList"
    :id="id"
    ref="component"
  />
</template>

<script lang="ts">
import SelectMixin from "./base/SelectMixin";

import { Component, Mixins } from "vue-mixin-decorator";
import VueEvent from "@/app/core/decorator/VueEvent";
import CtrlSelect from "@/app/core/component/CtrlSelect.vue";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "@/@types/task";
import LanguageManager from "@/LanguageManager";
import ComponentVue from "@/app/core/window/ComponentVue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";

type Item = {
  val: string;
  text: string;
};

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({
  components: { CtrlSelect }
})
export default class MapLayerSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  private optionInfoList: any[] = [];
  private orderList: string[] = [];

  @VueEvent
  private async mounted() {
    const roomDataCC = SocketFacade.instance.roomDataCC();
    const roomData = (await roomDataCC.getList(false))[0];
    const mapId = roomData.data!.mapId;
    this.orderList = GameObjectManager.instance.mapAndLayerList
      .filter(mal => mal.data!.mapId === mapId)
      .sort((mal1, mal2) => {
        if (mal1.order < mal2.order) return -1;
        if (mal1.order > mal2.order) return 1;
        return 0;
      })
      .map(mal => mal.data!.layerId);
    this.createOptionInfoList();
  }

  private createOptionInfoList() {
    const getText = LanguageManager.instance.getText.bind(
      LanguageManager.instance
    );

    const choice: Item[] = GameObjectManager.instance.mapLayerList
      .sort((ml1, ml2) => {
        const ml1Index = this.orderList.findIndex(o => o === ml1.id);
        const ml2Index = this.orderList.findIndex(o => o === ml2.id);
        if (ml1Index < ml2Index) return 1;
        if (ml1Index > ml2Index) return -1;
        return 0;
      })
      .map(ml => {
        const mlIndex = this.orderList.findIndex(o => o === ml.id);
        let text = ml.data!.name;
        if (ml.data!.type !== "other") text = getText(`type.${ml.data!.type}`);
        return {
          val: ml.id!,
          text: `${mlIndex + 1}：${text}`
        };
      });
    this.optionInfoList = choice.map((c: Item) => ({
      key: c.val,
      value: c.val,
      text: c.text,
      disabled: false
    }));
    this.optionInfoList.unshift({
      key: null,
      value: "",
      text: LanguageManager.instance.getText("label.layer"),
      disabled: true
    });
  }

  public focus() {
    const elm = this.$refs.component as CtrlSelect;
    elm.focus();
  }

  @TaskProcessor("language-change-finished")
  private async languageChangeFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    this.createOptionInfoList();
    task.resolve();
  }
}
</script>
