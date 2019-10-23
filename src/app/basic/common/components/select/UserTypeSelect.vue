<template>
  <ctrl-select v-model="localValue" :optionInfoList="optionInfoList" />
</template>

<script lang="ts">
import SelectMixin from "./base/SelectMixin";

import { Component, Mixins } from "vue-mixin-decorator";
import VueEvent from "@/app/core/decorator/VueEvent";
import { UserType } from "@/@types/room";
import CtrlSelect from "@/app/core/component/CtrlSelect.vue";

type Item = {
  val: UserType;
  text: string;
};

@Component({
  components: { CtrlSelect }
})
export default class UserTypeSelect extends Mixins<SelectMixin>(SelectMixin) {
  @VueEvent
  private get optionInfoList(): any[] {
    const choice: Item[] = [
      { val: "GM", text: "GM" },
      { val: "PL", text: "PL" },
      { val: "VISITOR", text: "見学者" }
    ];
    const resultList: any = choice.map((c: Item) => ({
      key: c.val,
      value: c.val,
      text: c.text,
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
