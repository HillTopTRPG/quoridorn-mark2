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
import ComponentVue from "@/app/core/window/ComponentVue";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({
  components: { CtrlSelect }
})
export default class LanguageSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
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
