<template>
  <card-deck-sub-container-component
    message="input-deck-name"
    :isFirst="true"
    @next="$emit('next')"
    :nextDisabled="!nameVolatile"
  >
    <label>
      <span v-t="'label.card-deck-name'"></span>
      <base-input
        type="text"
        :value="nameVolatile"
        @input="nameVolatile = $event.target.value"
        :class="{ pending: !nameVolatile }"
        :placeholder="$t('label.card-deck-name-placeholder')"
      />
    </label>
  </card-deck-sub-container-component>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Prop, Watch } from "vue-property-decorator";
import BaseInput from "@/app/core/component/BaseInput.vue";
import CardDeckSubContainerComponent from "@/app/basic/card/CardDeckSubContainerComponent.vue";

@Component({ components: { CardDeckSubContainerComponent, BaseInput } })
export default class CardDeckInputNameComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  // name
  @Prop({ type: String, required: true })
  private name!: string;
  private nameVolatile: string = "";
  @Watch("name", { immediate: true })
  private onChangeName(value: string) {
    this.nameVolatile = value;
  }
  @Watch("nameVolatile")
  private onChangeNameVolatile(value: string) {
    this.$emit("update:name", value);
  }
}
</script>

<style scoped lang="scss"></style>
