<template>
  <ctrl-select v-model="localValue" :optionInfoList="optionInfoList" />
</template>

<script lang="ts">
import SelectMixin from "./base/SelectMixin";
import CtrlSelect from "@/components/parts/CtrlSelect.vue";

import { Getter } from "vuex-class";
import { Component, Mixins } from "vue-mixin-decorator";

@Component({
  components: { CtrlSelect }
})
export default class CounterSelect extends Mixins<SelectMixin>(SelectMixin) {
  @Getter("propertyList") private propertyList: any;

  private get usePropertyList(): any[] {
    const resultList = this.propertyList.filter((property: any) => {
      let result = true;
      if (property.type === "checkbox") result = false;
      return result;
    });

    resultList.unshift({
      property: "修正（イニシアティブ同値時比較用）"
    });

    resultList.unshift({
      property: "イニシアティブ"
    });

    return resultList;
  }

  private get optionInfoList(): any[] {
    const resultList = this.usePropertyList.map((prop, index) => ({
      key: index,
      value: prop.property,
      text: prop.property,
      disabled: false
    }));
    resultList.unshift({
      key: -1,
      value: "",
      text: "未指定",
      disabled: false
    });
    return resultList;
  }
}
</script>
