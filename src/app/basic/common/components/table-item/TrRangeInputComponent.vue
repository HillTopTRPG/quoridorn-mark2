<template>
  <tr class="tr-range-input-component">
    <th class="label-input">
      <label :for="key" v-t="labelName"></label>
    </th>
    <td>
      <input
        :id="key"
        type="range"
        class="input"
        :value="localValue"
        :disabled="disabled"
        @input="localValue = $event.target.valueAsNumber"
        :min="min"
        :max="max"
        :step="step"
        ref="inputElm"
        @keydown.enter.stop
        @keyup.enter.stop
        @keydown.229.stop
        @keyup.229.stop
      />
      <span>({{ localValue }})</span>
    </td>
  </tr>
</template>

<script lang="ts">
import { Prop } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import LifeCycle from "@/app/core/decorator/LifeCycle";

@Component
export default class TrRangeInputComponent extends Mixins<ComponentVue>(
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

  @LifeCycle
  private mounted() {
    if (this.inputWidth) {
      const inputElm = this.$refs.inputElm as HTMLInputElement;
      inputElm.style.width = this.inputWidth;
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
.tr-color-picker-component {
  display: contents;
}
th,
td {
  padding: 0;
  height: 2em;
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

td {
  > * {
    display: inline;
    vertical-align: middle;
  }
}

tr {
  display: contents;
}

input {
  margin: 0;

  &:read-only {
    outline: none;
  }

  &:disabled {
    background-color: lightgray;
  }
}
</style>
