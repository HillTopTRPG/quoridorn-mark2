<template>
  <div class="info-box">
    <div
      class="item"
      :class="{ default: isDefaultTab }"
      @mouseenter="onHover('outputTab', true)"
      @mouseleave="onHover('outputTab', false)"
    >
      # {{ outputTabName }}
    </div>
    <div
      class="item"
      @mouseenter="onHover('sender', true)"
      @mouseleave="onHover('sender', false)"
    >
      ! {{ sender }}
    </div>
    <div
      class="item"
      :class="targetType"
      @mouseenter="onHover('target', true)"
      @mouseleave="onHover('target', false)"
    >
      &gt; {{ targetName }}
    </div>
    <div
      class="item"
      :class="{ default: !isSecret }"
      @mouseenter="onHover('secret', true)"
      @mouseleave="onHover('secret', false)"
    >
      ? {{ $t(secretTarget) }}
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import ComponentVue from "../../core/window/ComponentVue";
import LanguageManager from "../../../LanguageManager";
import { WindowInfo } from "../../../@types/window";
import VueEvent from "../../core/decorator/VueEvent";

@Component
export default class ChatInputInfoComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private windowInfo!: WindowInfo<any>;

  @Prop({ type: String, required: true })
  private sender!: string;

  @Prop({ type: String, required: true })
  private targetType!: string;

  @Prop({ type: String, required: true })
  private targetName!: string;

  @Prop({ type: Boolean, required: true })
  private isDefaultTab!: boolean;

  @Prop({ type: String, required: true })
  private outputTabName!: string;

  @Prop({ type: Boolean, required: true })
  private isSecret!: boolean;

  @VueEvent
  private onHover(type: string, flg: boolean) {
    const base = "chat-window.input-info.message-";
    this.windowInfo.message = flg
      ? LanguageManager.instance.getText(base + type)
      : "";
  }

  private get secretTarget(): string {
    return "chat-window.input-info." + (this.isSecret ? "" : "non-") + "secret";
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.info-box {
  @include inline-flex-box(column, stretch, flex-start);
  border-right: 1px dashed gray;
}

.item {
  @include inline-flex-box(column, flex-start, center);
  flex: 1;
  font-weight: bold;
  font-size: 80%;
  padding: 0 0.2rem;

  &.default {
    color: darkgray;
    font-weight: normal;
  }

  &:hover {
    background-color: var(--uni-color-cream);
  }

  &.direct {
    background-color: var(--uni-color-beige);
  }
}
</style>
