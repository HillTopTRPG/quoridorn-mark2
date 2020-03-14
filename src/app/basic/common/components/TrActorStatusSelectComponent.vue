<template>
  <tr class="tr-check-box-component">
    <th class="label-input">
      <label v-t="`label.${labelName}`"></label>
    </th>
    <td>
      <actor-status-select
        :actorId="actorId"
        v-model="localValue"
        :readonly="readonly"
      />
    </td>
  </tr>
</template>

<script lang="ts">
import { Prop } from "vue-property-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Component, Mixins } from "vue-mixin-decorator";
import ChatColorTypeSelect from "@/app/basic/common/components/select/ChatColorTypeSelect.vue";
import SCheck from "@/app/basic/common/components/SCheck.vue";
import ActorStatusSelect from "@/app/basic/common/components/select/ActorStatusSelect.vue";

@Component({ components: { ActorStatusSelect, SCheck, ChatColorTypeSelect } })
export default class TrActorStatusSelectComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private labelName!: string;

  @Prop({ type: String, required: true })
  private actorId!: string;

  @Prop({ type: String, required: true })
  private value!: string;

  @Prop({ type: Boolean, default: false })
  private readonly!: boolean;

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
