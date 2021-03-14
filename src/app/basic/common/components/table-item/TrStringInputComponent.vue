<template>
  <tr class="tr-string-input-component">
    <th class="label-input">
      <label :for="key" v-t="labelName"></label>
    </th>
    <td :colspan="colspan">
      <input
        v-if="!multiline"
        :id="key"
        class="text"
        type="text"
        :value="localValue"
        :disabled="disabled"
        @input="localValue = $event.target.value"
        :placeholder="placeholder"
        :list="list"
        ref="inputElm"
        @keydown.enter.stop
        @keyup.enter.stop
        @keydown.229.stop
        @keyup.229.stop
      />
      <textarea
        v-else
        :id="key"
        class="text"
        :value="localValue"
        :disabled="disabled"
        @input="localValue = $event.target.value"
        :placeholder="placeholder"
        :style="{ minHeight: minHeight }"
        ref="inputElm"
        @keydown.enter.stop
        @keyup.enter.stop
        @keydown.229.stop
        @keyup.229.stop
      />
    </td>
  </tr>
</template>

<script lang="ts">
import { Prop } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import ComponentVue from "@/app/core/window/ComponentVue";

@Component
export default class TrStringInputComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private labelName!: string;

  @Prop({ type: String, required: true })
  private value!: string;

  @Prop({ type: Boolean, default: false })
  private disabled!: boolean;

  @Prop({ type: String, default: "" })
  private inputWidth!: string;

  @Prop({ type: String, default: "" })
  private placeholder!: string;

  @Prop({ type: String, default: undefined })
  private list!: string | undefined;

  @Prop({ type: Number, default: 1 })
  private colspan!: number;

  @Prop({ type: Boolean, default: false })
  private multiline!: boolean;

  @Prop({ type: String, default: "2em" })
  private minHeight!: string;

  @LifeCycle
  private mounted() {
    if (this.inputWidth) {
      const inputElm = this.$refs.inputElm as HTMLInputElement;
      inputElm.style.width = this.inputWidth;
    }
  }

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

.text {
  width: 100%;
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

input {
  font-size: inherit;
  height: 2em;
  box-sizing: border-box;
  margin: 0;

  &:read-only {
    outline: none;
  }

  &:disabled {
    background-color: lightgray;
  }
}

textarea {
  resize: vertical;
}
</style>
