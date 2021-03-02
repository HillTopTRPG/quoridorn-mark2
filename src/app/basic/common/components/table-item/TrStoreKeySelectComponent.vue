<template>
  <tr class="tr-store-key-select-component">
    <th class="label-input">
      <label :for="key" v-t="`type.${type}`"></label>
    </th>
    <td :colspan="colspan">
      <store-key-select
        :elmId="key"
        v-model="localValue"
        :type="type"
        :label-property="labelProperty"
        :multiple="multiple"
        :nullable="nullable"
        :disabled="disabled"
      />
    </td>
  </tr>
</template>

<script lang="ts">
import { Prop } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import StoreKeySelect from "@/app/basic/common/components/select/StoreKeySelect.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";

@Component({ components: { StoreKeySelect } })
export default class TrStoreKeySelectComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, default: null })
  private value!: string | null;

  @Prop({ type: Boolean, default: false })
  protected multiple!: boolean;

  @Prop({ type: String, required: true })
  private type!: string;
  @Prop({ type: String, required: true })
  private labelProperty!: string;

  @Prop({ type: Boolean, default: false })
  private nullable!: boolean;

  @Prop({ type: Boolean, default: false })
  private disabled!: boolean;

  @Prop({ type: Number, default: 1 })
  private colspan!: number;

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
.tr-store-key-select-component {
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

.select-text {
  margin-left: 0.5rem;
}
</style>
