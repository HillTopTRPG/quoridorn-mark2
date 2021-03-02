<template>
  <table class="authority-group-legend">
    <caption v-t="'label.legend'"></caption>
    <tbody>
      <tr class="user">
        <th class="name" colspan="2" v-t="'type.user'"></th>
      </tr>
      <tr class="actor">
        <th class="empty"></th>
        <th class="name" v-t="'type.actor'"></th>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";

@Component
export default class AuthorityGroupLegend extends Mixins<ComponentVue>(
  ComponentVue
) {}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

table {
  border-left: 1px solid gray;
  margin-left: 1em;

  th {
    border-style: solid;
    border-color: gray;
  }

  tbody {
    th {
      border-width: 1px 1px 0 1px;
    }

    tr {
      &.user {
        th {
          background-color: var(--uni-color-cream);
        }
      }
      &.actor {
        th {
          background-color: var(--uni-color-white);
        }
      }

      &:last-child {
        th,
        td {
          border-bottom-width: 1px;
        }
      }
    }

    .empty {
      background-color: var(--uni-color-cream) !important;
      width: 1em;
      min-width: 1em;
      border-width: 0 1px;
    }
  }
}
</style>
