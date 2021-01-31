<template>
  <label>
    <input
      type="checkbox"
      @click="onClickMetaOption($event.target.checked)"
      :checked="defaultValue"
    />
    <span :title="property">{{ property }}</span>
  </label>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Prop } from "vue-property-decorator";

@Component
export default class MetaPropertyCheck extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private property!: keyof StoreUseData<any>;
  @Prop({ type: Boolean, required: true })
  private defaultValue!: boolean;

  private onClickMetaOption(flg: boolean) {
    this.$emit("click", flg, this.property);
  }
}
</script>

<style scoped lang="scss">
label {
  position: relative;
  width: 6em;
  overflow-x: hidden;
  text-overflow: ellipsis;
  margin-right: 0.5rem;
}
</style>
