<template>
  <tr class="tr-string-input-component">
    <th class="label-input">
      <label :for="key" v-t="`label.${labelName}`"></label>
    </th>
    <td>
      <base-input
        :id="key"
        class="text"
        type="text"
        :value="localValue"
        :disabled="disabled"
        @input="localValue = $event.target.value"
        :placeholder="placeholder"
        :list="list"
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
export default class TrStringInputComponent extends Mixins<ComponentVue>(
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

  @Prop({ type: String, default: "" })
  private placeholder!: string;

  @Prop({ type: String, default: undefined })
  private list!: string | undefined;

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
.tr-color-picker-component {
  display: contents;
}

.text {
  width: 100%;
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
