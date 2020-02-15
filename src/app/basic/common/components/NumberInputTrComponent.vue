<template>
  <tr>
    <th>
      <label :for="key" class="label-input" v-t="`label.${labelName}`"></label>
    </th>
    <td>
      <base-input
        :id="key"
        type="number"
        :value="localValue"
        :disabled="disabled"
        @input="localValue = $event.target.valueAsNumber"
        :min="min"
        ref="inputElm"
      />
    </td>
  </tr>
</template>

<script lang="ts">
import { Prop } from "vue-property-decorator";
import CtrlSelect from "@/app/core/component/CtrlSelect.vue";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Component, Mixins } from "vue-mixin-decorator";
import BaseInput from "@/app/core/component/BaseInput.vue";
import DiceBotSelect from "@/app/basic/common/components/select/DiceBotSelect.vue";

@Component({ components: { DiceBotSelect, BaseInput, CtrlSelect } })
export default class NumberInputTrComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private labelName!: string;

  @Prop({ type: Number })
  private min: number | undefined;

  @Prop({ type: Number, required: true })
  private value!: number;

  @Prop({ type: Boolean, default: false })
  private disabled!: boolean;

  @Prop({ type: Number, default: 0 })
  private widthEm!: number;

  private mounted() {
    const unitList = [];
    if (this.widthEm) unitList.push(`${this.widthEm}em`);
    if (unitList.length) {
      const elm = this.$refs.inputElm as BaseInput;
      elm.elm.style.width = `calc(${unitList.join(" + ")})`;
    }
  }

  private input(value: number) {
    this.$emit("input", value);
  }

  public get localValue(): number {
    return this.value;
  }
  public set localValue(value: number) {
    this.input(value);
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";
th {
  text-align: right;
}
tr {
  display: contents;
}
</style>
