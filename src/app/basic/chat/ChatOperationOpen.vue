<template>
  <s-button :icon="icon" @hover="onHover" @click="onClick" />
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import ComponentVue from "../../core/window/ComponentVue";
import SButton from "../common/components/SButton.vue";
import VueEvent from "../../core/decorator/VueEvent";
import App from "../../../views/App.vue";

@Component({ components: { SButton } })
export default class ChatOperationOpen extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private icon!: string;
  @Prop({ type: String, required: true })
  private target!: string;

  @VueEvent
  private onHover(flg: boolean) {
    this.$emit("hover", flg ? this.$t(`${this.target}.window-title`) : "");
  }

  @VueEvent
  private async onClick() {
    await App.openSimpleWindow(this.target);
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";
</style>
