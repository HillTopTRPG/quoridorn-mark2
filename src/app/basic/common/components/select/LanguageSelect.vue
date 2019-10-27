<template>
  <ctrl-select v-model="localValue" :optionInfoList="optionInfoList" />
</template>

<script lang="ts">
import SelectMixin from "./base/SelectMixin";

import { Component, Mixins } from "vue-mixin-decorator";
import VueEvent from "@/app/core/decorator/VueEvent";
import CtrlSelect from "@/app/core/component/CtrlSelect.vue";
import SelectBase from "@/app/basic/common/components/select/base/SelectBase.vue";
import { SupportLangInfo, supportLangList } from "@/LanguageManager";

@Component({
  components: { CtrlSelect, SelectBase }
})
export default class LanguageSelect extends Mixins<SelectMixin>(SelectMixin) {
  @VueEvent
  private get optionInfoList(): any[] {
    const resultList: any[] = supportLangList.map((info: SupportLangInfo) => {
      return {
        key: info.lang,
        value: info.lang,
        text: info.title,
        disabled: false
      };
    });
    resultList.unshift({
      key: null,
      value: "",
      text: "Language",
      disabled: true
    });
    return resultList;
  }
}
</script>
