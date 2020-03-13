<template>
  <tr class="tr-chat-color-type-radio-component">
    <th>
      <label :for="key" class="label-input" v-t="`label.${labelName}`"></label>
    </th>
    <td>
      <chat-color-type-radio v-model="localValue" />
    </td>
  </tr>
</template>

<script lang="ts">
import { Prop } from "vue-property-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Component, Mixins } from "vue-mixin-decorator";
import ChatColorTypeRadio from "@/app/basic/common/components/radio/ChatColorTypeRadio.vue";

@Component({ components: { ChatColorTypeRadio } })
export default class TrChatColorTypeRadioComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
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
.tr-chat-color-type-radio-component {
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
