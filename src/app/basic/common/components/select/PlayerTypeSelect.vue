<template>
  <ctrl-select v-model="localValue" :optionInfoList="optionInfoList" />
</template>

<script lang="ts">
import SelectMixin from "./base/SelectMixin";
import CtrlSelect from "@/components/parts/CtrlSelect.vue";

import { Component, Mixins } from "vue-mixin-decorator";
import { Getter } from "vuex-class";

@Component({
  components: { CtrlSelect }
})
export default class PlayerTypeSelect extends Mixins<SelectMixin>(SelectMixin) {
  @Getter("roles") private roles: any;

  private get optionInfoList(): any[] {
    const resultList = this.roles.map((role: any) => ({
      key: role.value,
      value: role.value,
      text: role.label,
      disabled: false
    }));
    resultList.unshift({
      key: null,
      value: "",
      text: "権限",
      disabled: true
    });
    return resultList;
  }
}
</script>
