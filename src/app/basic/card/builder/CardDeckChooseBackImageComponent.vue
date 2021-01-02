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
      :mediaTag.sync="mediaTagVolatile"
      :isDisabledDirection="true"
      imageSize="20em"
      :is-simple.sync="isSimple"
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
  private isSimple: boolean = true;

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

  // mediaTag
  @Prop({ required: true })
  private mediaTag!: string | null;
  private mediaTagVolatile: string | null = null;
  @Watch("mediaTag", { immediate: true })
  private onChangeImageTag(value: string | null) {
    this.mediaTagVolatile = value;
  }
  @Watch("mediaTagVolatile")
  private onChangeImageTagVolatile(value: string | null) {
    this.$emit("update:mediaTag", value);
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
