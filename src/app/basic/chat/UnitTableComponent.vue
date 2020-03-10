<template>
  <div class="unit-table" @contextmenu.prevent>
    <table>
      <tr v-for="unit in unitList" :key="unit.unit">
        <th>{{ unit.name }}</th>
        <th>({{ unit.unit }})</th>
        <td>{{ unit.value }}</td>
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";

@Component
export default class UnitTableComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Array, required: true })
  private unitList!: { value: number; name: string; unit: string }[];
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.unit-table {
  padding: 0.5em;
  background-color: lightgreen;
  position: absolute;
  bottom: 100%;
  left: 0;
  cursor: default;
  z-index: 1000;
  max-height: 26em;
  overflow-y: auto;

  table {
    padding: 0;
    margin: 0;
    border-collapse: collapse;
  }

  tr:first-child {
    th,
    td {
      border-top-color: transparent;
    }
  }

  th,
  td {
    padding: 0;
    line-height: 2em;
    text-align: left;
    vertical-align: center;
    border-top: dashed 1px black;
  }
}
</style>
