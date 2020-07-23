<template>
  <ctrl-select
    v-model="localValue"
    ref="select"
    :test="test"
    :disabled="disabled"
    :optionInfoList="optionInfoList"
  >
    <option
      :disabled="!defaultSelectable"
      value=""
      v-if="defaultLabel !== undefined"
      v-t="defaultLabel"
    ></option>
    <slot />
  </ctrl-select>
</template>

<script lang="ts">
import SelectMixin from "./SelectMixin";

import { Prop } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";
import CtrlSelect from "../../../../../core/component/CtrlSelect.vue";

@Component({ components: { CtrlSelect } })
export default class SelectBase extends Mixins<SelectMixin>(SelectMixin) {
  @Prop({ type: Array, required: true })
  private optionInfoList!: any[];
}
</script>
