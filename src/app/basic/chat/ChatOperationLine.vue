<template>
  <div class="operation-line-container">
    <!-- アクター選択 -->
    <label>
      <span>{{ $t("label.name") }}</span>
      <self-actor-select v-model="actorKeyVolatile" />
    </label>

    <!-- ステータス選択 -->
    <label>
      <actor-status-select
        :actorKey="actorKeyVolatile"
        v-model="statusKeyVolatile"
      />
    </label>

    <chat-operation-open
      icon="user"
      target="actor-add-window"
      @hover="onHover"
    />
    <chat-operation-open
      icon="users"
      target="player-box-window"
      @hover="onHover"
    />

    <!-- ダイスボット選択 -->
    <bcdice-system-input
      v-model="systemVolatile"
      :url.sync="bcdiceUrlVolatile"
      :windowInfo="windowInfo"
      @onMouseEnterUrl="onMouseEnterUrl"
    />

    <!-- ショートカットボタン -->
    <chat-operation-open
      icon="tv"
      target="cut-in-list-window"
      @hover="onHover"
    />
    <chat-operation-open
      icon="display"
      target="scene-list-window"
      @hover="onHover"
    />
    <chat-operation-open
      icon="stack"
      target="card-deck-list-window"
      @hover="onHover"
    />
    <chat-operation-open
      icon="library"
      target="media-list-window"
      @hover="onHover"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import ActorStatusSelect from "../common/components/select/ActorStatusSelect.vue";
import BcdiceSystemInput from "../common/components/BcdiceSystemInput.vue";
import ComponentVue from "../../core/window/ComponentVue";
import { WindowInfo } from "@/@types/window";
import SButton from "../common/components/SButton.vue";
import SelfActorSelect from "../common/components/select/SelfActorSelect.vue";
import VueEvent from "../../core/decorator/VueEvent";
import ChatOperationOpen from "@/app/basic/chat/ChatOperationOpen.vue";

@Component({
  components: {
    ChatOperationOpen,
    SelfActorSelect,
    ActorStatusSelect,
    BcdiceSystemInput,
    SButton
  }
})
export default class ChatOperationLine extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private windowInfo!: WindowInfo<any>;

  // actorKey
  @Prop({ type: String, required: true })
  private actorKey!: string;
  private actorKeyVolatile: string = "";
  @Watch("actorKey", { immediate: true })
  private onChangeActorKey(value: string) {
    this.actorKeyVolatile = value;
  }
  @Watch("actorKeyVolatile")
  private onChangeActorKeyVolatile(value: string) {
    this.$emit("update:actorKey", value);
  }

  // statusKey
  @Prop({ type: String, required: true })
  private statusKey!: string;
  private statusKeyVolatile: string = "";
  @Watch("statusKey", { immediate: true })
  private onChangeStatusKey(value: string) {
    this.statusKeyVolatile = value;
  }
  @Watch("statusKeyVolatile")
  private onChangeStatusKeyVolatile(value: string) {
    this.$emit("update:statusKey", value);
  }

  // system
  @Prop({ type: String, required: true })
  private system!: string;
  private systemVolatile: string = "";
  @Watch("system", { immediate: true })
  private onChangeSystem(value: string) {
    this.systemVolatile = value;
  }
  @Watch("systemVolatile")
  private onChangeSystemVolatile(value: string) {
    this.$emit("update:system", value);
  }

  // bcdiceUrl
  @Prop({ type: String, required: true })
  private bcdiceUrl!: string;
  private bcdiceUrlVolatile: string = "";
  @Watch("bcdiceUrl", { immediate: true })
  private onChangeBcdiceUrl(value: string) {
    this.bcdiceUrlVolatile = value;
  }
  @Watch("bcdiceUrlVolatile")
  private onChangeBcdiceUrlVolatile(value: string) {
    this.$emit("update:bcdiceUrl", value);
  }

  @VueEvent
  private onMouseEnterUrl(isHover: boolean) {
    this.windowInfo.message = isHover
      ? this.$t("label.input-bcdice-url")!.toString()
      : "";
  }

  @VueEvent
  private onHover(message: string) {
    this.windowInfo.message = message;
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.operation-line-container {
  @include inline-flex-box(row, flex-start, center);
  height: 2em;
  margin-bottom: 0.5rem;
  overflow-x: hidden;

  > * {
    flex-shrink: 0;
  }

  > label {
    @include flex-box(row, center, center);
  }
}
</style>
