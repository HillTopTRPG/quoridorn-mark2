<template>
  <tr class="tr-actor-select-component">
    <th class="label-input">
      <label v-t="`label.${labelName}`"></label>
    </th>
    <td>
      <actor-select
        v-model="localValue"
        :nullable="nullable"
        :multiple="false"
        :readonly="readonly"
      />
    </td>
  </tr>
</template>

<script lang="ts">
import { Prop } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";
import ActorStatusSelect from "./select/ActorStatusSelect.vue";
import ComponentVue from "../../../core/window/ComponentVue";
import ActorSelect from "./select/ActorSelect.vue";

@Component({ components: { ActorSelect, ActorStatusSelect } })
export default class TrActorSelectComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private labelName!: string;

  @Prop({ type: String, default: null })
  private value!: string | null;

  @Prop({ type: Boolean, default: false })
  private readonly!: boolean;

  @Prop({ type: Boolean, default: false })
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
.tr-actor-select-component {
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
