<template>
  <ctrl-select
    v-model="localValue"
    :optionInfoList="optionInfoList"
    :test="test"
    :disabled="disabled"
  >
    <option
      v-for="status in statusList"
      :key="status.name"
      :value="status.name"
    >
      {{ status.name }}
    </option>
  </ctrl-select>
</template>

<script lang="ts">
import SelectMixin from "./base/SelectMixin";
import CtrlSelect from "@/components/parts/CtrlSelect.vue";

import { Prop } from "vue-property-decorator";
import { Getter } from "vuex-class";
import { Component, Mixins } from "vue-mixin-decorator";

@Component({
  components: { CtrlSelect }
})
export default class ActorStatusSelect extends Mixins<SelectMixin>(
  SelectMixin
) {
  @Prop({ type: String, required: true })
  private actorKey!: string;

  @Prop({ type: Boolean, default: false })
  private disabled!: boolean;

  @Getter("getObj") private getObj: any;

  private get statusList(): any[] {
    const actor = this.getObj(this.actorKey);
    return actor ? actor.statusList : [];
  }

  private get optionInfoList(): any[] {
    const resultList = this.statusList.map(status => ({
      key: status.name,
      value: status.name,
      text: status.name,
      disabled: false
    }));
    resultList.unshift({
      key: null,
      value: "",
      text: "状態",
      disabled: true
    });
    return resultList;
  }
}
</script>
