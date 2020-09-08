<template>
  <div class="item" @click="itemOnClick" @mouseenter="mouseEnter">
    <span class="check"><i v-show="propValue" class="icon-checkmark"></i></span>
    <span><slot /></span>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop } from "vue-property-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";

@Component
export default class MenuBooleanItem extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private property!: string;

  @Emit("click")
  private itemOnClick() {}

  private mouseEnter(event: any) {
    this.$emit("mouseenter", event);
  }

  private get propValue() {
    return false;
  }
}
</script>

<style scoped lang="scss">
.item {
  position: relative;
  white-space: nowrap;

  > * {
    display: inline;
    vertical-align: middle;
  }

  .check {
    width: 10px;
    height: 10px;
    min-width: 10px;
    min-height: 10px;
    margin-right: 5px;
    border: none;
    display: inline-flex;
    justify-content: center;
    align-items: center;
  }
}
</style>
