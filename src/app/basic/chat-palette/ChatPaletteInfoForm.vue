<template>
  <div class="chat-palette-info-form">
    <table>
      <tr>
        <tr-string-input-component
          labelName="name"
          width="100%"
          v-model="nameVolatile"
        />
      </tr>
      <tr>
        <tr-chat-color-input-component
          labelName="chat-font-color"
          :type.sync="chatFontColorTypeVolatile"
          :color.sync="chatFontColorVolatile"
        />
      </tr>
      <!-- アクターID -->
      <tr>
        <tr-actor-select-component
          labelName="actor"
          v-model="actorIdVolatile"
          :nullable="true"
        />
      </tr>
      <!-- コマID -->
      <tr>
        <tr-scene-object-select-component
          labelName="scene-object"
          :actorId="actorId"
          v-model="sceneObjectIdVolatile"
          :nullable="true"
        />
      </tr>
      <!-- targetId -->
      <!-- outputTabId -->
      <!-- ステータス -->
      <tr>
        <tr-actor-status-select-component
          labelName="status"
          :actorId="actorId"
          v-model="statusIdVolatile"
          :nullable="true"
        />
      </tr>
      <!-- 秘匿フラグ -->
      <tr>
        <tr-checkbox-component
          labelName="secret"
          :cLabel="$t('label.secret')"
          :nLabel="$t('label.non-secret')"
          v-model="isSecretVolatile"
        />
      </tr>
    </table>

    <!-- テキストタブ -->
    <label>
      <textarea class="input" v-model="paletteTextVolatile"></textarea>
    </label>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import TrStringInputComponent from "@/app/basic/common/components/TrStringInputComponent.vue";
import TrNumberInputComponent from "@/app/basic/common/components/TrNumberInputComponent.vue";
import ComponentVue from "@/app/core/window/ComponentVue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TrChatColorInputComponent from "@/app/basic/common/components/TrChatColorInputComponent.vue";
import TrGeneralTypeSelectComponent from "@/app/basic/common/components/TrGeneralTypeSelectComponent.vue";
import TrActorStatusSelectComponent from "@/app/basic/common/components/TrActorStatusSelectComponent.vue";
import TrActorSelectComponent from "@/app/basic/common/components/TrActorSelectComponent.vue";
import TrSceneObjectSelectComponent from "@/app/basic/common/components/TrSceneObjectSelectComponent.vue";
import TrCheckboxComponent from "@/app/basic/common/components/TrCheckboxComponent.vue";

@Component({
  components: {
    TrCheckboxComponent,
    TrSceneObjectSelectComponent,
    TrActorSelectComponent,
    TrActorStatusSelectComponent,
    TrGeneralTypeSelectComponent,
    TrChatColorInputComponent,
    TrNumberInputComponent,
    TrStringInputComponent
  }
})
export default class ChatPaletteInfoForm extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private windowKey!: string;

  @Prop({ type: Boolean, required: true })
  private isAdd!: boolean;

  private isMounted: boolean = false;

  @LifeCycle
  public async mounted() {
    this.isMounted = true;
  }

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

  // paletteText
  @Prop({ type: String, required: true })
  private paletteText!: string;
  private paletteTextVolatile: string = "";
  @Watch("paletteText", { immediate: true })
  private onChangePaletteText(value: string) {
    this.paletteTextVolatile = value;
  }
  @Watch("paletteTextVolatile")
  private onChangePaletteTextVolatile(value: string) {
    this.$emit("update:paletteText", value);
  }

  // chatFontColorType
  @Prop({ type: String, required: true })
  private chatFontColorType!: "owner" | "original";
  private chatFontColorTypeVolatile: "owner" | "original" = "owner";
  @Watch("chatFontColorType", { immediate: true })
  private onChangeChatFontColorType(value: "owner" | "original") {
    this.chatFontColorTypeVolatile = value;
  }
  @Watch("chatFontColorTypeVolatile")
  private onChangeChatFontColorTypeVolatile(value: "owner" | "original") {
    this.$emit("update:chatFontColorType", value);
  }

  // chatFontColor
  @Prop({ type: String, required: true })
  private chatFontColor!: string;
  private chatFontColorVolatile: string = "#000000";
  @Watch("chatFontColor", { immediate: true })
  private onChangeChatFontColor(value: string) {
    this.chatFontColorVolatile = value;
  }
  @Watch("chatFontColorVolatile")
  private onChangeChatFontColorVolatile(value: string) {
    this.$emit("update:chatFontColor", value);
  }

  // actorId
  @Prop({ type: String, default: null })
  private actorId!: string | null;
  private actorIdVolatile: string | null = null;
  @Watch("actorId", { immediate: true })
  private onChangeActorId(value: string | null) {
    this.actorIdVolatile = value;
  }
  @Watch("actorIdVolatile")
  private onChangeActorIdVolatile(value: string | null) {
    this.$emit("update:actorId", value);
  }

  // sceneObjectId
  @Prop({ type: String, default: null })
  private sceneObjectId!: string | null;
  private sceneObjectIdVolatile: string | null = null;
  @Watch("sceneObjectId", { immediate: true })
  private onChangeSceneObjectId(value: string | null) {
    this.sceneObjectIdVolatile = value;
  }
  @Watch("sceneObjectIdVolatile")
  private onChangeSceneObjectIdVolatile(value: string | null) {
    this.$emit("update:sceneObjectId", value);
  }

  // targetId
  @Prop({ type: String, default: null })
  private targetId!: string | null;
  private targetIdVolatile: string | null = null;
  @Watch("targetId", { immediate: true })
  private onChangeTargetId(value: string | null) {
    this.targetIdVolatile = value;
  }
  @Watch("targetIdVolatile")
  private onChangeTargetIdVolatile(value: string | null) {
    this.$emit("update:targetId", value);
  }

  // outputTabId
  @Prop({ type: String, default: null })
  private outputTabId!: string | null;
  private outputTabIdVolatile: string | null = null;
  @Watch("outputTabId", { immediate: true })
  private onChangeOutputTabId(value: string | null) {
    this.outputTabIdVolatile = value;
  }
  @Watch("outputTabIdVolatile")
  private onChangeOutputTabIdVolatile(value: string | null) {
    this.$emit("update:outputTabId", value);
  }

  // statusId
  @Prop({ type: String, default: null })
  private statusId!: string | null;
  private statusIdVolatile: string | null = null;
  @Watch("statusId", { immediate: true })
  private onChangeStatusId(value: string | null) {
    this.statusIdVolatile = value;
  }
  @Watch("statusIdVolatile")
  private onChangeStatusIdVolatile(value: string | null) {
    this.$emit("update:statusId", value);
  }

  // system
  @Prop({ type: String, default: null })
  private system!: string | null;
  private systemVolatile: string | null = null;
  @Watch("system", { immediate: true })
  private onChangeSystem(value: string | null) {
    this.systemVolatile = value;
  }
  @Watch("systemVolatile")
  private onChangeSystemVolatile(value: string | null) {
    this.$emit("update:system", value);
  }

  // isSecret
  @Prop({ type: Boolean, required: true })
  private isSecret!: boolean;
  private isSecretVolatile: boolean = false;
  @Watch("isSecret", { immediate: true })
  private onChangeIsSecret(value: boolean) {
    this.isSecretVolatile = value;
  }
  @Watch("isSecretVolatile")
  private onChangeIsSecretVolatile(value: boolean) {
    this.$emit("update:isSecret", value);
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.chat-palette-info-form {
  display: contents;
}

> table {
  table-layout: fixed;

  th,
  td {
    label {
      @include inline-flex-box(row, flex-start, center);
    }
  }

  th {
    text-align: right;
    padding: 0;
    white-space: nowrap;
    width: 1px;
  }

  td {
    text-align: left;
    padding: 0;

    input {
      margin: 0;
    }
  }
}

label {
  flex: 1;
}

textarea {
  resize: none;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}
</style>
