<template>
  <tr class="tr-check-box-component">
    <th>
      <label
        class="label-input"
        v-t="`label.${labelName}`"
        @click="localValue = !localValue"
      ></label>
    </th>
    <td>
      <s-check
        :id="key"
        v-model="localValue"
        colorStyle="skyblue"
        c-icon="checkmark"
        :c-label="cLabel"
        n-icon=""
        :n-label="nLabel"
      />
    </td>
  </tr>
</template>

<script lang="ts">
import { Prop } from "vue-property-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Component, Mixins } from "vue-mixin-decorator";
import ChatColorTypeRadio from "@/app/basic/common/components/radio/ChatColorTypeRadio.vue";
import SCheck from "@/app/basic/common/components/SCheck.vue";

@Component({ components: { SCheck, ChatColorTypeRadio } })
export default class TrCheckboxComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private labelName!: string;

  @Prop({ type: String, required: true })
  private cLabel!: string;

  @Prop({ type: String, required: true })
  private nLabel!: string;

  @Prop({ type: Boolean, required: true })
  private value!: boolean;

  private input(value: boolean) {
    this.$emit("input", value);
  }

  public get localValue(): boolean {
    return this.value;
  }
  public set localValue(value: boolean) {
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
  text-align: right;
  width: 1px;
  white-space: nowrap;
}

tr {
  display: contents;
}
</style>
