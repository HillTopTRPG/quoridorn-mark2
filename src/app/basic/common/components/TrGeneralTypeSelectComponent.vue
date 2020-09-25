<template>
  <tr class="tr-general-type-select-component">
    <th class="label-input">
      <label :for="key" v-t="labelName"></label>
    </th>
    <td>
      <general-type-select
        v-model="localValue"
        :readonly="readonly"
        :elmId="key"
      />
    </td>
  </tr>
</template>

<script lang="ts">
import { Prop } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";
import ComponentVue from "../../../core/window/ComponentVue";
import { ResourceType } from "@/@types/gameObject";
import GeneralTypeSelect from "./select/GeneralTypeSelect.vue";

@Component({ components: { GeneralTypeSelect } })
export default class TrGeneralTypeSelectComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private labelName!: ResourceType;

  @Prop({ type: String, required: true })
  private value!: string;

  @Prop({ type: Boolean, default: false })
  private readonly!: boolean;

  @Prop({ type: String, required: true })
  private type!: string;

  @Prop({ type: Array, required: true })
  private valueList!: string[];

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
.tr-general-type-select-component {
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
