<template>
  <tr class="tr-selection-value-select-component">
    <th class="label-input">
      <label :for="key" v-t="labelName"></label>
    </th>
    <td>
      <selection-value-select
        v-model="localValue"
        :readonly="readonly"
        :selection="selection"
        :elmId="key"
      />
    </td>
  </tr>
</template>

<script lang="ts">
import { Prop } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";
import { ResourceType } from "@/@types/store-data-optional";
import ComponentVue from "@/app/core/window/ComponentVue";
import SelectionValueSelect from "@/app/basic/common/components/select/SelectionValueSelect.vue";

@Component({ components: { SelectionValueSelect } })
export default class TrSelectionValueSelectComponent extends Mixins<
  ComponentVue
>(ComponentVue) {
  @Prop({ type: String, required: true })
  private labelName!: ResourceType;

  @Prop({ type: String, required: true })
  private value!: string;

  @Prop({ type: Boolean, default: false })
  private readonly!: boolean;

  @Prop({ type: String, required: true })
  private selection!: string;

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
.tr-selection-value-select-component {
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
