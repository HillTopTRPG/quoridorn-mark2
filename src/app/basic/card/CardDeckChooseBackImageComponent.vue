<template>
  <card-deck-sub-container-component
    message="choose-back-image"
    :messageArg="{ name }"
    @back="$emit('back')"
    @next="$emit('next')"
    :nextDisabled="!backImageIdVolatile"
  >
    <label>
      <color-picker-component v-model="colorVolatile" :use-alpha="false" />
    </label>
    <image-picker-component
      class="image-picker-component"
      v-model="backImageIdVolatile"
      :windowKey="key"
      :imageTag.sync="tagVolatile"
      :isSimple="true"
      imageSize="20em"
    />
  </card-deck-sub-container-component>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Prop, Watch } from "vue-property-decorator";
import ImagePickerComponent from "@/app/core/component/ImagePickerComponent.vue";
import CardDeckSubContainerComponent from "@/app/basic/card/CardDeckSubContainerComponent.vue";
import ColorPickerComponent from "@/app/core/component/ColorPickerComponent.vue";

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
  // name
  @Prop({ type: String, required: true })
  private name!: string;

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
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.image-picker-component {
  flex: 1;
  align-self: stretch;
  overflow: hidden;
}
</style>
