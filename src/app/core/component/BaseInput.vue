<template>
  <component
    v-bind:is="'input'"
    v-bind="$attrs"
    v-on="listeners"
    @keydown.enter.stop
    @keyup.enter.stop
    @keydown.229.stop
    @keyup.229.stop
  ></component>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component({ inheritAttrs: false })
export default class BaseInput extends Vue {
  private get listeners() {
    return {
      ...this.$listeners
    };
  }
}
</script>

<style scoped>
input {
  font-size: inherit;
  height: 2em;
  box-sizing: border-box;
}
</style>
