<template>
  <tr class="tr-scene-layer-select-component">
    <th class="label-input">
      <label :for="key" v-t="`label.${labelName}`"></label>
    </th>
    <td>
      <scene-layer-select
        :key="key"
        v-model="localValue"
        :id="`${key}-layer`"
      />
    </td>
  </tr>
</template>

<script lang="ts">
import { Prop } from "vue-property-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Component, Mixins } from "vue-mixin-decorator";
import SceneLayerSelect from "@/app/basic/common/components/select/SceneLayerSelect.vue";

@Component({ components: { SceneLayerSelect } })
export default class TrSceneLayerSelectComponent extends Mixins<ComponentVue>(
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
.tr-scene-layer-select-component {
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
