<template>
  <tr class="tr-chat-color-input-component">
    <th class="label-input">
      <label v-t="`label.${labelName}`"></label>
    </th>
    <td>
      <div class="wrap">
        <chat-color-type-select v-model="typeVolatile" :readonly="readonly" />
        <color-picker-component
          :key="key"
          :disabled="disabled"
          :readonly="readonly"
          v-model="colorVolatile"
          :use-alpha="false"
        />
      </div>
    </td>
  </tr>
</template>

<script lang="ts">
import { Prop, Watch } from "vue-property-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Component, Mixins } from "vue-mixin-decorator";
import ChatColorTypeSelect from "@/app/basic/common/components/select/ChatColorTypeSelect.vue";
import ColorPickerComponent from "@/app/core/component/ColorPickerComponent.vue";

@Component({ components: { ColorPickerComponent, ChatColorTypeSelect } })
export default class TrChatColorInputComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private labelName!: string;

  @Prop({ type: Boolean, default: false })
  private disabled!: boolean;

  @Prop({ type: Boolean, default: false })
  private readonly!: boolean;

  // type
  @Prop({ type: String, required: true })
  private type!: string;
  private typeVolatile: string = "owner";
  @Watch("type", { immediate: true })
  private onChangeType(value: string) {
    this.typeVolatile = value;
  }
  @Watch("typeVolatile")
  private onChangeTypeVolatile(value: string) {
    this.$emit("update:type", value);
  }

  // color
  @Prop({ type: String, required: true })
  private color!: string;
  private colorVolatile: string = "#000000";
  @Watch("color", { immediate: true })
  private onChangeColor(value: string) {
    this.colorVolatile = value;
  }
  @Watch("colorVolatile")
  private onChangeColorVolatile(value: string) {
    this.$emit("update:color", value);
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.tr-chat-color-input-component {
  display: contents;
}

.wrap {
  @include inline-flex-box(row, flex-start, center, wrap);
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
