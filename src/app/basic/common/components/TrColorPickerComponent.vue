<template>
  <tr class="tr-color-picker-component">
    <th>
      <label :for="key" class="label-input" v-t="`label.${labelName}`"></label>
    </th>
    <td>
      <color-picker-component
        :key="key"
        :id="key"
        :disabled="disabled"
        v-model="localValue"
        :use-alpha="useAlpha"
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
export default class TrColorPickerComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private labelName!: string;

  @Prop({ type: String, required: true })
  private value!: string;

  @Prop({ type: Boolean, default: true })
  private useAlpha!: boolean;

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
.tr-color-picker-component {
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
