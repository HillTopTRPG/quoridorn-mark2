<template>
  <div class="chat-log-like-view-component" @click.stop="onClickContainer">
    <div class="char">{{ like.data.char }}</div>
    <template v-if="isOpen">
      <div
        class="user"
        v-for="actorCount in actorCountList"
        :key="actorCount.actorId"
      >
        <span>{{ getName(actorCount.actorId) }}: {{ actorCount.count }}</span>
        <span
          class="like-minus"
          @click.stop="onClickMinus(actorCount.actorId)"
          >{{ like.data.char }}</span
        >
      </div>
    </template>
    <div class="count" v-else>{{ charCount }}</div>
  </div>
</template>

<script lang="ts">
import { Prop } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import VueEvent from "@/app/core/decorator/VueEvent";
import { UserData } from "@/@types/room";
import { StoreUseData } from "@/@types/store";
import { ActorStore, LikeStore } from "@/@types/gameObject";

@Component
export default class ChatLogLikeViewComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private like!: StoreUseData<LikeStore>;

  @Prop({ type: Boolean, required: true })
  private isOpen!: boolean;

  @Prop({ type: Array, required: true })
  private actorCountList!: { actorId: string; count: number }[];

  @Prop({ type: Array, required: true })
  private actorList!: StoreUseData<ActorStore>[];

  @VueEvent
  private get charCount() {
    return this.actorCountList.reduce((prev, curr) => prev + curr.count, 0);
  }

  private getName(actorId: string): string {
    const actor = this.actorList.find(u => u.id === actorId);
    return actor ? actor.data!.name : "???";
  }

  @VueEvent
  private onClickContainer() {
    this.$emit("select", this.isOpen ? null : this.like);
  }

  @VueEvent
  private onClickMinus(actorId: string) {
    this.$emit("minus", actorId, this.like);
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.chat-log-like-view-component {
  @include flex-box(row, flex-start, center);
  margin-left: 0.5em;
  user-select: none;
  cursor: pointer;

  .char {
    &:after {
      content: ":";
    }
  }

  .user {
    @include flex-box(row, flex-start, center);
    margin-left: 0.2em;

    .like-minus {
      @include flex-box(row, flex-start, center);
      height: 1.8em;
      border: gray solid 1px;
      border-radius: 0.2rem;
      cursor: pointer;
      padding: 0 0.2rem;

      &:before {
        content: "-";
      }
    }
  }
}
</style>
