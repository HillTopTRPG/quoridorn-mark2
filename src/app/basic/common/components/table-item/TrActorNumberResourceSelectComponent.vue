<template>
  <tr class="tr-actor-number-resource-select-component">
    <th class="label-input">
      <label :for="key" v-t="labelName"></label>
    </th>
    <td>
      <actor-number-resource-select
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
import { ResourceType } from "@/@types/store-data-optional";
import ActorNumberResourceSelect from "@/app/basic/common/components/select/ActorNumberResourceSelect.vue";
import ComponentVue from "@/app/core/window/ComponentVue";

@Component({ components: { ActorNumberResourceSelect } })
export default class TrActorNumberResourceSelectComponent extends Mixins<
  ComponentVue
>(ComponentVue) {
  @Prop({ type: String, required: true })
  private labelName!: ResourceType;

  @Prop({ type: String, default: null })
  private value!: string;

  @Prop({ type: Boolean, default: false })
  private readonly!: boolean;

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
.tr-actor-number-resource-select-component {
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
