<template>
  <tr class="tr-media-tag-select-component">
    <th class="label-input">
      <label :for="key" v-t="labelName"></label>
    </th>
    <td>
      <media-tag-select
        :elmId="key"
        v-model="localValue"
        label="label.tag"
        :filter-list="filterList"
      />
      <span class="select-text">{{ selectedInfoText }}</span>
    </td>
  </tr>
</template>

<script lang="ts">
import { Prop } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";
import ComponentVue from "../../../core/window/ComponentVue";
import MediaTagSelect from "@/app/basic/common/components/select/MediaTagSelect.vue";
import { UrlType } from "@/@types/store-data-optional";

@Component({ components: { MediaTagSelect } })
export default class TrMediaTagSelectComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private labelName!: string;

  @Prop({ type: String, default: null })
  private value!: string | null;

  @Prop({ type: String, required: true })
  private selectedInfoText!: string;

  @Prop({ type: Array, required: true })
  private filterList!: UrlType[];

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
.tr-media-tag-select-component {
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

.select-text {
  margin-left: 0.5rem;
}
</style>
