<template>
  <ctrl-select
    v-model="localValue"
    :optionInfoList="optionInfoList"
    :maxWidth="10"
  />
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
export default class GroupChatTabSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  @Getter("groupTargetTabListFiltered") private groupTargetTabListFiltered: any;

  @VueEvent
  private get optionInfoList(): any[] {
    const resultList = this.groupTargetTabListFiltered.map((tabObj: any) => ({
      key: tabObj.key,
      value: tabObj.key,
      text: tabObj.name,
      disabled: false
    }));
    return resultList;
  }
}
</script>
