<template>
  <tr class="tr-bcdice-system-input-component">
    <th class="label-input">
      <label :for="key" v-t="labelName"></label>
    </th>
    <td>
      <label>
        <bcdice-system-input
          v-model="localValue"
          :disabled="disabled"
          :url="urlVolatile"
          :bcdice-version.sync="bcdiceVersionVolatile"
          :window-info="windowInfo"
        />
      </label>
    </td>
  </tr>
</template>

<script lang="ts">
import { Prop, Watch } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import BcdiceSystemInput from "@/app/basic/common/components/BcdiceSystemInput.vue";
import { WindowInfo } from "@/@types/window";

@Component({ components: { BcdiceSystemInput } })
export default class TrBcdiceSystemInputComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private windowInfo!: WindowInfo<any>;

  @Prop({ type: String, required: true })
  private labelName!: string;

  @Prop({ type: String, default: null })
  private value!: string | null;

  @Prop({ type: Boolean, default: false })
  private disabled!: boolean;

  // bcdiceVersion
  @Prop({ type: String, required: true })
  private bcdiceVersion!: string;
  private bcdiceVersionVolatile: string = "";
  @Watch("bcdiceVersion", { immediate: true })
  private onChangeBcdiceVersion(value: string) {
    this.bcdiceVersionVolatile = value;
  }
  @Watch("bcdiceVersionVolatile")
  private async onChangeBcdiceVersionVolatile(value: string) {
    this.$emit("update:bcdiceVersion", value);
  }

  // url
  @Prop({ type: String, required: true })
  private url!: string;
  private urlVolatile: string = "";
  @Watch("url", { immediate: true })
  private onChangeUrl(value: string) {
    this.urlVolatile = value;
  }
  @Watch("urlVolatile")
  private async onChangeUrlVolatile(value: string) {
    this.$emit("update:url", value);
  }

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
@import "../../../../../assets/common";

.tr-bcdice-system-input-component {
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

label {
  @include flex-box(row, stretch, center);
  width: 100%;
}
</style>
