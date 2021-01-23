<template>
  <tr class="tr-edge-type-select-component">
    <th class="label-input">
      <label :for="key" v-t="labelName"></label>
    </th>
    <td>
      <edge-type-select :key="key" v-model="localValue" :elmId="key" />
    </td>
  </tr>
</template>

<script lang="ts">
import { Prop } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";
import EdgeTypeSelect from "@/app/basic/common/components/select/EdgeTypeSelect.vue";
import ComponentVue from "@/app/core/window/ComponentVue";

@Component({ components: { EdgeTypeSelect } })
export default class TrDirectionTypeSelectComponent extends Mixins<
  ComponentVue
>(ComponentVue) {
  @Prop({ type: String, required: true })
  private labelName!: string;

  @Prop({ type: String, required: true })
  private value!: "none" | "width" | "height";

  private input(value: "none" | "width" | "height") {
    this.$emit("input", value);
  }

  public get localValue(): "none" | "width" | "height" {
    return this.value;
  }
  public set localValue(value: "none" | "width" | "height") {
    this.input(value);
  }
}
</script>

<style scoped lang="scss">
.tr-direction-type-select-component {
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
