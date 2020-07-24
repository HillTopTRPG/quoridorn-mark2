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

    <s-button icon="user" @hover="hover3" @click="open3()" />
    <s-button icon="users" @hover="hover4" @click="open4()" />

    <!-- ダイスボット選択 -->
    <bcdice-system-input
      v-model="systemVolatile"
      :url.sync="bcdiceUrlVolatile"
      :windowInfo="windowInfo"
      @onMouseEnterUrl="onMouseEnterUrl"
    />

    <!-- ショートカットボタン -->
    <s-button icon="tv" @hover="hover1" @click="open1()" />
    <s-button icon="display" @hover="hover2" @click="open2()" />
    <s-button icon="stack" @hover="hover5" @click="open5()" />
    <s-button icon="library" @hover="hover6" @click="open6()" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import ActorStatusSelect from "../common/components/select/ActorStatusSelect.vue";
import BcdiceSystemInput from "../common/components/BcdiceSystemInput.vue";
import ComponentVue from "../../core/window/ComponentVue";
import LanguageManager from "../../../LanguageManager";
import { WindowInfo } from "../../../@types/window";
import SButton from "../common/components/SButton.vue";
import SelfActorSelect from "../common/components/select/SelfActorSelect.vue";
import VueEvent from "../../core/decorator/VueEvent";
import App from "../../../views/App.vue";

@Component({
  components: {
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
      ? LanguageManager.instance.getText("label.input-bcdice-url")
      : "";
  }

  @VueEvent
  private hover(titleType: string, flg: boolean) {
    this.windowInfo.message = flg
      ? LanguageManager.instance.getText(
          `chat-window.shortcut-title.${titleType}`
        )
      : "";
  }

  @VueEvent
  private async open(windowType: string) {
    await App.openSimpleWindow(windowType);
  }

  @VueEvent
  private hover1(flg: boolean) {
    this.hover("cut-in", flg);
  }

  @VueEvent
  private async open1() {
    await this.open("cut-in-list-window");
  }

  @VueEvent
  private hover2(flg: boolean) {
    this.hover("scene-list", flg);
  }

  @VueEvent
  private async open2() {
    await this.open("scene-list-window");
  }

  @VueEvent
  private hover3(flg: boolean) {
    this.hover("add-actor", flg);
  }

  @VueEvent
  private async open3() {
    await this.open("actor-add-window");
  }

  @VueEvent
  private hover4(flg: boolean) {
    this.hover("actor-list", flg);
  }

  @VueEvent
  private async open4() {
    await this.open("player-box-window");
  }

  @VueEvent
  private hover5(flg: boolean) {
    this.hover("card-deck-list", flg);
  }

  @VueEvent
  private async open5() {
    await this.open("card-deck-list-window");
  }

  @VueEvent
  private hover6(flg: boolean) {
    this.hover("media-list", flg);
  }

  @VueEvent
  private async open6() {
    await this.open("media-list-window");
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
