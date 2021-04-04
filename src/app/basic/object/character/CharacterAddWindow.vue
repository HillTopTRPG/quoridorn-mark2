<template>
  <div class="container" ref="window-container">
    <character-info-form
      :windowKey="windowKey"
      :isAdd="true"
      initTabTarget="image"
      :name.sync="name"
      :tag.sync="tag"
      :otherTextList.sync="otherTextList"
      :url.sync="url"
      :size.sync="size"
      :mediaKey.sync="mediaKey"
      :mediaTag.sync="mediaTag"
      :direction.sync="direction"
      :backgroundSize.sync="backgroundSize"
      :layerKey.sync="layerKey"
      @drag-start="dragStart"
      @drag-end="dragEndExtend"
    />
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import MapObjectAddWindowVue from "@/app/core/window/MapObjectAddWindowVue";
import CharacterInfoForm from "@/app/basic/object/character/CharacterInfoForm.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import { convertNumberZero } from "@/app/core/utility/PrimaryDataUtility";
import { SceneObjectType } from "@/@types/store-data-optional";

@Component({ components: { CharacterInfoForm } })
export default class CharacterAddWindow extends MapObjectAddWindowVue {
  protected type: SceneObjectType = "character";
  protected textureType: "color" | "image" = "image";
  protected hasOtherText: boolean = true;
  protected sizeType: "size" | "wh" = "size";

  @LifeCycle
  public async mounted() {
    await this.initExtend();
    this.mediaTag = this.$t("type.character")!.toString();
    this.name = this.getUnDuplicateName();
  }

  private setNextName() {
    const numberSuffixRegExp = /(.+)([0-9]+)/;
    if (numberSuffixRegExp.test(this.name)) {
      this.name = this.name.replace(
        numberSuffixRegExp,
        (m, p1, p2) => `${p1}${convertNumberZero(p2) + 1}`
      );
    } else {
      this.name = `${this.name}2`;
    }
  }

  private getUnDuplicateName(): string {
    if (!this.actorList.some(ct => ct.data!.name === this.name))
      return this.name;

    this.setNextName();
    return this.getUnDuplicateName();
  }

  @Watch("isDuplicate")
  @Watch("mediaKey", { immediate: true })
  private onChangeImageDocKey() {
    if (this.isDuplicate) {
      this.windowInfo.message = this.$t("message.duplicate", {
        text: this.$t("label.name")
      }).toString();
    } else {
      this.windowInfo.message = this.$t(
        this.mediaKey ? "message.drag-piece" : "message.choose-image"
      )!.toString();
    }
  }

  private get isDuplicate(): boolean {
    return this.actorList.some(ct => ct.data!.name === this.name);
  }

  @VueEvent
  protected async dragEndExtend() {
    await this.dragEnd();
    this.setNextName();
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.container {
  display: grid;
  grid-template-rows: 12em 1fr;
  grid-template-columns: 12em 1fr;
  width: 100%;
  height: 100%;
}
</style>
