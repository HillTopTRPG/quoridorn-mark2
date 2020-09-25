<template>
  <card-deck-sub-container-component
    message="choose-back-image"
    @back="$emit('back')"
    @next="$emit('next')"
    :nextDisabled="!backImageKeyVolatile"
  >
    <label>
      <span v-t="'label.background-color'"></span>
      <color-picker-component v-model="colorVolatile" :use-alpha="false" />
    </label>
    <image-picker-component
      class="image-picker-component"
      v-model="backImageKeyVolatile"
      :windowKey="key"
      :imageTag.sync="imageTagVolatile"
      :isSimple="true"
      imageSize="20em"
    />
  </card-deck-sub-container-component>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import { Prop, Watch } from "vue-property-decorator";
import CardDeckSubContainerComponent from "./CardDeckSubContainerComponent.vue";
import ComponentVue from "../../../core/window/ComponentVue";
import ImagePickerComponent from "../../../core/component/ImagePickerComponent.vue";
import ColorPickerComponent from "../../../core/component/ColorPickerComponent.vue";

@Component({
  components: {
    ColorPickerComponent,
    CardDeckSubContainerComponent,
    ImagePickerComponent
  }
})
export default class CardDeckChooseBackImageComponent extends Mixins<
  ComponentVue
>(ComponentVue) {
  // color
  @Prop({ type: String, required: true })
  private color!: string;
  private colorVolatile: string = "#ffffff";
  @Watch("color", { immediate: true })
  private onChangeColor(value: string) {
    this.colorVolatile = value;
  }
  @Watch("colorVolatile")
  private onChangeColorVolatile(value: string) {
    this.$emit("update:color", value);
  }

  // backImageKey
  @Prop({ type: String, required: true })
  private backImageKey!: string;
  private backImageKeyVolatile: string = "";
  @Watch("backImageKey", { immediate: true })
  private onChangeBackImageKey(value: string) {
    this.backImageKeyVolatile = value;
  }
  @Watch("backImageKeyVolatile")
  private onChangeBackImageKeyVolatile(value: string) {
    this.$emit("update:backImageKey", value);
  }

  // imageTag
  @Prop({ required: true })
  private imageTag!: string | null;
  private imageTagVolatile: string | null = null;
  @Watch("imageTag", { immediate: true })
  private onChangeImageTag(value: string | null) {
    this.imageTagVolatile = value;
  }
  @Watch("imageTagVolatile")
  private onChangeImageTagVolatile(value: string | null) {
    this.$emit("update:imageTag", value);
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.image-picker-component {
  flex: 1;
  align-self: stretch;
  overflow: hidden;
}
</style>
