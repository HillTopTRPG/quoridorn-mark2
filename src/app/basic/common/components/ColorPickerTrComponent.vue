<template>
  <tr>
    <th>
      <label :for="key" class="label-input" v-t="`label.${labelName}`"></label>
    </th>
    <td>
      <color-picker-component
        :key="key"
        :id="key"
        v-model="localValue"
        :use-alpha="true"
      />
    </td>
  </tr>
</template>

<script lang="ts">
import { Prop } from "vue-property-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Component, Mixins } from "vue-mixin-decorator";
import ColorPickerComponent from "@/app/core/component/ColorPickerComponent.vue";

@Component({ components: { ColorPickerComponent } })
export default class StringInputTrComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private labelName!: string;

  @Prop({ type: String, required: true })
  private value!: string;

  @Prop({ type: Boolean, default: false })
  private disabled!: boolean;

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
@import "../../../../assets/common";
th {
  text-align: right;
}
tr {
  display: contents;
}
</style>
