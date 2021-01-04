<template>
  <div class="image-picker-component" @contextmenu.prevent ref="elm">
    <div class="operate-box">
      <s-check
        class="view-check"
        v-model="isSimpleVolatile"
        colorStyle="skyblue"
        c-icon=""
        :c-label="$t('label.simple')"
        n-icon=""
        :n-label="$t('label.detail')"
        @hover="onHoverThumbnailView"
      />
      <input
        type="text"
        class="search-name"
        :value="searchText"
        @input="searchText = $event.target.value"
        :placeholder="$t('label.search-name-box')"
        @keydown.enter.prevent.stop
        @keyup.enter.prevent.stop
        @keydown.229.prevent.stop
        @keyup.229.prevent.stop
      />
    </div>
    <!-- 画像選択エリア -->
    <div
      class="chose-media"
      :class="isSimpleVolatile ? 'simple-mode' : 'detail-mode'"
      :style="{ '--size': imageSize }"
    >
      <image-item-component
        v-for="media in useMediaList"
        :key="media.key"
        :is-selected="value === media.key"
        :media="media"
        :is-simple="isSimpleVolatile"
        @select="localValue = media.key"
      />
    </div>

    <!-- 絞り込み情報 -->
    <table>
      <tr>
        <tr-media-tag-select-component
          label-name="label.tag"
          v-model="selectMediaTag"
          :filter-list="['image']"
          :selected-info-text="selectedTagIndexText"
        />
      </tr>
      <tr v-if="!isDisabledDirection">
        <tr-direction-type-select-component
          label-name="selection.direction.label"
          v-model="directionVolatile"
        />
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import LifeCycle from "../decorator/LifeCycle";
import { Mixins } from "vue-mixin-decorator";
import ComponentVue from "../window/ComponentVue";
import { MediaStore } from "@/@types/store-data";
import CtrlButton from "./CtrlButton.vue";
import GameObjectManager from "../../basic/GameObjectManager";
import DirectionTypeSelect from "../../basic/common/components/select/DirectionTypeSelect.vue";
import VueEvent from "../decorator/VueEvent";
import { Direction } from "@/@types/store-data-optional";
import SCheck from "@/app/basic/common/components/SCheck.vue";
import TrMediaTagSelectComponent from "@/app/basic/common/components/TrMediaTagSelectComponent.vue";
import ImageItemComponent from "@/app/core/component/ImageItemComponent.vue";
import TrDirectionTypeSelectComponent from "@/app/basic/common/components/TrDirectionTypeSelectComponent.vue";

@Component({
  components: {
    TrDirectionTypeSelectComponent,
    ImageItemComponent,
    TrMediaTagSelectComponent,
    SCheck,
    CtrlButton,
    DirectionTypeSelect
  }
})
export default class ImagePickerComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private windowKey!: string;

  @Prop({ type: String, default: null })
  private value!: string | null;

  @Prop({ type: String, default: null })
  private mediaTag!: string | null;

  // direction
  @Prop({ type: String, default: "none" })
  private direction!: Direction;
  private directionVolatile: Direction = "none";
  @Watch("direction", { immediate: true })
  private onChangeDirection(value: Direction) {
    this.directionVolatile = value;
  }
  @Watch("directionVolatile")
  private onChangeDirectionVolatile(value: Direction) {
    this.$emit("update:direction", value);
  }

  @Prop({ type: Boolean, default: false })
  private viewName!: boolean;

  @Prop({ type: Boolean, default: false })
  private isDisabledDirection!: boolean;

  @Prop({ type: String, default: "4em" })
  private imageSize!: string;

  private isMounted: boolean = false;
  private selectMediaTag: string | null = null;

  private rawMediaList: StoreData<MediaStore>[] = [];
  private useMediaList: StoreData<MediaStore>[] = [];
  private searchText: string = "";

  // isSimple
  @Prop({ type: Boolean, required: true })
  private isSimple!: boolean;
  private isSimpleVolatile: boolean = false;
  @Watch("isSimple", { immediate: true })
  private onChangeIsViewThumbnail(value: boolean) {
    this.isSimpleVolatile = value;
  }
  @Watch("isSimpleVolatile")
  private onChangeIsViewThumbnailVolatile(value: boolean) {
    this.$emit("update:isSimple", value);
  }

  @Watch("isMounted")
  @Watch("selectMediaTag")
  @Watch("searchText")
  @Watch("rawMediaList", { deep: true })
  private async onChangeImageList() {
    if (!this.isMounted) return;
    const regExp = this.searchText ? new RegExp(this.searchText) : null;
    this.useMediaList = this.rawMediaList.filter(d => {
      if (!d || !d.data) return false;
      if (regExp && !d.data.name.match(regExp)) return false;
      if (this.selectMediaTag === null) return d.data.tag === "";
      return d.data.tag === this.selectMediaTag;
    });
  }

  @VueEvent
  private get selectedTagIndexText() {
    const index = this.useMediaList.findIndex(
      image => image.key === this.localValue
    );
    return `${index + 1}/${this.useMediaList.length}`;
  }

  @LifeCycle
  private mounted() {
    this.rawMediaList = GameObjectManager.instance.mediaList.filter(
      media => media.data!.urlType === "image"
    );
    this.isMounted = true;
  }

  private get localValue(): string | null {
    return this.value;
  }

  private set localValue(colorStr: string | null) {
    this.input(colorStr);
  }

  public input(colorStr: string | null) {
    this.$emit("input", colorStr);
  }

  @Watch("mediaTag", { immediate: true })
  private onChangeImageTag(value: string) {
    this.selectMediaTag = value;
  }

  @Watch("selectMediaTag")
  private onChangeSelectImageTag() {
    this.$emit("update:mediaTag", this.selectMediaTag);
  }

  private get elm(): HTMLDivElement {
    return this.$refs.elm as HTMLDivElement;
  }

  public focus() {
    this.elm.focus();
  }

  @VueEvent
  private onHoverThumbnailView(isHover: boolean) {
    this.$emit("hoverThumbnail", isHover);
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.flex-space-between {
  width: 100%;
  @include flex-box(row, space-between, center);
}

.search-name {
  @include inline-flex-box(row, flex-start, center);
  font-size: inherit;
  height: 2em;
  min-height: 2em;
}

.operate-box {
  @include flex-box(row, space-between, center);
  border: solid gray 1px;
  border-bottom: none;
  padding: 0.2rem 0.5rem;
}

.image-picker-component {
  @include flex-box(column, stretch, flex-start);

  table {
    width: 100%;

    th,
    td {
      padding: 0;
    }

    th {
      width: 1px;
      white-space: nowrap;
      text-align: right;
    }
  }

  .chose-media {
    overflow-y: scroll;
    flex: 1;
    border: solid gray 1px;
    box-sizing: border-box;
    width: 100%;

    &.simple-mode {
      @include flex-box(row, flex-start, flex-start, wrap);
    }

    &.detail-mode {
      @include flex-box(column, stretch, flex-start);
    }
  }
}
</style>
