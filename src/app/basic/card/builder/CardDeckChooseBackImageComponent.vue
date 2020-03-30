<template>
  <card-deck-sub-container-component
    message="choose-back-image"
    @back="$emit('back')"
    @next="$emit('next')"
    :nextDisabled="!backImageIdVolatile"
  >
    <label>
      <span v-t="'label.background-color'"></span>
      <color-picker-component v-model="colorVolatile" :use-alpha="false" />
    </label>
    <image-picker-component
      class="image-picker-component"
      v-model="backImageIdVolatile"
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
import ColorPickerComponent from "@/app/core/component/ColorPickerComponent.vue";
import CardDeckSubContainerComponent from "@/app/basic/card/builder/CardDeckSubContainerComponent.vue";
import ImagePickerComponent from "@/app/core/component/ImagePickerComponent.vue";
import ComponentVue from "@/app/core/window/ComponentVue";

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

  // backImageId
  @Prop({ type: String, required: true })
  private backImageId!: string;
  private backImageIdVolatile: string = "";
  @Watch("backImageId", { immediate: true })
  private onChangeBackImageId(value: string) {
    this.backImageIdVolatile = value;
  }
  @Watch("backImageIdVolatile")
  private onChangeBackImageIdVolatile(value: string) {
    this.$emit("update:backImageId", value);
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
