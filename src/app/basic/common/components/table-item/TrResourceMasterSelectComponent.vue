<template>
  <tr class="tr-resource-master-select-component">
    <th class="label-input">
      <label :for="key" v-t="labelName"></label>
    </th>
    <td>
      <resource-master-select
        v-model="localValue"
        :filter="filter"
        :nullable="nullable"
        :multiple="false"
        :readonly="readonly"
        :elmId="key"
      />
    </td>
  </tr>
</template>

<script lang="ts">
import { Prop } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import ActorSelect from "@/app/basic/common/components/select/ActorSelect.vue";
import ResourceMasterSelect from "@/app/basic/common/components/select/ResourceMasterSelect.vue";
import { ResourceType } from "@/@types/store-data-optional";

@Component({ components: { ResourceMasterSelect, ActorSelect } })
export default class TrResourceMasterSelectComponent extends Mixins<
  ComponentVue
>(ComponentVue) {
  @Prop({ type: Array, default: [] })
  private filter!: ResourceType[];

  @Prop({ type: String, required: true })
  private labelName!: string;

  @Prop({ type: String, default: null })
  private value!: string | null;

  @Prop({ type: Boolean, default: false })
  private readonly!: boolean;

  @Prop({ type: Boolean, default: true })
  private nullable!: boolean;

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
.tr-resource-master-select-component {
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
