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

@Component({
  components: { CtrlSelect }
})
export default class GroupChatTabSelect extends Mixins<SelectMixin>(
  SelectMixin
) {
  @Getter("groupTargetTabListFiltered") private groupTargetTabListFiltered: any;

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
