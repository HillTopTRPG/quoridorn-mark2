<template>
  <div class="chat-log-like-add-component" @click.stop="onClick">
    {{ like.data.char }}
  </div>
</template>

<script lang="ts">
import { Prop } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import VueEvent from "@/app/core/decorator/VueEvent";
import { LikeStore } from "@/@types/gameObject";
import { StoreObj } from "@/@types/store";

@Component
export default class ChatLogLikeAddComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private like!: StoreObj<LikeStore>;

  @VueEvent
  private onClick() {
    this.$emit("add", this.like);
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.chat-log-like-add-component {
  @include flex-box(row, flex-start, center);
  height: 1.8em;
  border: gray 1px solid;
  border-radius: 0.2rem;
  padding: 0 0.2rem;
  margin-left: 0.5em;
  user-select: none;
  font-size: 90%;
  cursor: pointer;

  &:before {
    content: "+";
  }
}
</style>
