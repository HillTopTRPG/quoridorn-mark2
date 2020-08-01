<template>
  <component
    class="input"
    v-bind:is="'input'"
    v-bind="$attrs"
    v-on="listeners"
    @keydown.enter.prevent.stop
    @keyup.enter.prevent.stop
    @keydown.229.prevent.stop
    @keyup.229.prevent.stop
    ref="component"
  ></component>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import VueEvent from "../decorator/VueEvent";

@Component({ inheritAttrs: false })
export default class BaseInput extends Vue {
  @VueEvent
  private get listeners() {
    return {
      ...this.$listeners
    };
  }

  public get elm(): HTMLInputElement {
    return this.$refs.component as HTMLInputElement;
  }

  public focus() {
    this.elm.focus();
  }

  public get value() {
    return this.elm.value;
  }

  @VueEvent
  public blur() {
    console.log("blur");
    this.elm.blur();
  }

  public getBoundingClientRect(): ClientRect | DOMRect {
    return this.elm.getBoundingClientRect();
  }
}
</script>

<style scoped lang="scss">
input {
  font-size: inherit;
  height: 2em;
  box-sizing: border-box;

  &:read-only {
    outline: none;
  }

  &:disabled {
    background-color: lightgray;
  }
}
</style>
