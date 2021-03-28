<template>
  <div class="container" ref="window-container">
    <character-info-form
      :windowKey="windowKey"
      v-if="isMounted"
      :isAdd="false"
      :docKey="docKey"
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
    />

    <button-area
      :is-commit-able="isCommitAble"
      commit-text="modify"
      @commit="commit()"
      @rollback="rollback()"
    />
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import CharacterInfoForm from "@/app/basic/object/character/CharacterInfoForm.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import MapObjectEditWindowVue from "@/app/core/window/MapObjectEditWindowVue";

@Component({ components: { ButtonArea, CharacterInfoForm } })
export default class CharacterEditWindow extends MapObjectEditWindowVue {
  protected hasOtherText: boolean = true;
  protected sizeType: "size" | "wh" = "size";

  private sceneObjectList = GameObjectManager.instance.sceneObjectList;

  private get isCommitAble() {
    return !this.isDuplicate && !!this.name;
  }

  private get isDuplicate(): boolean {
    const data = this.sceneObjectList.find(so => so.key === this.docKey);
    return this.actorList.some(
      ct => ct.data!.name === this.name && ct.key !== data!.data!.actorKey
    );
  }

  @Watch("isDuplicate")
  private onChangeIsDuplicate() {
    this.windowInfo.message = this.isDuplicate
      ? this.$t("message.duplicate", {
          text: this.$t("label.name")
        })!.toString()
      : "";
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.container {
  display: grid;
  grid-template-rows: 12em 1fr calc(2em + 0.5rem);
  grid-template-columns: 12em 1fr;
  width: 100%;
  height: 100%;
}

.button-area {
  grid-row: 3 / 4;
  grid-column: 1 / 3;
}
</style>
