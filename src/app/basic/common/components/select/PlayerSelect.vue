<template>
  <ctrl-select v-model="localValue" :optionInfoList="optionInfoList" />
</template>

<script lang="ts">
import SelectMixin from "./base/SelectMixin";
import SelectBase from "./base/SelectBase.vue";

import { Getter } from "vuex-class";
import { Component, Mixins } from "vue-mixin-decorator";
import CtrlSelect from "@/components/parts/CtrlSelect.vue";

@Component({
  components: { CtrlSelect, SelectBase }
})
export default class PlayerSelect extends Mixins<SelectMixin>(SelectMixin) {
  @Getter("playerList") private playerList: any;

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
