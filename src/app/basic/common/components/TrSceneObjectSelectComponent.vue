<template>
  <tr class="tr-scene-object-select-component">
    <th class="label-input">
      <label v-t="`label.${labelName}`"></label>
    </th>
    <td>
      <scene-object-select
        :actorId="actorId"
        v-model="localValue"
        :nullable="nullable"
        :multiple="false"
        :readonly="readonly"
      />
    </td>
  </tr>
</template>

<script lang="ts">
import { Prop } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";
import ComponentVue from "../../../core/window/ComponentVue";
import SceneObjectSelect from "./select/SceneObjectSelect.vue";

@Component({ components: { SceneObjectSelect } })
export default class TrSceneObjectSelectComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private labelName!: string;

  @Prop({ type: String, default: null })
  private value!: string;

  @Prop({ type: Boolean, default: false })
  private readonly!: boolean;

  @Prop({ type: String, default: null })
  private actorId!: string;

  @Prop({ type: Boolean, default: false })
  private nullable!: boolean;

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
.tr-scene-object-select-component {
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
