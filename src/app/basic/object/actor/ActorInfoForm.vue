<template>
  <div class="actor-info-form">
    <table class="info-table">
      <!-- 名前 -->
      <tr>
        <tr-string-input-component
          labelName="name"
          v-model="nameVolatile"
          :placeholder="$t('label.require-text')"
        />
      </tr>
      <!-- タグ -->
      <tr>
        <tr-string-input-component labelName="tag" v-model="tagVolatile" />
      </tr>
      <!-- チャット文字色 -->
      <tr>
        <tr-chat-color-input-component
          labelName="chat-font-color"
          :type.sync="chatFontColorTypeVolatile"
          :color.sync="chatFontColorVolatile"
        />
      </tr>
      <!-- 立ち絵位置 -->
      <tr>
        <tr-range-component
          labelName="stand-image-position"
          :min="1"
          :max="12"
          v-model="standImagePositionVolatile"
        />
      </tr>
      <!-- データの有無 -->
      <tr>
        <tr-checkbox-component
          labelName="has-data"
          :cLabel="$t('label.exist')"
          :nLabel="$t('label.not-exist')"
          v-model="isUseTableDataVolatile"
        />
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import ColorPickerComponent from "@/app/core/component/ColorPickerComponent.vue";
import BaseInput from "@/app/core/component/BaseInput.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import SeekBarComponent from "@/app/basic/cut-in/bgm/SeekBarComponent.vue";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import SceneLayerSelect from "@/app/basic/common/components/select/SceneLayerSelect.vue";
import TrStringInputComponent from "@/app/basic/common/components/TrStringInputComponent.vue";
import TrNumberInputComponent from "@/app/basic/common/components/TrNumberInputComponent.vue";
import TrColorPickerComponent from "@/app/basic/common/components/TrColorPickerComponent.vue";
import ComponentVue from "@/app/core/window/ComponentVue";
import TrRangeComponent from "@/app/basic/common/components/TrRangeComponent.vue";
import TrCheckboxComponent from "@/app/basic/common/components/TrCheckboxComponent.vue";
import TrChatColorInputComponent from "@/app/basic/common/components/TrChatColorInputComponent.vue";

@Component({
  components: {
    TrChatColorInputComponent,
    TrCheckboxComponent,
    TrRangeComponent,
    TrColorPickerComponent,
    TrNumberInputComponent,
    TrStringInputComponent,
    SceneLayerSelect,
    SimpleTabComponent,
    ColorPickerComponent,
    BaseInput,
    SeekBarComponent,
    CtrlButton
  }
})
export default class ActorInfoForm extends Mixins<ComponentVue>(ComponentVue) {
  private isMounted: boolean = false;

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

  // isUseTableData
  @Prop({ type: Boolean, required: true })
  private isUseTableData!: boolean;
  private isUseTableDataVolatile: boolean = false;
  @Watch("isUseTableData", { immediate: true })
  private onChangeIsUseTableData(value: boolean) {
    this.isUseTableDataVolatile = value;
  }
  @Watch("isUseTableDataVolatile")
  private onChangeIsUseTableDataVolatile(value: boolean) {
    this.$emit("update:isUseTableData", value);
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
