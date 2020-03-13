<template>
  <tr class="tr-chat-color-type-radio-component">
    <th>
      <label :for="key" class="label-input" v-t="`label.${labelName}`"></label>
    </th>
    <td>
      <input
        :id="key"
        type="number"
        class="raw-input"
        :min="min"
        :max="max"
        :step="step"
        :style="{ width: rawWidth + 'em' }"
        :value="localValue"
        @input="localValue = $event.target.valueAsNumber"
        @keydown.enter.prevent.stop
        @keyup.enter.prevent.stop
        @keydown.229.prevent.stop
        @keyup.229.prevent.stop
      />
      <input
        type="range"
        class="slider-input"
        :min="min"
        :max="max"
        :step="step"
        :style="{ width: sliderWidth + 'em' }"
        :value="localValue"
        @input="localValue = $event.target.valueAsNumber"
        @keydown.enter.prevent.stop
        @keyup.enter.prevent.stop
        @keydown.229.prevent.stop
        @keyup.229.prevent.stop
      />
    </td>
  </tr>
</template>

<script lang="ts">
import { Prop } from "vue-property-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Component, Mixins } from "vue-mixin-decorator";
import ChatColorTypeRadio from "@/app/basic/common/components/radio/ChatColorTypeRadio.vue";

@Component({ components: { ChatColorTypeRadio } })
export default class TrRangeComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private labelName!: string;

  @Prop({ type: Number, default: 3 })
  private rawWidth!: number;

  @Prop({ type: Number, default: 10 })
  private sliderWidth!: number;

  @Prop({ type: Number, default: null })
  private min!: number | null;

  @Prop({ type: Number, default: 1 })
  private step!: number;

  @Prop({ type: Number, default: null })
  private max!: number | null;

  @Prop({ type: Number, required: true })
  private value!: number;

  private input(value: number) {
    this.$emit("input", value);
  }

  public get localValue(): number {
    return this.value;
  }
  public set localValue(value: number) {
    this.input(value);
  }
}
</script>

<style scoped lang="scss">
.tr-chat-color-type-radio-component {
  display: contents;
}

input {
  height: 2em;
  margin: 0;
  font-size: inherit;
  vertical-align: middle;
  box-sizing: border-box;
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
