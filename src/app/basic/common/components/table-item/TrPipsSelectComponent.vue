<template>
  <tr class="tr-pips-select-component">
    <th class="label-input">
      <label :for="key" v-t="labelName"></label>
    </th>
    <td>
      <pips-select
        v-model="localValue"
        :diceTypeKey="diceTypeKey"
        :multiple="false"
        :readonly="readonly"
        :elmId="key"
      />
    </td>
  </tr>
</template>

<script lang="ts">
import { Prop } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";
import PipsSelect from "@/app/basic/common/components/select/PipsSelect.vue";
import ComponentVue from "@/app/core/window/ComponentVue";

@Component({ components: { PipsSelect } })
export default class TrPipsSelectComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private labelName!: string;

  @Prop({ type: String, required: true })
  private diceTypeKey!: string;

  @Prop({ type: String, default: null })
  private value!: string | null;

  @Prop({ type: Boolean, default: false })
  private readonly!: boolean;

  private input(value: string | null) {
    this.$emit("input", value);
  }

  public get localValue(): string | null {
    return this.value;
  }
  public set localValue(value: string | null) {
    this.input(value);
  }
}
</script>

<style scoped lang="scss">
.tr-pips-component {
  display: contents;
}
th,
td {
  padding: 0;
}

th {
  text-align: left;
  width: 1px;
  white-space: nowrap;

  :first-child {
    display: inline-block;
    width: calc(100% - 1em);
  }
}

tr {
  display: contents;
}
</style>
