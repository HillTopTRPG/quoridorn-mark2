<template>
  <div class="media-url-info-form">
    <table>
      <tr>
        <tr-string-input-component
          labelName="label.name"
          width="100%"
          v-model="nameVolatile"
          :placeholder="$t('label.require-text')"
        />
      </tr>
      <tr>
        <tr-string-input-component
          labelName="label.tag"
          width="100%"
          v-model="tagVolatile"
        />
      </tr>
      <tr>
        <tr-string-input-component
          labelName="label.url"
          width="100%"
          v-model="urlVolatile"
          :placeholder="$t('label.require-text')"
        />
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import TrStringInputComponent from "@/app/basic/common/components/table-item/TrStringInputComponent.vue";

@Component({ components: { TrStringInputComponent } })
export default class MediaUrlInfoForm extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private windowKey!: string;

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

  // url
  @Prop({ type: String, required: true })
  private url!: string;
  private urlVolatile: string = "";
  @Watch("url", { immediate: true })
  private onChangeUrl(value: string) {
    this.urlVolatile = value;
  }
  @Watch("urlVolatile")
  private onChangeUrlVolatile(value: string) {
    this.$emit("update:url", value);
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.media-url-info-form {
  display: contents;
}
</style>
