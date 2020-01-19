<template>
  <ctrl-select
    v-model="localValue"
    :optionInfoList="optionInfoList"
    :maxWidth="10"
  />
</template>

<script lang="ts">
import SelectMixin from "./base/SelectMixin";
import CtrlSelect from "@/components/parts/CtrlSelect.vue";

import { Getter } from "vuex-class";
import { Component, Mixins } from "vue-mixin-decorator";
import { Prop } from "vue-property-decorator";
import VueEvent from "@/app/core/decorator/VueEvent";
import ComponentVue from "@/app/core/window/ComponentVue";

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
