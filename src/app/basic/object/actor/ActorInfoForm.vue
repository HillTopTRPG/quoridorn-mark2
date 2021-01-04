<template>
  <div class="actor-info-form">
    <table class="info-table">
      <!-- 名前 -->
      <tr>
        <tr-string-input-component
          labelName="label.name"
          v-model="nameVolatile"
          :placeholder="$t('label.require-text')"
        />
      </tr>
      <!-- タグ -->
      <tr>
        <tr-string-input-component
          labelName="label.tag"
          v-model="tagVolatile"
        />
      </tr>
      <!-- チャット文字色 -->
      <tr>
        <tr-chat-color-input-component
          labelName="label.chat-font-color"
          :actorType="actorType"
          :type.sync="chatFontColorTypeVolatile"
          :color.sync="chatFontColorVolatile"
        />
      </tr>
      <!-- 立ち絵位置 -->
      <tr>
        <tr-range-component
          labelName="label.stand-image-position"
          :min="1"
          :max="12"
          v-model="standImagePositionVolatile"
        />
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import ComponentVue from "../../../core/window/ComponentVue";
import TrStringInputComponent from "../../common/components/TrStringInputComponent.vue";
import TrChatColorInputComponent from "../../common/components/TrChatColorInputComponent.vue";
import TrRangeComponent from "../../common/components/TrRangeComponent.vue";
import LifeCycle from "../../../core/decorator/LifeCycle";

@Component({
  components: {
    TrRangeComponent,
    TrChatColorInputComponent,
    TrStringInputComponent
  }
})
export default class ActorInfoForm extends Mixins<ComponentVue>(ComponentVue) {
  private isMounted: boolean = false;

  @Prop({ type: String, required: true })
  private actorType!: "user" | "character";

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

  // tag
  @Prop({ type: String, required: true })
  private tag!: string;
  private tagVolatile: string = "";
  @Watch("tag", { immediate: true })
  private onChangeTag(value: string) {
    this.tagVolatile = value;
  }
  @Watch("tagVolatile")
  private onChangeTagVolatile(value: string) {
    this.$emit("update:tag", value);
  }

  // chatFontColorType
  @Prop({ type: String, required: true })
  private chatFontColorType!: string;
  private chatFontColorTypeVolatile: string = "owner";
  @Watch("chatFontColorType", { immediate: true })
  private onChangeChatFontColorType(value: string) {
    this.chatFontColorTypeVolatile = value;
  }
  @Watch("chatFontColorTypeVolatile")
  private onChangeChatFontColorTypeVolatile(value: string) {
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

  // standImagePosition
  @Prop({ type: Number, required: true })
  private standImagePosition!: number;
  private standImagePositionVolatile: number = 1;
  @Watch("standImagePosition", { immediate: true })
  private onChangeStandImagePosition(value: number) {
    this.standImagePositionVolatile = value;
  }
  @Watch("standImagePositionVolatile")
  private onChangeStandImagePositionVolatile(value: number) {
    this.$emit("update:standImagePosition", value);
  }

  @LifeCycle
  public async mounted() {
    this.isMounted = true;
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.actor-info-form {
  display: contents;
}
</style>
