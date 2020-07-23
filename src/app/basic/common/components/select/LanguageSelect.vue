<template>
  <ctrl-select v-model="localValue" :optionInfoList="optionInfoList" />
</template>

<script lang="ts">
import SelectMixin from "./base/SelectMixin";

import { Component, Mixins } from "vue-mixin-decorator";
import CtrlSelect from "../../../../core/component/CtrlSelect.vue";
import ComponentVue from "../../../../core/window/ComponentVue";
import {
  SupportLangInfo,
  supportLangList
} from "../../../../../LanguageManager";
import VueEvent from "../../../../core/decorator/VueEvent";

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
