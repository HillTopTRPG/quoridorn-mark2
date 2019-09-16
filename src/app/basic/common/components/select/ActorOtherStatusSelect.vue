<template>
  <ctrl-select
    v-model="localValue"
    :optionInfoList="optionInfoList"
    :disabled="disabled"
  />
</template>

<script lang="ts">
import SelectMixin from "./base/SelectMixin";
import CtrlSelect from "@/components/parts/CtrlSelect.vue";

import { Prop } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";

@Component({
  components: { CtrlSelect }
})
export default class ActorOtherStatusSelect extends Mixins<SelectMixin>(
  SelectMixin
) {
  @Prop({ type: Object, required: true })
  private actor!: any;

  @Prop({ type: String, required: true })
  private statusName!: any;

  @Prop({ type: Boolean, default: false })
  private disabled!: boolean;

  private get useStatusList(): any[] {
    return this.actor.statusList.filter(
      (status: any) => !status.standImage.ref && status.name !== this.statusName
    );
  }

  private get optionInfoList(): any[] {
    const resultList = this.useStatusList.map(status => ({
      key: status.name,
      value: status.name,
      text: status.name,
      disabled: false
    }));
    resultList.unshift({
      key: null,
      value: "",
      text: "個別設定",
      disabled: false
    });
    return resultList;
  }
}
</script>
