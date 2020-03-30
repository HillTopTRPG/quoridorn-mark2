<template>
  <div class="sub-container">
    <s-button
      class="move-btn"
      icon="arrow-up"
      @click="$emit('back')"
      v-if="!isFirst"
    />
    <div class="message">
      <div class="text">{{ msgText }}</div>
    </div>
    <div class="contents">
      <slot />
    </div>
    <s-button
      class="move-btn"
      :icon="isLast ? 'arrow-right' : 'arrow-down'"
      :disabled="nextDisabled"
      @click="$emit('next')"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import { Prop } from "vue-property-decorator";
import SButton from "@/app/basic/common/components/SButton.vue";
import ComponentVue from "@/app/core/window/ComponentVue";
import VueEvent from "@/app/core/decorator/VueEvent";

@Component({ components: { SButton } })
export default class CardDeckSubContainerComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private message!: string;

  @Prop({ type: Object, default: undefined })
  private messageArg!: any;

  @Prop({ type: Boolean, default: false })
  private isFirst!: boolean;

  @Prop({ type: Boolean, default: false })
  private isLast!: boolean;

  @Prop({ type: Boolean, default: false })
  private nextDisabled!: boolean;

  @VueEvent
  private get msgText() {
    return this.$t(
      `card-deck-builder.message-list.${this.message}`,
      this.messageArg
    );
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.sub-container {
  @include flex-box(column, stretch, flex-start);
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}

.message {
  @include flex-box(row, center, center);
  background-color: var(--uni-color-orange);
  font-size: 120%;
  font-weight: bold;
  margin: 0 1rem 1rem;
  padding: 0.3rem;

  .text {
    white-space: pre-wrap;
    text-align: left;
  }
}

.contents {
  @include flex-box(column, center, center);
  flex: 1;
  overflow: hidden;
}

.move-btn {
  align-self: center;
  font-size: 2em;
  margin: 0.2rem;
}
</style>
