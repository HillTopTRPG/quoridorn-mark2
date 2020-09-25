<template>
  <tr class="tr-range-component">
    <th class="label-input">
      <label :for="key" v-t="labelName"></label>
    </th>
    <td>
      <range-component
        tag="td"
        :readonly="readonly"
        :min="min"
        :max="max"
        :step="step"
        v-model="localValue"
        :elmId="key"
      />
    </td>
  </tr>
</template>

<script lang="ts">
import { Prop } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";
import ComponentVue from "../../../core/window/ComponentVue";
import RangeComponent from "./RangeComponent.vue";

@Component({ components: { RangeComponent } })
export default class TrRangeComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private labelName!: string;

  @Prop({ type: Number, default: 3 })
  private rawWidth!: number;

  @Prop({ type: Number, default: 10 })
  private sliderWidth!: number;

  @Prop({ type: Number, default: null })
  private min!: number | null;

  @Prop({ type: Number, default: 1 })
  private step!: number;

  @Prop({ type: Number, default: null })
  private max!: number | null;

  @Prop({ type: Number, required: true })
  private value!: number;

  @Prop({ type: Boolean, default: false })
  private readonly!: boolean;

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
.tr-range-component {
  display: contents;
}

input {
  height: 2em;
  margin: 0;
  font-size: inherit;
  vertical-align: middle;
  box-sizing: border-box;
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
