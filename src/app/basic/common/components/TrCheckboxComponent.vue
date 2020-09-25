<template>
  <tr class="tr-check-box-component">
    <th class="label-input">
      <label
        :for="key"
        v-if="labelName"
        v-t="labelName"
        @click="localValue = !localValue"
      ></label>
      <label v-else :for="key" @click="localValue = !localValue">&nbsp;</label>
    </th>
    <td>
      <s-check
        :readonly="readonly"
        v-model="localValue"
        colorStyle="skyblue"
        c-icon="checkmark"
        :c-label="cLabel"
        n-icon=""
        :n-label="nLabel"
        :elmId="key"
      />
    </td>
  </tr>
</template>

<script lang="ts">
import { Prop } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";
import ComponentVue from "../../../core/window/ComponentVue";
import SCheck from "./SCheck.vue";

@Component({ components: { SCheck } })
export default class TrCheckboxComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private labelName!: string;

  @Prop({ type: String, required: true })
  private cLabel!: string;

  @Prop({ type: String, required: true })
  private nLabel!: string;

  @Prop({ type: Boolean, required: true })
  private value!: boolean;

  @Prop({ type: Boolean, default: false })
  private readonly!: boolean;

  private input(value: boolean) {
    this.$emit("input", value);
  }

  public get localValue(): boolean {
    return this.value;
  }
  public set localValue(value: boolean) {
    this.input(value);
  }
}
</script>

<style scoped lang="scss">
.tr-check-box-component {
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
