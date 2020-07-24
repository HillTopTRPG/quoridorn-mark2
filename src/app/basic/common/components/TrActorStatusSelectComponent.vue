<template>
  <tr class="tr-actor-status-select-component">
    <th class="label-input">
      <label v-t="`label.${labelName}`"></label>
    </th>
    <td>
      <actor-status-select
        :actorId="actorId"
        v-model="localValue"
        :nullable="nullable"
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

@Component({ components: { ActorStatusSelect } })
export default class TrActorStatusSelectComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private labelName!: string;

  @Prop({ type: String, default: null })
  private actorId!: string | null;

  @Prop({ type: String, default: null })
  private value!: string;

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
.tr-actor-status-select-component {
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
