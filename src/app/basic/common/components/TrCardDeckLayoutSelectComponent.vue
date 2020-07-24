<template>
  <tr class="tr-card-deck-layout-select-component">
    <th class="label-input">
      <label :for="key" v-t="`label.${labelName}`"></label>
    </th>
    <td>
      <card-deck-layout-select
        :key="key"
        v-model="localValue"
        :id="`${key}-layer`"
      />
    </td>
  </tr>
</template>

<script lang="ts">
import { Prop } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";
import ComponentVue from "../../../core/window/ComponentVue";
import CardDeckLayoutSelect from "./select/CardDeckLayoutSelect.vue";

@Component({ components: { CardDeckLayoutSelect } })
export default class TrCardDeckLayoutSelectComponent extends Mixins<
  ComponentVue
>(ComponentVue) {
  @Prop({ type: String, required: true })
  private labelName!: string;

  @Prop({ type: String, required: true })
  private value!: string;

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
.tr-card-deck-layout-select-component {
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
