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
export default class ChatTabSelect extends Mixins<SelectMixin>(SelectMixin) {
  @Getter("chatTabs") private chatTabs: any;

  private get optionInfoList(): any[] {
    const resultList = this.chatTabs
      .filter((tabObj: any) => !tabObj.isTotal)
      .map((tabObj: any) => ({
        key: tabObj.key,
        value: tabObj.key,
        text: tabObj.name,
        disabled: false
      }));

    resultList.unshift({
      key: "",
      value: "",
      text: "未指定",
      disabled: false
    });

    return resultList;
  }
}
</script>
