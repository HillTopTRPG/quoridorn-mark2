<template>
  <tr class="string-input-tr-component">
    <th>
      <label :for="key" class="label-input" v-t="`label.${labelName}`"></label>
    </th>
    <td>
      <base-input
        :id="key"
        type="text"
        :value="localValue"
        :disabled="disabled"
        @input="localValue = $event.target.value"
        ref="inputElm"
      />
    </td>
  </tr>
</template>

<script lang="ts">
import { Prop } from "vue-property-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Component, Mixins } from "vue-mixin-decorator";
import BaseInput from "@/app/core/component/BaseInput.vue";

@Component({ components: { BaseInput } })
export default class StringInputTrComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private labelName!: string;

  @Prop({ type: String, required: true })
  private value!: string;

  @Prop({ type: Boolean, default: false })
  private disabled!: boolean;

  @Prop({ type: String, default: "" })
  private inputWidth!: string;

  private mounted() {
    if (this.inputWidth) {
      const inputElm = this.$refs.inputElm as BaseInput;
      inputElm.elm.style.width = this.inputWidth;
    }
  }

  private input(value: string) {
    this.$emit("input", value);
  }

  public get localValue(): string {
    return this.value;
  }
  public set localValue(value: string) {
    this.input(value);
  }
}
</script>

<style scoped lang="scss">
th,
td {
  padding: 0;
}

th {
  text-align: right;
}

tr {
  display: contents;
}
</style>
