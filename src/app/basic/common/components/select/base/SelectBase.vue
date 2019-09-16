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
    >
      {{ defaultLabel }}
    </option>
    <slot />
  </ctrl-select>
</template>

<script lang="ts">
import SelectMixin from "./SelectMixin";
import CtrlSelect from "@/components/parts/CtrlSelect.vue";

import { Prop, Watch } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";

@Component({ components: { CtrlSelect } })
export default class SelectBase extends Mixins<SelectMixin>(SelectMixin) {
  @Prop({ type: Boolean, default: false })
  private disabled!: boolean;

  @Prop({ type: Array, required: true })
  private optionInfoList!: any[];
}
</script>
