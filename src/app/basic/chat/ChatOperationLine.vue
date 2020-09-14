<template>
  <div class="operation-line-container">
    <!-- アクター選択 -->
    <label>
      <span>{{ $t("label.name") }}</span>
      <self-actor-select v-model="actorIdVolatile" />
    </label>

    <!-- ステータス選択 -->
    <label>
      <actor-status-select
        :actorId="actorIdVolatile"
        v-model="statusIdVolatile"
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

  // actorId
  @Prop({ type: String, required: true })
  private actorId!: string;
  private actorIdVolatile: string = "";
  @Watch("actorId", { immediate: true })
  private onChangeActorId(value: string) {
    this.actorIdVolatile = value;
  }
  @Watch("actorIdVolatile")
  private onChangeActorIdVolatile(value: string) {
    this.$emit("update:actorId", value);
  }

  // statusId
  @Prop({ type: String, required: true })
  private statusId!: string;
  private statusIdVolatile: string = "";
  @Watch("statusId", { immediate: true })
  private onChangeStatusId(value: string) {
    this.statusIdVolatile = value;
  }
  @Watch("statusIdVolatile")
  private onChangeStatusIdVolatile(value: string) {
    this.$emit("update:statusId", value);
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
