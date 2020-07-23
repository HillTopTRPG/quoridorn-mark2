<template>
  <ctrl-select v-model="localValue" :optionInfoList="optionInfoList" />
</template>

<script lang="ts">
import SelectMixin from "./base/SelectMixin";

import { Getter } from "vuex-class";
import { Component, Mixins } from "vue-mixin-decorator";
import CtrlSelect from "../../../../core/component/CtrlSelect.vue";
import ComponentVue from "../../../../core/window/ComponentVue";
import VueEvent from "../../../../core/decorator/VueEvent";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({
  components: { CtrlSelect }
})
export default class PlayerSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  @Getter("playerList") private playerList: any;

  @VueEvent
  private get optionInfoList(): any[] {
    const resultList = this.playerList.map((player: any) => ({
      key: player.key,
      value: player.key,
      text: player.name
    }));
    resultList.unshift({
      key: null,
      value: "",
      text: "プレイヤー",
      disabled: true
    });
    return resultList;
  }
}
</script>
