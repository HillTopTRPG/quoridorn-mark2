<template>
  <tr class="number-input-tr-component">
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
        :max="max"
        :step="step"
        ref="inputElm"
      />
      <span v-if="unitLabel" v-t="`label.${unitLabel}`"></span>
    </td>
  </tr>
</template>

<script lang="ts">
import { Prop } from "vue-property-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Component, Mixins } from "vue-mixin-decorator";
import BaseInput from "@/app/core/component/BaseInput.vue";

@Component({
  components: {
    BaseInput
  }
})
export default class NumberInputTrComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private labelName!: string;

  @Prop({ type: Number })
  private step: number | undefined;

  @Prop({ type: Number })
  private min: number | undefined;

  @Prop({ type: Number })
  private max: number | undefined;

  @Prop({ type: Number, required: true })
  private value!: number;

  @Prop({ type: Boolean, default: false })
  private disabled!: boolean;

  @Prop({ type: String, default: "" })
  private inputWidth!: string;

  @Prop({ type: String, default: "" })
  private unitLabel!: string;

  private mounted() {
    if (this.inputWidth) {
      const inputElm = this.$refs.inputElm as BaseInput;
      inputElm.elm.style.width = this.inputWidth;
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
.color-picker-tr-component {
  display: contents;
}
th,
td {
  padding: 0;
}

th {
  text-align: right;
  width: 1px;
  white-space: nowrap;
}

tr {
  display: contents;
}
</style>
